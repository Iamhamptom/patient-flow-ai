import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, rateLimit, getClientIp } from "@/lib/auth/guard";
import { supabaseAdmin, tables } from "@/lib/supabase";
import { getDemoForecast } from "@/lib/demo/seed";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const practiceId = searchParams.get("practiceId");
  const date =
    searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  if (!practiceId) {
    return NextResponse.json(
      { error: "practiceId required" },
      { status: 400 }
    );
  }

  if (isDemoMode()) {
    return NextResponse.json(getDemoForecast());
  }

  const { data, error } = await supabaseAdmin
    .from(tables.forecasts)
    .select("*")
    .eq("practice_id", practiceId)
    .eq("forecast_date", date)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "No forecast available. Run /api/cron/morning-forecast first." },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
