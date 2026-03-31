import { NextRequest, NextResponse } from "next/server";
import { guardCronRoute, isDemoMode } from "@/lib/auth/guard";
import { generateDayForecast } from "@/lib/flow/capacity-forecast";
import { supabaseAdmin, tables } from "@/lib/supabase";

/**
 * Cron: Daily 06:00 SAST — generate capacity forecasts for all active practices.
 */
export async function GET(req: NextRequest) {
  const blocked = guardCronRoute(req);
  if (blocked) return blocked;

  if (isDemoMode()) {
    return NextResponse.json({ message: "Demo mode — skipped" });
  }

  const today = new Date().toISOString().split("T")[0];

  // Get all practices that have pf_practice_config
  const { data: configs } = await supabaseAdmin
    .from(tables.practiceConfig)
    .select("practice_id");

  if (!configs?.length) {
    return NextResponse.json({
      message: "No configured practices",
      forecasts: 0,
    });
  }

  const results: { practiceId: string; success: boolean; error?: string }[] = [];

  for (const config of configs) {
    try {
      await generateDayForecast(config.practice_id, today);
      results.push({ practiceId: config.practice_id, success: true });
    } catch (err) {
      results.push({
        practiceId: config.practice_id,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    message: `Generated ${results.filter((r) => r.success).length} forecasts`,
    results,
  });
}
