import { NextRequest, NextResponse } from "next/server";
import { guardCronRoute, isDemoMode } from "@/lib/auth/guard";
import { processDueSteps } from "@/lib/engagement/sequence-engine";

/**
 * Cron: Every 15 minutes — process due sequence steps + auto-triggers.
 */
export async function GET(req: NextRequest) {
  const blocked = guardCronRoute(req);
  if (blocked) return blocked;

  if (isDemoMode()) {
    return NextResponse.json({ message: "Demo mode — skipped" });
  }

  const results = await processDueSteps();

  return NextResponse.json({
    processed: results.length,
    sent: results.filter((r) => r.status === "sent").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
  });
}
