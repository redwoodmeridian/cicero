# Deploy the talking website (`kit/web`)

A Next.js app: a landing page with the voice widget embedded, a token endpoint, and the booking API.

## Deploy on Railway
```bash
cd kit/web
railway init --name my-firm-voice
railway up --detach
railway variables \
  --set "XAI_API_KEY=$XAI_API_KEY" \
  --set "XAI_COLLECTION_ID=$XAI_COLLECTION_ID" \
  --set "GOOGLE_SA_JSON_B64=$GOOGLE_SA_JSON_B64" \
  --set "GOOGLE_IMPERSONATE=$GOOGLE_IMPERSONATE" \
  --set "DEMO_CALENDAR_ID=$DEMO_CALENDAR_ID" \
  --set "BRIDGE_URL=$BRIDGE_URL"      # only if you set up outbound
railway domain
```
On Vercel: import the repo, set root to `kit/web`, add the same env vars, deploy.

## Test
Open the URL. After ~15s the widget auto-opens and the agent greets you (it needs one page
interaction to make sound — browser rule). Tap **Approve mic & talk**, have a conversation, and
book a time. Confirm the event appears on your Google Calendar.

## How it works
- `app/api/voice-token` mints a short-lived xAI token (your API key never reaches the browser).
- `components/voice-widget.tsx` streams mic ↔ xAI over WebSocket, plays audio, handles barge-in.
- When the agent calls `book_appointment`, the widget POSTs `app/api/book` → Google Calendar.

## Notes
- Auditions: append `?voice=orion` (etc.) to the URL. Lock your favorite into `firm.config.json`.
- Use earbuds while testing so the agent doesn't hear itself through the speakers.
