import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/auth/guard";
import { sendEmail } from "@/lib/resend";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, 10, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const { to, subject, html, replyTo } = await req.json();
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "to, subject, and html required" },
        { status: 400 }
      );
    }
    const result = await sendEmail({ to, subject, html, replyTo });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Email failed" },
      { status: 500 }
    );
  }
}
