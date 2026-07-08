"use client";

import { useEffect, useRef, useState } from "react";

// Vantage voice widget: low-friction two-phase flow.
// 1) Auto-opens after ~15s and the agent greets (voice-first, no mic) as soon as the page has any interaction.
// 2) One tap on "Approve mic & talk" enables the mic and it's a full conversation.
// Plus: speech-to-speech intake + live Google Calendar booking, hardened barge-in.
const SR = 24000;
const RATE = 1.1;

type Msg = { who: "you" | "agent"; text: string };

export default function VoiceWidget({ embedded = false }: { embedded?: boolean }) {
  const [open, setOpen] = useState(embedded);
  const [live, setLive] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [status, setStatus] = useState("Free case review · No fee unless we win");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [booked, setBooked] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const ws = useRef<WebSocket | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const mic = useRef<MediaStream | null>(null);
  const worklet = useRef<AudioWorkletNode | null>(null);
  const playHead = useRef(0);
  const sources = useRef<AudioBufferSourceNode[]>([]);
  const accepting = useRef(true);
  const agentBuf = useRef("");
  const fnArgs = useRef<Record<string, string>>({});
  const fnMeta = useRef<Record<string, { call_id: string; name: string }>>({});
  const connected = useRef(false);
  const wantMic = useRef(false);

  // Auto-open + voice-first greeting after a short browse.
  useEffect(() => {
    if (dismissed) return;
    const t = setTimeout(() => {
      setOpen((o) => o || true);
      connect(false); // greet (best-effort audio; plays on first interaction)
    }, 15000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissed]);

  async function ensureAudio() {
    if (!ctxRef.current) ctxRef.current = new AudioContext({ sampleRate: SR });
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") {
      try { await ctx.resume(); } catch {}
      if (ctx.state === "suspended") {
        const r = () => { ctx.resume(); document.removeEventListener("pointerdown", r); document.removeEventListener("scroll", r); document.removeEventListener("keydown", r); };
        document.addEventListener("pointerdown", r);
        document.addEventListener("scroll", r, { passive: true });
        document.addEventListener("keydown", r);
      }
    }
    return ctx;
  }

  function stopPlayback() {
    for (const n of sources.current) { try { n.onended = null; n.stop(); } catch {} }
    sources.current = [];
    if (ctxRef.current) playHead.current = ctxRef.current.currentTime;
    setSpeaking(false);
  }

  function pushAgent(d: string) {
    agentBuf.current += d;
    setMsgs((m) => {
      const c = [...m];
      if (c.length && c[c.length - 1].who === "agent") c[c.length - 1] = { who: "agent", text: agentBuf.current };
      else c.push({ who: "agent", text: agentBuf.current });
      return c;
    });
  }

  async function handleFunctionCall(itemId: string) {
    const meta = fnMeta.current[itemId];
    const raw = fnArgs.current[itemId] || "{}";
    if (!meta) return;
    let args: Record<string, unknown> = {};
    try { args = JSON.parse(raw); } catch {}
    let result: Record<string, unknown>;
    if (meta.name === "book_appointment") {
      try {
        result = await (await fetch("/api/book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args) })).json();
        if ((result as { ok?: boolean }).ok) setBooked(String((result as { when?: string }).when || "your appointment"));
      } catch (e) { result = { ok: false, error: (e as Error).message }; }
    } else result = { ok: false, error: "unknown function" };
    const s = ws.current;
    if (s && s.readyState === 1) {
      s.send(JSON.stringify({ type: "conversation.item.create", item: { type: "function_call_output", call_id: meta.call_id, output: JSON.stringify(result) } }));
      s.send(JSON.stringify({ type: "response.create" }));
    }
  }

  async function connect(withMic: boolean) {
    if (connected.current) { if (withMic) enableMic(); return; }
    connected.current = true;
    wantMic.current = withMic;
    setStatus(withMic ? "Connecting…" : "Say hello — tap the mic to talk back");
    const q = typeof window !== "undefined" ? window.location.search : "";
    const cfg = await (await fetch("/api/voice-token" + q)).json();
    if (!cfg.value) { setStatus("Unavailable right now"); connected.current = false; return; }
    await ensureAudio();

    const socket = new WebSocket(`wss://api.x.ai/v1/realtime?model=${encodeURIComponent(cfg.model)}`, ["xai-client-secret." + cfg.value]);
    ws.current = socket;
    socket.onopen = () => setStatus(withMic ? "Listening — go ahead" : "Tap the mic to talk back");
    socket.onclose = () => { if (live) stop(); };
    socket.onerror = () => setStatus("Connection error");

    socket.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      switch (m.type) {
        case "session.created": {
          const session: Record<string, unknown> = {
            instructions: cfg.instructions,
            voice: cfg.voice,
            modalities: ["audio", "text"],
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            turn_detection: { type: "server_vad", threshold: 0.6, prefix_padding_ms: 200, silence_duration_ms: 420 },
            input_audio_transcription: { model: "whisper-1" },
            tools: cfg.tools || [],
          };
          socket.send(JSON.stringify({ type: "session.update", session }));
          break;
        }
        case "session.updated":
          if (wantMic.current) startMic();
          socket.send(JSON.stringify({ type: "response.create" })); // agent greets first
          break;
        case "response.created":
          stopPlayback(); accepting.current = true;
          break;
        case "response.output_item.added":
          if (m.item?.type === "function_call") fnMeta.current[m.item.id] = { call_id: m.item.call_id, name: m.item.name };
          break;
        case "response.function_call_arguments.delta":
          fnArgs.current[m.item_id] = (fnArgs.current[m.item_id] || "") + (m.delta || "");
          break;
        case "response.function_call_arguments.done":
          handleFunctionCall(m.item_id);
          break;
        case "response.output_audio.delta":
          if (accepting.current && m.delta) playPCM(m.delta);
          break;
        case "response.output_audio_transcript.delta":
          pushAgent(m.delta || "");
          break;
        case "response.output_audio_transcript.done":
          agentBuf.current = "";
          break;
        case "input_audio_buffer.speech_started":
          stopPlayback(); accepting.current = false;
          try { socket.send(JSON.stringify({ type: "response.cancel" })); } catch {}
          agentBuf.current = "";
          break;
        case "conversation.item.input_audio_transcription.completed":
          if (m.transcript) setMsgs((x) => [...x, { who: "you", text: (m.transcript || "").trim() }]);
          break;
      }
    };
    setLive(true);
  }

  async function enableMic() {
    if (micOn) return;
    await ensureAudio();
    wantMic.current = true;
    if (ws.current && ws.current.readyState === 1) await startMic();
    setMicOn(true);
    setStatus("Listening — go ahead");
  }

  async function startMic() {
    if (micOn || mic.current) return;
    const ctx = ctxRef.current!;
    mic.current = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    setMicOn(true);
    const src = ctx.createMediaStreamSource(mic.current);
    const code = `class Cap extends AudioWorkletProcessor{process(i){const c=i[0][0];if(c){const a=new Int16Array(c.length);for(let n=0;n<c.length;n++){let s=Math.max(-1,Math.min(1,c[n]));a[n]=s<0?s*0x8000:s*0x7fff;}this.port.postMessage(a.buffer,[a.buffer]);}return true;}}registerProcessor('cap',Cap);`;
    const url = URL.createObjectURL(new Blob([code], { type: "application/javascript" }));
    await ctx.audioWorklet.addModule(url);
    const node = new AudioWorkletNode(ctx, "cap");
    worklet.current = node;
    src.connect(node);
    node.port.onmessage = (e) => {
      const s = ws.current;
      if (!s || s.readyState !== 1) return;
      const bytes = new Uint8Array(e.data as ArrayBuffer);
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      s.send(JSON.stringify({ type: "input_audio_buffer.append", audio: btoa(bin) }));
    };
  }

  function playPCM(b64: string) {
    const ctx = ctxRef.current!;
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const i16 = new Int16Array(bytes.buffer);
    const f32 = new Float32Array(i16.length);
    for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 0x8000;
    const buf = ctx.createBuffer(1, f32.length, SR);
    buf.getChannelData(0).set(f32);
    const node = ctx.createBufferSource();
    node.buffer = buf;
    node.playbackRate.value = RATE;
    node.connect(ctx.destination);
    const now = ctx.currentTime;
    if (playHead.current < now) playHead.current = now;
    node.start(playHead.current);
    playHead.current += buf.duration / RATE;
    sources.current.push(node);
    setSpeaking(true);
    node.onended = () => { sources.current = sources.current.filter((s) => s !== node); if (sources.current.length === 0) setSpeaking(false); };
  }

  function stop() {
    setLive(false); setMicOn(false); setSpeaking(false); connected.current = false; wantMic.current = false;
    setStatus("Free case review · No fee unless we win");
    try { worklet.current?.disconnect(); } catch {}
    try { mic.current?.getTracks().forEach((t) => t.stop()); } catch {}
    mic.current = null;
    try { ws.current?.close(); } catch {}
    try { ctxRef.current?.close(); } catch {}
    ctxRef.current = null;
  }

  const btnLabel = !live ? "🎙  Talk to us now — free" : micOn ? "End call" : "🎙  Approve mic & talk";
  function onBtn() {
    if (!live) connect(true);
    else if (!micOn) enableMic();
    else stop();
  }

  return (
    <>
      {open && (
        <div style={embedded ? panelEmbedded : panel}>
          <div style={header}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: ".3px" }}>VANTAGE INJURY LAW</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{status}</div>
            </div>
            <button aria-label="close" onClick={() => { stop(); setOpen(false); setDismissed(true); setMsgs([]); setBooked(null); }} style={xBtn}>×</button>
          </div>

          {!live && msgs.length === 0 ? (
            <div style={{ padding: "12px 2px 4px" }}>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginBottom: 10 }}>Hurt in an accident?<br />Find out in 90 seconds if you have a case.</div>
              <div style={{ fontSize: 13.5, opacity: 0.82, lineHeight: 1.5 }}>Talk to our team right now — no forms, no hold music. If you have a case, we&rsquo;ll book your free review on the spot. You pay nothing unless we win.</div>
            </div>
          ) : (
            <>
              <div style={{ ...orb, ...(speaking ? orbLive : {}) }} />
              {booked && <div style={bookedBadge}>✓ Booked — {booked}</div>}
              <div style={log}>
                {msgs.map((m, i) => (
                  <div key={i} style={{ margin: "8px 0" }}>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".5px", opacity: 0.5 }}>{m.who === "you" ? "You" : "Vantage"}</div>
                    <div style={{ fontSize: 14, color: m.who === "you" ? "#ffd9a8" : "#f4f1ea" }}>{m.text}</div>
                  </div>
                ))}
                {live && !micOn && msgs.length === 0 && <div style={{ opacity: 0.6, fontSize: 13, textAlign: "center", marginTop: 6 }}>Listen — then tap below to talk back.</div>}
              </div>
            </>
          )}

          <button onClick={onBtn} style={{ ...cta, background: live && micOn ? "#7a2e2e" : "#c8102e", marginTop: 12 }}>{btnLabel}</button>
        </div>
      )}
      {!embedded && <button aria-label="Talk to us" onClick={() => setOpen((o) => !o)} style={fab}>{open ? "Close" : "🎙  Talk to us — free"}</button>}
    </>
  );
}

