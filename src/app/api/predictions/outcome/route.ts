import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/auth/guard";
import { supabaseAdmin, tables, hoTables } from "@/lib/supabase";

/**
 * POST /api/predictions/outcome — Record actual booking outcome for self-learning.
 * Called when a booking status changes to completed/no_show/cancelled.
 * This feeds the weekly model-retrain cron.
 *
 * Body: { bookingId, outcome: "showed" | "no_show" | "cancelled" }
 * OR: { practiceId, backfill: true } to bulk-backfill from ho_bookings statuses
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, 30, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Bulk backfill mode
  if (body.backfill && body.practiceId) {
    const count = await backfillOutcomes(body.practiceId as string);
    return NextResponse.json({ backfilled: count });
  }

  // Single outcome recording
  const { bookingId, outcome } = body;
  if (!bookingId || !outcome) {
    return NextResponse.json(
      { error: "bookingId and outcome required" },
      { status: 400 }
    );
  }

  if (!["showed", "no_show", "cancelled"].includes(outcome as string)) {
    return NextResponse.json(
      { error: "outcome must be showed, no_show, or cancelled" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from(tables.predictions)
    .update({
      actual_outcome: outcome,
      outcome_recorded_at: new Date().toISOString(),
    })
    .eq("booking_id", bookingId)
    .select("id, booking_id, risk_score, risk_level, actual_outcome")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "No prediction found for this booking" },
      { status: 404 }
    );
  }

  // Self-correction check: was the prediction correct?
  const predictedNoShow = Number(data.risk_score) >= 50;
  const actualNoShow = outcome === "no_show";
  const correct = predictedNoShow === actualNoShow;

  return NextResponse.json({
    recorded: true,
    bookingId: data.booking_id,
    riskScore: data.risk_score,
    riskLevel: data.risk_level,
    actualOutcome: outcome,
    predictionCorrect: correct,
    selfCorrectionNote: correct
      ? null
      : predictedNoShow
        ? `False positive: predicted no-show (${data.risk_score}%) but patient ${outcome === "showed" ? "showed up" : "cancelled"}. Model will adjust next retrain.`
        : `False negative: predicted show (${data.risk_score}%) but patient no-showed. Model will increase weight for this patient profile next retrain.`,
  });
}

async function backfillOutcomes(practiceId: string): Promise<number> {
  const { data: pending } = await supabaseAdmin
    .from(tables.predictions)
    .select("booking_id")
    .eq("practice_id", practiceId)
    .is("actual_outcome", null)
    .lt("scheduled_at", new Date().toISOString());

  if (!pending?.length) return 0;

  let count = 0;
  for (const pred of pending) {
    const { data: booking } = await supabaseAdmin
      .from(hoTables.bookings)
      .select("status")
      .eq("id", pred.booking_id)
      .single();

    if (!booking) continue;

    const outcome =
      booking.status === "no_show" ? "no_show" :
      booking.status === "cancelled" ? "cancelled" :
      booking.status === "completed" || booking.status === "confirmed" ? "showed" :
      null;

    if (outcome) {
      await supabaseAdmin
        .from(tables.predictions)
        .update({
          actual_outcome: outcome,
          outcome_recorded_at: new Date().toISOString(),
        })
        .eq("booking_id", pred.booking_id);
      count++;
    }
  }

  return count;
}
