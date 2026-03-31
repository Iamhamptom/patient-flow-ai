import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, rateLimit, getClientIp } from "@/lib/auth/guard";
import { supabaseAdmin, tables } from "@/lib/supabase";
import { getDemoDoctorPatterns } from "@/lib/demo/seed";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const practiceId = searchParams.get("practiceId");
  const doctorName = searchParams.get("doctor");

  if (!practiceId) {
    return NextResponse.json(
      { error: "practiceId required" },
      { status: 400 }
    );
  }

  if (isDemoMode()) {
    const patterns = getDemoDoctorPatterns();
    if (doctorName) {
      return NextResponse.json(
        patterns.filter((p) => p.doctorName === doctorName)
      );
    }
    return NextResponse.json(patterns);
  }

  let query = supabaseAdmin
    .from(tables.doctorPatterns)
    .select("*")
    .eq("practice_id", practiceId);

  if (doctorName) {
    query = query.eq("doctor_name", doctorName);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