const panelEmbedded: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", background: "#141414", color: "#f4f1ea", border: "none", borderRadius: 0, boxShadow: "none", padding: 16, fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif", display: "flex", flexDirection: "column" };

const fab: React.CSSProperties = { position: "fixed", right: 22, bottom: 22, zIndex: 9999, background: "#c8102e", color: "#fff", border: "none", borderRadius: 999, padding: "14px 22px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 12px 34px rgba(200,16,46,.45)" };
const panel: React.CSSProperties = { position: "fixed", right: 22, bottom: 84, zIndex: 9999, width: 350, maxWidth: "92vw", background: "#141414", color: "#f4f1ea", borderRadius: 16, border: "1px solid #2a2a2a", boxShadow: "0 26px 64px rgba(0,0,0,.55)", padding: 16, fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" };
const header: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const xBtn: React.CSSProperties = { background: "none", border: "none", color: "#f4f1ea", fontSize: 22, cursor: "pointer", opacity: 0.7, lineHeight: 1 };
const orb: React.CSSProperties = { width: 84, height: 84, borderRadius: "50%", margin: "14px auto", background: "radial-gradient(circle at 50% 40%, #c8102e, #4a0a14)", border: "1px solid #5a1420", transition: ".15s" };
const orbLive: React.CSSProperties = { boxShadow: "0 0 0 0 rgba(200,16,46,.6)", animation: "vpulse 1s infinite" };
const log: React.CSSProperties = { maxHeight: 190, overflowY: "auto", margin: "6px 0 4px" };
const cta: React.CSSProperties = { width: "100%", border: "none", borderRadius: 12, padding: 14, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" };
const bookedBadge: React.CSSProperties = { background: "#123d1e", color: "#9ff0b5", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 600, textAlign: "center", margin: "4px 0" };
