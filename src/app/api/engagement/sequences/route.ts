import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const practiceId = searchParams.get("practiceId");
  if (!practiceId) return NextResponse.json({ error: "practiceId required" }, { status: 400 });

  const { data } = await supabaseAdmin
    .from("pf_engagement_sequences")
    .select("*, steps:pf_sequence_steps(*)")
    .eq("practice_id", practiceId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ sequences: data ?? [] });
}
