// Twilio <-> xAI Grok Voice bridge (inbound + outbound).
// xAI realtime ONLY emits/consumes PCM16 24kHz (it ignores the audio-format field),
// so this bridge transcodes: Twilio μ-law 8k  <->  xAI PCM16 24k. Integer 3x resample.
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { sessionConfig, TIMEZONE } from './agent.mjs';

const PORT = process.env.PORT || 8080;
const XAI_KEY = process.env.XAI_API_KEY;
const PUBLIC_HOST = process.env.PUBLIC_HOST || '';
const BOOK_URL = process.env.BOOK_URL || '';          // the web app's /api/book
const XAI_URL = 'wss://api.x.ai/v1/realtime?model=grok-voice-think-fast-1.0';
// Twilio creds for OUTBOUND calls (lead comes in -> agent calls them)
const TW_SID = process.env.TWILIO_SID || '';
const TW_AUTH = process.env.TWILIO_AUTH || '';
const TW_FROM = process.env.TWILIO_NUMBER || '';

function nowIso() {
  return new Date().toLocaleString('sv-SE', { timeZone: TIMEZONE }).replace(' ', 'T');
}

// ---------- G.711 μ-law codec ----------
const BIAS = 0x84, CLIP = 32635;
function linearToMulaw(sample) {
  let sign = (sample >> 8) & 0x80;
  if (sign) sample = -sample;
  if (sample > CLIP) sample = CLIP;
  sample += BIAS;
  let exponent = 7;
  for (let mask = 0x4000; (sample & mask) === 0 && exponent > 0; exponent--, mask >>= 1) {}
  const mantissa = (sample >> (exponent + 3)) & 0x0f;
  return (~(sign | (exponent << 4) | mantissa)) & 0xff;
}
function mulawToLinear(u) {
  u = ~u & 0xff;
  const sign = u & 0x80, exponent = (u >> 4) & 0x07, mantissa = u & 0x0f;
  let sample = ((mantissa << 3) + BIAS) << exponent;
  sample -= BIAS;
  return sign ? -sample : sample;
}

// ---------- resampling (8k <-> 24k, exact 3x) ----------
function upsample3(int16) { // 8k -> 24k, linear interp
  const out = new Int16Array(int16.length * 3);
  for (let i = 0; i < int16.length; i++) {
    const cur = int16[i], next = i + 1 < int16.length ? int16[i + 1] : cur;
    out[i * 3] = cur;
    out[i * 3 + 1] = cur + (((next - cur) / 3) | 0);
    out[i * 3 + 2] = cur + (((2 * (next - cur)) / 3) | 0);
  }
  return out;
}
function downsample3(int16) { // 24k -> 8k, box average (anti-alias)
  const out = new Int16Array(Math.floor(int16.length / 3));
  for (let i = 0; i < out.length; i++) out[i] = ((int16[i * 3] + int16[i * 3 + 1] + int16[i * 3 + 2]) / 3) | 0;
  return out;
}

// Twilio μ-law 8k (base64) -> xAI PCM16 24k (base64)
function twilioToXai(b64) {
  const mu = Buffer.from(b64, 'base64');
  const pcm8 = new Int16Array(mu.length);
  for (let i = 0; i < mu.length; i++) pcm8[i] = mulawToLinear(mu[i]);
  const pcm24 = upsample3(pcm8);
  return Buffer.from(pcm24.buffer, pcm24.byteOffset, pcm24.byteLength).toString('base64');
}
// xAI PCM16 24k (base64) -> Twilio μ-law 8k (base64)
function xaiToTwilio(b64) {
  const buf = Buffer.from(b64, 'base64');
  const pcm24 = new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 2));
  const pcm8 = downsample3(pcm24);
  const mu = Buffer.alloc(pcm8.length);
  for (let i = 0; i < pcm8.length; i++) mu[i] = linearToMulaw(pcm8[i]);
  return mu.toString('base64');
}

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.get('/', (_q, r) => r.send('voice bridge up'));
app.get('/health', (_q, r) => r.json({ ok: true }));
function twiml(req, res) {
  const host = PUBLIC_HOST || req.headers.host;
  res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response><Connect><Stream url="wss://${host}/stream" /></Connect></Response>`);
}
app.post('/twiml', twiml);
app.get('/twiml', twiml);

// OUTBOUND: a new lead comes in -> the agent calls them immediately.
// POST /outbound { to: "+1..." }  (Twilio dials the lead, connects them to the agent)
app.post('/outbound', async (req, res) => {
  const to = req.body?.to;
  if (!to) return res.status(400).json({ ok: false, error: 'missing "to" number' });
  if (!TW_SID || !TW_AUTH || !TW_FROM) return res.status(500).json({ ok: false, error: 'Twilio not configured on bridge' });
  const host = PUBLIC_HOST || req.headers.host;
  try {
    const body = new URLSearchParams({ To: to, From: TW_FROM, Url: `https://${host}/twiml` });
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TW_SID}/Calls.json`, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(`${TW_SID}:${TW_AUTH}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ ok: false, error: data.message || 'twilio error' });
    res.json({ ok: true, callSid: data.sid, status: data.status });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/stream' });

