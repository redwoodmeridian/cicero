# Setup — keys & prerequisites

## xAI
1. Create an account at https://console.x.ai and **add credits** (a few dollars is plenty to test).
2. **API Keys** → create a key → `XAI_API_KEY`.
3. **Settings → Management Keys** → create one → `XAI_MANAGEMENT_KEY` (used only to build the knowledge base).

## Google Calendar (for booking)
See `docs/CALENDAR.md`. You need a service account JSON with Calendar access, base64-encoded into
`GOOGLE_SA_JSON_B64`, the user it impersonates in `GOOGLE_IMPERSONATE`, and the target calendar id in
`DEMO_CALENDAR_ID`.

## Twilio (only for phone)
1. Sign up at twilio.com and **upgrade to a full account** (trial can't take outside calls). ~$20 gets you going.
2. Buy a voice-capable number (a US local number needs only an address — no A2P/10DLC for voice).
3. Copy `TWILIO_SID`, `TWILIO_AUTH`, and the number as `TWILIO_NUMBER`.

## Deploy target
Railway is what the kit is tested on. `web` and `bridge` deploy as two separate services.
Vercel also works for `web`. Env vars are set per service in the dashboard.

## Order of operations
1. Fill `firm.config.json` → `node kit/scripts/apply-config.mjs`
2. `node kit/scripts/setup-kb.mjs` → get `XAI_COLLECTION_ID`
3. Deploy `kit/web` (docs/WEB.md)
4. (optional) Deploy `kit/bridge` (docs/PHONE.md)
