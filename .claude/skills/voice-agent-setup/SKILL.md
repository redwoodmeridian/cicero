---
name: voice-agent-setup
description: >
  Set up Cicero — a law firm's AI voice agent: a talking-website widget and/or an inbound & outbound
  phone agent that qualifies leads and books appointments to their calendar. Use when the user says
  "set up my voice agent", "set up Cicero", "build my AI receptionist", "get my talking website
  working", "set up the phone agent", or has just cloned this repo. You interview the firm for
  anything you don't know, embed the widget on their existing site (any platform), walk them through
  Twilio end to end, wire their calendar, deploy, and test.
---

# Cicero — Voice Agent Setup

You are setting up **this firm's** AI voice agent from this repo. Do the work — don't just hand the
user a to-do list. Explain each step in plain language, make decisions where you can, and only stop
for things you genuinely need from them (keys, accounts, a choice). Never commit secrets.

## What Cicero is (the user picks any/all)
1. **Talking website widget** — a floating "Talk to us" bubble that greets visitors, qualifies them, answers from a knowledge base, and books a consult. Works on ANY website.
2. **Inbound phone agent** — a phone number rings into the same agent.
3. **Outbound lead callback** — a new lead comes in → the agent calls them within seconds.
All three book real appointments to the firm's calendar.

## Step 0 — Understand the firm and the goal (interview)
Before touching config, make sure you understand who this is for. **If you already know the firm**
(they gave you a website, or it's in context), read their site and confirm what you found. **If you
don't**, ask — conversationally, a few at a time, not as a wall of questions:
- What's the firm's name, and what kind of law do you practice?
- Where are you located / what areas do you serve?
- What's the #1 thing you want this agent to do — answer the phone, capture website leads, call new
  leads back fast, book consultations, screen out bad-fit cases? (This sets the agent's priorities.)
- Who's your ideal client / what's a good-fit case vs one you turn away?
- How do you want it to sound — warm and reassuring, sharp and fast, formal? Any lines it must never
  say (e.g. never quote a case value)?
- How do people book with you today, and where should appointments land?
- Do you want it on your website, your phone, or both?
Capture the answers into `firm.config.json` (every field). Then run
`node kit/scripts/apply-config.mjs`. The config is the single source of truth for the agent's brain.

## Step 1 — Keys & prerequisites
See `docs/SETUP.md`. You need `XAI_API_KEY` + `XAI_MANAGEMENT_KEY` (funded xAI account). For phone,
a Twilio account. For booking, a Google service account. If something's missing, help them get it
(walk them through the console), or if it's blocked, say so plainly and stop — don't fake it.

## Step 2 — Knowledge base
`XAI_API_KEY=... XAI_MANAGEMENT_KEY=... node kit/scripts/setup-kb.mjs` → prints `XAI_COLLECTION_ID`.
For richer answers, expand the firm's knowledge first (fees, FAQs, jurisdiction rules, what they do
and don't take) — pull it from their website and their answers in Step 0.

## Step 3 — Deploy the widget backend & talking website (`kit/web`)
Do this first — highest value, works on any funded xAI account. See `docs/WEB.md`.
**Prefer Vercel** — most firms already have it and it's one click (`cd kit/web && vercel --prod`, or
GitHub import with Root Directory = `kit/web`). Railway also works. Set the xAI + Google env vars, then
test a full conversation and a booking. (The phone bridge in Step 5 must go on a persistent host like
Railway — not Vercel — because it holds a live WebSocket open.)

## Step 4 — Put the widget on THEIR website (any platform)
`kit/web` hosts a universal embed at `/embed.js`. Installing it depends on their stack — you handle it:
- **WordPress**: add the script via a "Custom HTML" block in the footer, the theme's `footer.php`,
  or a headers-and-footers plugin (WPCode / Insert Headers and Footers). Guide them click-by-click,
  or if you have access to their site/repo, do it.
- **Squarespace**: Settings → Advanced → Code Injection → Footer.
- **Wix**: Settings → Custom Code → add to Body/Footer, all pages.
- **Webflow**: Project Settings → Custom Code → Footer.
- **Shopify**: theme.liquid before `</body>`.
- **Google Tag Manager**: a Custom HTML tag on all pages.
- **Raw HTML / custom / Next/React site**: paste the `<script>` before `</body>`, or import the React
  component directly (see `docs/EMBED.md`).
The snippet is always:
```html
<script src="https://YOUR-DEPLOY/embed.js" defer></script>
```
Confirm the bubble shows on their live site and the mic works (needs HTTPS). See `docs/EMBED.md` for
per-platform detail and customization (`data-label`, `data-color`, `data-position`).

## Step 5 — Phone, end to end (`kit/bridge`) — you own the whole Twilio process
See `docs/PHONE.md`. Walk them through ALL of it:
1. **Twilio account**: help them sign up, and **upgrade to a full account** (trial can't take outside
   calls — this is the #1 gotcha). Explain it's ~$20 and needed.
2. **Buy a number**: a US local voice number needs only an address (no A2P/10DLC for voice). Do it via
   the console or the Twilio API for them.
3. **Deploy `kit/bridge`** to Railway with the xAI, Twilio, and `BOOK_URL` env vars.
4. **Inbound**: set the number's Voice webhook to `https://<bridge>/twiml` (do it via API for them).
   Test the call.
5. **Keep their existing number**: help them either forward their business line to the Twilio number
   (carrier settings) or port it into Twilio.
6. **Outbound**: set `BRIDGE_URL` on the web app; the `/demo` form and `/api/outbound` trigger calls.
   Wire their lead source (form/CRM webhook) to `POST /api/outbound { to }`.

## Step 6 — Calendar
`docs/CALENDAR.md`. Get bookings landing on the calendar they chose. Share it with them so they can
watch bookings appear live.

## Step 7 — Verify (never skip)
- Web: a real conversation + a booking on the calendar.
- Inbound: call the number, book, confirm.
- Outbound: trigger `/demo`, answer, book.
Report exactly what works and what doesn't. Read service logs and fix before saying "done."

## Guardrails
- Never commit `.env` or keys (`.gitignore` covers them).
- The agent must never give legal advice or quote case value — the config persona enforces this;
  keep it.
- Keep the knowledge base to public marketing facts unless the firm says otherwise.