wss.on('connection', (twilioWS) => {
  let streamSid = null, xaiReady = false, accepting = true;
  const pending = [];
  const fnArgs = {};  // item_id -> accumulated JSON string
  const fnMeta = {};  // item_id -> {call_id, name}
  const xai = new WebSocket(XAI_URL, { headers: { Authorization: 'Bearer ' + XAI_KEY } });

  async function runFunctionCall(itemId) {
    const meta = fnMeta[itemId];
    if (!meta) return;
    let args = {}; try { args = JSON.parse(fnArgs[itemId] || '{}'); } catch {}
    let result = { ok: false, error: 'unknown function' };
    if (meta.name === 'book_appointment' && BOOK_URL) {
      try {
        result = await (await fetch(BOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(args) })).json();
        console.log('[book]', result.ok ? 'OK ' + result.when : 'FAIL ' + result.error);
      } catch (e) { result = { ok: false, error: e.message }; }
    }
    if (xai.readyState === WebSocket.OPEN) {
      xai.send(JSON.stringify({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: meta.call_id, output: JSON.stringify(result) } }));
      xai.send(JSON.stringify({ type: 'response.create' }));
    }
  }

  xai.on('open', () => console.log('[xai] open'));
  xai.on('error', (e) => console.log('[xai] error', e.message));
  xai.on('close', () => { try { twilioWS.close(); } catch {} });

  xai.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    switch (m.type) {
      case 'session.created':
        xai.send(JSON.stringify(sessionConfig({ nowIso: nowIso() })));
        break;
      case 'response.output_item.added':
        if (m.item?.type === 'function_call') fnMeta[m.item.id] = { call_id: m.item.call_id, name: m.item.name };
        break;
      case 'response.function_call_arguments.delta':
        fnArgs[m.item_id] = (fnArgs[m.item_id] || '') + (m.delta || '');
        break;
      case 'response.function_call_arguments.done':
        runFunctionCall(m.item_id);
        break;
      case 'session.updated':
        xaiReady = true;
        for (const a of pending) xai.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: a }));
        pending.length = 0;
        xai.send(JSON.stringify({ type: 'response.create' }));
        break;
      case 'response.created':
        accepting = true;
        break;
      case 'response.output_audio.delta':
        if (accepting && m.delta && streamSid) {
          twilioWS.send(JSON.stringify({ event: 'media', streamSid, media: { payload: xaiToTwilio(m.delta) } }));
        }
        break;
      case 'input_audio_buffer.speech_started':
        // barge-in: flush caller's queued audio, stop generation, drop trailing chunks
        accepting = false;
        if (streamSid) twilioWS.send(JSON.stringify({ event: 'clear', streamSid }));
        try { xai.send(JSON.stringify({ type: 'response.cancel' })); } catch {}
        break;
      case 'response.output_audio_transcript.done':
        if (m.transcript) console.log('[agent]', m.transcript);
        break;
      case 'error':
        console.log('[xai] API error', JSON.stringify(m).slice(0, 200));
        break;
    }
  });

  twilioWS.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    switch (m.event) {
      case 'start':
        streamSid = m.start.streamSid;
        console.log('[twilio] start', streamSid);
        break;
      case 'media': {
        const audio = twilioToXai(m.media.payload);
        if (xaiReady && xai.readyState === WebSocket.OPEN) xai.send(JSON.stringify({ type: 'input_audio_buffer.append', audio }));
        else pending.push(audio);
        break;
      }
      case 'stop':
        console.log('[twilio] stop');
        try { xai.close(); } catch {}
        break;
    }
  });
  twilioWS.on('close', () => { try { xai.close(); } catch {} });
  twilioWS.on('error', () => { try { xai.close(); } catch {} });
});

server.listen(PORT, () => console.log(`bridge listening on :${PORT}`));
