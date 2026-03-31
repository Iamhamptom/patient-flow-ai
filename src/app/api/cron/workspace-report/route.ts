import { NextRequest, NextResponse } from "next/server";
import { guardCronRoute, isDemoMode } from "@/lib/auth/guard";
import { supabaseAdmin, tables } from "@/lib/supabase";

const WORKSPACE_URL = process.env.WORKSPACE_URL;
const WORKSPACE_PRODUCT_ID = process.env.WORKSPACE_PRODUCT_ID;
const WORKSPACE_PRODUCT_API_KEY = process.env.WORKSPACE_PRODUCT_API_KEY;

/**
 * Cron: Daily 07:00 — push metrics to Visio Workspace product registry.
 */
export async function GET(req: NextRequest) {
  const blocked = guardCronRoute(req);
  if (blocked) return blocked;

  if (isDemoMode() || !WORKSPACE_URL || !WORKSPACE_PRODUCT_ID) {
    return NextResponse.json({ message: "Workspace reporting skipped" });
  }

  // Gather metrics
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86_400_000)
    .toISOString()
    .split("T")[0];

  const { count: totalPredictions } = await supabaseAdmin
    .from(tables.predictions)
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${weekAgo}T00:00:00`);

  const { count: activePractices } = await supabaseAdmin
    .from(tables.practiceConfig)
    .select("id", { count: "exact", head: true });

  const { data: accuracy } = await supabaseAdmin
    .from(tables.modelAccuracy)
    .select("accuracy, revenue_saved")
    .order("period_end", { ascending: false })
    .limit(1)
    .single();

  const report = {
    period: "daily",
    revenue: 0,
    active_users: activePractices ?? 0,
    new_users: 0,
    churn_rate: 0,
    health_score: accuracy?.accuracy ?? 75,
    error_count: 0,
    notes: `${totalPredictions ?? 0} predictions this week. Model accuracy: ${accuracy?.accuracy ?? "N/A"}%. Revenue saved: R${accuracy?.revenue_saved ?? 0}.`,
  };

  try {
    const response = await fetch(
      `${WORKSPACE_URL}/api/products/${WORKSPACE_PRODUCT_ID}/report`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Product-Key": WORKSPACE_PRODUCT_API_KEY ?? "",
        },
        body: JSON.stringify(report),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Workspace returned ${response.status}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ message: "Reported to workspace", report });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to report" },
      { status: 500 }
    );
  }
}
