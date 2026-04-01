import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/auth/guard";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  try {
    const { membershipNumber, scheme } = await req.json();
    if (!membershipNumber || !scheme) {
      return NextResponse.json({ error: "membershipNumber and scheme required" }, { status: 400 });
    }
    // TODO: Wire to real Healthbridge API
    return NextResponse.json({
      eligible: true,
      scheme,
      membershipNumber,
      option: `${scheme} Standard`,
      benefitsRemaining: "R5,200 of R12,000",
      preAuthRequired: false,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
