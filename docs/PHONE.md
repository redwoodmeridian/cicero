# Phone agent (`kit/bridge`) — inbound & outbound

The bridge connects Twilio calls to the xAI voice agent. It transcodes audio (Twilio μ-law 8kHz ↔
xAI PCM16 24kHz — xAI only speaks PCM, so this is required), handles barge-in, and books to your
calendar by POSTing to the web app's `/api/book`.

## 0. Twilio account (do this first)
1. Sign up at twilio.com. Verify your own phone at signup (SMS code).
2. **Upgrade to a full account** — the single biggest gotcha: a *trial* account can only call
   verified numbers and plays a "trial" message, so the public can't reach your agent. Upgrading =
   add a card (~$20). Console → click the **Trial** banner → Upgrade.
3. **Buy a voice number.** Console → Phone Numbers → Buy a number → filter by **Voice**. A US local
   number needs only an emergency address (no A2P/10DLC — that's SMS-only). Or via API:
   ```bash
   curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_SID/IncomingPhoneNumbers.json" \
     -u "$TWILIO_SID:$TWILIO_AUTH" --data-urlencode "AreaCode=602"
   ```
4. Copy `TWILIO_SID`, `TWILIO_AUTH` (Console dashboard), and the number as `TWILIO_NUMBER`.

## Deploy on Railway
```bash
cd kit/bridge
railway init --name my-firm-bridge
railway up --detach
railway variables \
  --set "XAI_API_KEY=$XAI_API_KEY" \
  --set "XAI_COLLECTION_ID=$XAI_COLLECTION_ID" \
  --set "BOOK_URL=https://<your-web-app>/api/book" \
  --set "TWILIO_SID=$TWILIO_SID" \
  --set "TWILIO_AUTH=$TWILIO_AUTH" \
  --set "TWILIO_NUMBER=$TWILIO_NUMBER"
railway domain
```

## Inbound: point your number at the bridge
Set the Twilio number's **Voice webhook** to `https://<your-bridge>/twiml` (POST). Or via API:
```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_SID/IncomingPhoneNumbers/<PN_SID>.json" \
  -u "$TWILIO_SID:$TWILIO_AUTH" \
  --data-urlencode "VoiceUrl=https://<your-bridge>/twiml" --data-urlencode "VoiceMethod=POST"
```
Call the number — the agent answers, qualifies, and books.

## Outbound: agent calls a lead
```bash
BRIDGE_URL=https://<your-bridge> node kit/scripts/outbound-call.mjs +15551234567
```
Or use the web `/demo` form (set `BRIDGE_URL` on the web app). Wire your CRM/lead form to POST
`{ to: "+1..." }` to `https://<web-app>/api/outbound` for automatic callbacks.

## Forwarding an existing business line
Keep your current number: set it to **forward** to the Twilio number (in your carrier settings),
or port it into Twilio. Either way inbound calls reach the agent.
