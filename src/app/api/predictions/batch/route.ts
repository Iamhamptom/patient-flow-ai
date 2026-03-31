import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, rateLimit, getClientIp } from "@/lib/auth/guard";
import { getBookingsForDate, extractFeatures } from "@/lib/prediction/features";
import { scoreWithStatisticalModel, loadWeights } from "@/lib/prediction/statistical-model";
import { supabaseAdmin, tables } from "@/lib/supabase";

/**
 * POST /api/predictions/batch — Score all bookings for a date.
 * Body: { practiceId, date }
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const { practiceId, date } = await req.json();
  if (!practiceId) {
    return NextResponse.json({ error: "practiceId required" }, { status: 400 });
  }

  const targetDate = date ?? new Date().toISOString().split("T")[0];

  if (isDemoMode()) {
    return NextResponse.json({ scored: 10, date: targetDate });
  }

  const bookings = await getBookingsForDate(practiceId, targetDate);
  const weights = await loadWeights(practiceId);
  let scored = 0;

  for (const booking of bookings) {
    const features = await extractFeatures(booking, practiceId);
    const prediction = scoreWithStatisticalModel(
      booking.id,
      practiceId,
      null,
      booking.scheduled_at,
      features,
      weights
    );

    await supabaseAdmin.from(tables.predictions).upsert(
      {
        booking_id: prediction.bookingId,
        practice_id: prediction.practiceId,
        patient_id: prediction.patientId,
        scheduled_at: prediction.scheduledAt,
        risk_score: prediction.riskScore,
        risk_level: prediction.riskLevel,
        confidence: prediction.confidence,
        model_version: prediction.modelVersion,
        features: prediction.features,
        explanation: prediction.explanation,
      },
      { onConflict: "booking_id" }
    );
    scored++;
  }

  return NextResponse.json({ scored, date: targetDate, practiceId });
}
