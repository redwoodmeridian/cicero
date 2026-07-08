# Deploy the talking website (`kit/web`)

A Next.js app: the landing page, the voice widget, `/embed.js`, the token endpoint, and the booking
API. It runs great on **Vercel** (recommended — one click) or Railway.

## Option A — Vercel (recommended)

**One click:** [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/redwoodmeridian/cicero&root-directory=kit/web) — set **Root Directory = `kit/web`**, add the env vars, deploy.

**Or the CLI:**
```bash
cd kit/web
vercel                      # first run links/creates the project (Root Directory = current dir)
# add env vars (or paste them in the Vercel dashboard → Settings → Environment Variables):
vercel env add XAI_API_KEY production
vercel env add XAI_COLLECTION_ID production
vercel env add GOOGLE_SA_JSON_B64 production
vercel env add GOOGLE_IMPERSONATE production
vercel env add DEMO_CALENDAR_ID production
vercel env add BRIDGE_URL production        # only if you set up outbound phone
vercel --prod               # deploy to production
```
Importing from GitHub instead? In the Vercel dashboard, **New Project → import the repo → set Root
Directory to `kit/web`**, add the same env vars, deploy.

## Option B — Railway
```bash
cd kit/web
railway init --name my-firm-voice && railway up --detach
railway variables --set "XAI_API_KEY=$XAI_API_KEY" --set "XAI_COLLECTION_ID=$XAI_COLLECTION_ID" \
  --set "GOOGLE_SA_JSON_B64=$GOOGLE_SA_JSON_B64" --set "GOOGLE_IMPERSONATE=$GOOGLE_IMPERSONATE" \
  --set "DEMO_CALENDAR_ID=$DEMO_CALENDAR_ID"
railway domain
```

## Test
Open the URL. After ~15s the widget auto-opens and greets you (it needs one page interaction to make
sound — a browser rule). Tap **Approve mic & talk**, have a conversation, and book a time. Confirm the
event appears on your Google Calendar. Audition voices with `?voice=orion` etc.

## How it works
- `app/api/voice-token` mints a short-lived xAI token (your API key never reaches the browser).
- `components/voice-widget.tsx` streams mic ↔ xAI over WebSocket, plays audio, handles barge-in and booking.
- `app/api/book` writes the appointment to Google Calendar.
- `public/embed.js` is the one-line snippet for putting the widget on any other site (see `docs/EMBED.md`).

> **Phone note:** the website runs on Vercel, but the **phone bridge** (`kit/bridge`) needs a
> persistent WebSocket server — Vercel's serverless functions can't hold Twilio's media stream open.
> Deploy the bridge on Railway / Render / Fly / a VPS. See `docs/PHONE.md`.
