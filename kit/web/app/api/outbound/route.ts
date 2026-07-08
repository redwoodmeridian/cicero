import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Proxies an outbound-call request to the phone bridge (avoids CORS from the browser).
export async function POST(req: NextRequest) {
  const bridge = process.env.BRIDGE_URL;
  if (!bridge) return NextResponse.json({ ok: false, error: "BRIDGE_URL not set" }, { status: 500 });
  try {
    const body = await req.json();
    const r = await fetch(bridge.replace(/\/$/, "") + "/outbound", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    return NextResponse.json(await r.json(), { status: r.status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
