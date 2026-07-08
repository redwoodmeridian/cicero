<div align="center">

# 🏛️ Cicero

### The AI voice receptionist for law firms.

**A talking website widget + an inbound & outbound phone agent that answers, qualifies leads, and books consultations straight to your calendar — set up by Claude in minutes.**

[![Powered by Grok Voice](https://img.shields.io/badge/voice-Grok%20Voice-black)](https://x.ai/voice)
[![Deploy on Railway](https://img.shields.io/badge/deploy-Railway-0B0D0E)](https://railway.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Set up by Claude Code](https://img.shields.io/badge/setup-Claude%20Code-D97757)](https://claude.com/claude-code)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/redwoodmeridian/cicero&root-directory=kit/web)

</div>

---

Most law firms lose leads the same way: a hurt, scared, or time-pressed person lands on the website
or calls after hours — and gets a form, a voicemail, or hold music. **Cicero answers.** It talks like
your best front-desk hire, figures out if it's a good-fit case, answers their questions, and books the
consult while the person is still motivated — 24/7, on your site and your phone line.

Named after history's greatest lawyer and orator. Fitting for an AI that argues your firm's case the
moment a lead shows up.

## ✨ What it does

- 🗣️ **Talking website widget** — a floating "Talk to us" bubble on *any* site (WordPress, Squarespace, Wix, Webflow, raw HTML). Auto-greets, one tap to talk, real conversation.
- 📞 **Inbound phone agent** — your number rings into the same brain. It answers on the first ring, every time.
- ☎️ **Outbound lead callback** — a new lead comes in and the agent calls them back in *seconds*, while they're still warm.
- 📅 **Books to your calendar, live** — appointments appear on your Google Calendar mid-conversation. No forms, no tag.
- 🧠 **Knows your firm** — answers from a knowledge base built from your site (fees, practice areas, what you do and don't take).
- 🎙️ **26 voices + cloning** — pick a voice, or clone a real one.
- 🔒 **Your keys, your data** — self-hosted. The API key never touches the browser.

## 🤖 Set it up by talking to Claude

Cicero ships with a [Claude Code](https://claude.com/claude-code) skill. Open the repo and say:

> **"Set up my voice agent."**

Claude reads your website, asks what you want the agent to do, builds your knowledge base, deploys the
widget, drops it onto your existing site, walks you through Twilio end-to-end, and wires your calendar —
step by step. If it doesn't know something about your firm, it asks.

## ⚡ Quickstart (manual)

```bash
git clone https://github.com/redwoodmeridian/cicero
cd cicero
cp .env.example .env            # add your xAI + Google (+ Twilio) keys — see docs/SETUP.md

# 1. Describe your firm (one file), then apply it
$EDITOR firm.config.json
node kit/scripts/apply-config.mjs

# 2. Build the knowledge base
node kit/scripts/setup-kb.mjs   # prints XAI_COLLECTION_ID

# 3. Deploy the talking website to Vercel (or Railway) — docs/WEB.md
cd kit/web && vercel --prod

# 4. Add to any site (WordPress, Squarespace, Wix, raw HTML): one line
#    <script src="https://your-deploy/embed.js" defer></script>

# 5. (optional) Phone — deploy the bridge to Railway/Render — docs/PHONE.md
```

> Web deploys to **Vercel** in one click. The phone bridge needs a persistent host (Railway/Render/Fly) —
> Vercel's serverless functions can't hold Twilio's live audio stream open.

## 🧩 How it works

```
                       ┌──────────────────────────────┐
   Website visitor ───▶│  embed.js  (any site)         │
                       │  mic ⇄ browser WebSocket      │──┐
                       └──────────────────────────────┘  │
                                                          ▼
   Phone caller ──▶ Twilio ──▶ bridge (μ-law⇄PCM) ──▶  xAI Grok Voice  ──▶  📅 Google Calendar
                                                       (speech-to-speech,      (books the consult)
                                                        knowledge base,
                                                        function calling)
```

- **`kit/web`** — Next.js: the widget, the landing page, the token endpoint, the booking API, `/embed.js`.
- **`kit/bridge`** — Twilio ↔ xAI phone bridge (inbound + outbound), with audio transcoding and barge-in.
- **`firm.config.json`** — the one file you edit; the agent's persona, hook, and behavior are generated from it.
- **`.claude/skills/voice-agent-setup`** — the skill that makes Claude do all of the above.

## 📚 Docs

[Setup & keys](docs/SETUP.md) · [Website widget](docs/WEB.md) · [Embed on any site](docs/EMBED.md) ·
[Phone (Twilio)](docs/PHONE.md) · [Calendar booking](docs/CALENDAR.md) · [Voices](docs/VOICE.md)

## 💸 Cost

~**$0.06 / minute** of phone conversation (voice + telephony), ~**$0.05 / minute** on the website. No
platform fees. A booked lead costs a few cents. Compare that to a missed one.

## License

MIT — use it, fork it, ship it for your firm.

<div align="center"><sub>Built by Redwood Meridian.</sub></div>
