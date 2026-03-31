import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, rateLimit, getClientIp } from "@/lib/auth/guard";
import { getFlowBoardState, getCheckInsByStatus } from "@/lib/flow/board-state";
import { getDemoFlowSnapshot } from "@/lib/demo/seed";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const practiceId = searchParams.get("practiceId");
  const detailed = searchParams.get("detailed") === "true";

  if (!practiceId) {
    return NextResponse.json(
      { error: "practiceId required" },
      { status: 400 }
    );
  }

  if (isDemoMode()) {
    return NextResponse.json(getDemoFlowSnapshot());
  }

  const snapshot = await getFlowBoardState(practiceId);

  if (detailed) {
    const byStatus = await getCheckInsByStatus(practiceId);
    return NextResponse.json({ ...snapshot, checkIns: byStatus });
  }

  return NextResponse.json(snapshot);
}
