import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - plain JS module copied in by scripts/apply-config.mjs
import { buildInstructions, buildTools } from "@/lib/agent-instructions.mjs";
import firm from "@/firm.config.json";

export const dynamic = "force-dynamic";

const MODEL = "grok-voice-think-fast-1.0";

export async function GET(req: NextRequest) {
  const key = process.env.XAI_API_KEY;
  if (!key) return NextResponse.json({ error: "missing XAI_API_KEY" }, { status: 500 });
  const voice = req.nextUrl.searchParams.get("voice") || firm.voice || "atlas";

  const r = await fetch("https://api.x.ai/v1/realtime/client_secrets", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL }),
  });
  if (!r.ok) return NextResponse.json({ error: "mint failed", detail: await r.text() }, { status: 502 });
  const tok = await r.json();

  const nowIso = new Date().toLocaleString("sv-SE", { timeZone: firm.timezone || "America/New_York" }).replace(" ", "T");

  return NextResponse.json({
    value: tok.value,
    model: MODEL,
    voice,
    hook: firm.hook,
    instructions: buildInstructions(firm, nowIso, "web"),
    tools: buildTools(firm, process.env.XAI_COLLECTION_ID || ""),
  });
}
