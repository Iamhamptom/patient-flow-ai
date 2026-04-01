import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/auth/guard";
import { broadcastWhatsApp } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const { recipients, message } = await req.json();
    if (!Array.isArray(recipients) || !message) {
      return NextResponse.json({ error: "recipients[] and message required" }, { status: 400 });
    }
    const results = await broadcastWhatsApp(recipients, message);
    const sent = results.filter((r) => r.sid).length;
    const failed = results.filter((r) => r.error).length;
    return NextResponse.json({ sent, failed, results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Broadcast failed" },
      { status: 500 }
    );
  }
}
