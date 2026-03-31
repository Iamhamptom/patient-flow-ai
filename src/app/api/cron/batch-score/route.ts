import { NextRequest, NextResponse } from "next/server";
import { guardCronRoute, isDemoMode } from "@/lib/auth/guard";
import { getBookingsForDate, extractFeatures } from "@/lib/prediction/features";
import {
  scoreWithStatisticalModel,
  loadWeights,
} from "@/lib/prediction/statistical-model";
import { supabaseAdmin, tables } from "@/lib/supabase";

/**
 * Cron: Daily 20:00 SAST — batch score all tomorrow's bookings.
 * Uses statistical model (free) for batch operations.
 */
export async function GET(req: NextRequest) {
  const blocked = guardCronRoute(req);
  if (blocked) return blocked;

  if (isDemoMode()) {
    return NextResponse.json({ message: "Demo mode — skipped" });
  }

  const tomorrow = new Date(Date.now() + 86_400_000)
    .toISOString()
    .split("T")[0];

  // Get all practices
  const { data: configs } = await supabaseAdmin
    .from(tables.practiceConfig)
    .select("practice_id");

  if (!configs?.length) {
    return NextResponse.json({ message: "No practices", scored: 0 });
  }

  let totalScored = 0;

  for (const config of configs) {
    const practiceId = config.practice_id;
    const bookings = await getBookingsForDate(practiceId, tomorrow);
    const weights = await loadWeights(practiceId);

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

      totalScored++;
    }
  }

  return NextResponse.json({
    message: `Scored ${totalScored} bookings for ${tomorrow}`,
    date: tomorrow,
    scored: totalScored,
  });
}
