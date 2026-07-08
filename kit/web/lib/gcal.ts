import { google } from "googleapis";
import firm from "@/firm.config.json";

// Books an appointment on the firm's Google Calendar via a service account.
// Creds from env (works anywhere): GOOGLE_SA_JSON_B64 (or GOOGLE_SA_JSON), GOOGLE_IMPERSONATE, DEMO_CALENDAR_ID.

const TZ = firm.timezone || "America/New_York";
const LABEL = firm.booking?.label || "consultation";
const AGENT_NAME = firm.shortName || firm.name || "the firm";

function calendarClient() {
  const raw = process.env.GOOGLE_SA_JSON_B64
    ? Buffer.from(process.env.GOOGLE_SA_JSON_B64, "base64").toString("utf8")
    : process.env.GOOGLE_SA_JSON || "{}";
  const sa = JSON.parse(raw);
  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
    subject: process.env.GOOGLE_IMPERSONATE,
  });
  return google.calendar({ version: "v3", auth });
}

export type BookArgs = {
  name?: string;
  phone?: string;
  email?: string;
  start_iso?: string;
  reason?: string;
  duration_min?: number;
};

export async function bookAppointment(a: BookArgs) {
  const calendarId = process.env.DEMO_CALENDAR_ID;
  if (!calendarId) return { ok: false, error: "no calendar configured" };
  if (!a.start_iso) return { ok: false, error: "missing start time" };

  const start = new Date(a.start_iso);
  if (isNaN(start.getTime())) return { ok: false, error: "could not understand the time" };
  const dur = a.duration_min && a.duration_min > 0 ? a.duration_min : firm.booking?.durationMin || 30;
  const end = new Date(start.getTime() + dur * 60000);

  const cal = calendarClient();
  const ev = await cal.events.insert({
    calendarId,
    requestBody: {
      summary: `${titleCase(LABEL)} — ${a.name || "New lead"}`,
      description:
        `Booked by the ${AGENT_NAME} voice agent.\n` +
        `Name: ${a.name || "-"}\nPhone: ${a.phone || "-"}\nEmail: ${a.email || "-"}\n` +
        `Reason: ${a.reason || "-"}`,
      start: { dateTime: start.toISOString(), timeZone: TZ },
      end: { dateTime: end.toISOString(), timeZone: TZ },
    },
  });

  // human-friendly confirmation string, in the FIRM's timezone
  const when = start.toLocaleString("en-US", {
    weekday: "long", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZone: TZ,
  });
  return { ok: true, when, link: ev.data.htmlLink };
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
