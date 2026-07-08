import { NextRequest, NextResponse } from "next/server";
import { bookAppointment } from "@/lib/gcal";

export const dynamic = "force-dynamic";

// Called by the voice widget (and phone bridge) when the agent invokes book_appointment.
export async function POST(req: NextRequest) {
  try {
    const args = await req.json();
    const result = await bookAppointment(args);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
