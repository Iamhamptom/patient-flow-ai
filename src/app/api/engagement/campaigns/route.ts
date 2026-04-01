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
    .from("pf_campaigns")
    .select("*")
    .eq("practice_id", practiceId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from("pf_campaigns")
      .insert({
        practice_id: body.practiceId,
        name: body.name,
        campaign_type: body.campaignType ?? "recall",
        channel: body.channel ?? "whatsapp",
        message_template: body.messageTemplate,
        target_criteria: body.targetCriteria ?? null,
        status: "draft",
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: data.id });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
