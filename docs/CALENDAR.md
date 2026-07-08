# Google Calendar booking

The agent writes appointments to a Google Calendar via a **service account**.

## Option A — Google Workspace (recommended)
1. In Google Cloud Console, create a project → enable the **Google Calendar API**.
2. Create a **service account**, generate a JSON key.
3. In Google Workspace Admin → Security → API controls → **Domain-wide delegation**, add the service
   account's client ID with scope `https://www.googleapis.com/auth/calendar`.
4. Pick (or create) a calendar for bookings; note its **Calendar ID** (Settings → Integrate calendar).
5. Set:
   - `GOOGLE_SA_JSON_B64` = `base64 -i service-account.json | tr -d '\n'`
   - `GOOGLE_IMPERSONATE` = a user in your domain the SA acts as (e.g. intake@firm.com)
   - `DEMO_CALENDAR_ID` = the calendar id

## Option B — no Workspace
Use a personal Google account with OAuth (calendar scope) and adapt `kit/web/lib/gcal.ts` to use an
OAuth token instead of the JWT. (The kit ships with the service-account path; ask Claude to switch it.)

## Verify
```bash
curl -X POST https://<your-web-app>/api/book -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"555-0100","start_iso":"2026-07-10T14:00:00-07:00","reason":"test"}'
```
You should get `{ ok: true, when: "..." }` and see the event on the calendar. Share the calendar with
your own email to watch bookings appear live during a demo.
