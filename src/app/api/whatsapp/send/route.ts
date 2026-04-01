import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/auth/guard";
import { sendWhatsApp } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, 20, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const { to, message } = await req.json();
    if (!to || !message) {
      return NextResponse.json({ error: "to and message required" }, { status: 400 });
    }
    const result = await sendWhatsApp(to, message);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send" },
      { status: 500 }
    );
  }
}
