import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/auth/guard";
import { supabaseAdmin, hoTables } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const practiceId = searchParams.get("practiceId");
  if (!practiceId) return NextResponse.json({ error: "practiceId required" }, { status: 400 });

  const [sequences, campaigns, enrollments, notifications, recalls] = await Promise.all([
    supabaseAdmin.from("pf_engagement_sequences").select("id", { count: "exact", head: true }).eq("practice_id", practiceId),
    supabaseAdmin.from("pf_campaigns").select("id, sent_count, responded_count").eq("practice_id", practiceId),
    supabaseAdmin.from("pf_sequence_enrollments").select("id, status").eq("practice_id", practiceId),
    supabaseAdmin.from(hoTables.notifications).select("id, type, status").eq("practice_id", practiceId).gte("sent_at", new Date(Date.now() - 30 * 86_400_000).toISOString()),
    supabaseAdmin.from(hoTables.recallItems).select("id, contacted").eq("practice_id", practiceId),
  ]);

  const activeEnrollments = enrollments.data?.filter((e) => e.status === "active").length ?? 0;
  const completedEnrollments = enrollments.data?.filter((e) => e.status === "completed").length ?? 0;
  const totalSent = campaigns.data?.reduce((a, c) => a + (c.sent_count ?? 0), 0) ?? 0;
  const totalResponded = campaigns.data?.reduce((a, c) => a + (c.responded_count ?? 0), 0) ?? 0;

  return NextResponse.json({
    sequences: sequences.count ?? 0,
    campaigns: campaigns.data?.length ?? 0,
    enrollments: { active: activeEnrollments, completed: completedEnrollments },
    notifications: { last30Days: notifications.data?.length ?? 0 },
    campaignsSent: totalSent,
    campaignResponseRate: totalSent > 0 ? `${Math.round((totalResponded / totalSent) * 100)}%` : "N/A",
    recalls: {
      total: recalls.data?.length ?? 0,
      contacted: recalls.data?.filter((r) => r.contacted).length ?? 0,
      pending: recalls.data?.filter((r) => !r.contacted).length ?? 0,
    },
  });
}
