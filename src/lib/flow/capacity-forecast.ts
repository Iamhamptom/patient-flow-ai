import { supabaseAdmin, tables, hoTables } from "@/lib/supabase";
import type { DayForecast, RiskLevel } from "@/lib/prediction/types";
import { extractFeatures, getBookingsForDate } from "@/lib/prediction/features";
import {
  scoreWithStatisticalModel,
  loadWeights,
} from "@/lib/prediction/statistical-model";
import { scoreToLevel } from "@/lib/prediction/no-show-scorer";

/**
 * Generate a morning capacity forecast for a practice.
 * Uses the statistical model (free) for batch scoring.
 */
export async function generateDayForecast(
  practiceId: string,
  date: string
): Promise<DayForecast> {
  const bookings = await getBookingsForDate(practiceId, date);
  const weights = await loadWeights(practiceId);

  // Load practice config for fee calculation
  const { data: config } = await supabaseAdmin
    .from(tables.practiceConfig)
    .select("avg_consultation_fee")
    .eq("practice_id", practiceId)
    .single();

  const fee = config?.avg_consultation_fee ?? 600;

  // Score all bookings
  const predictions = await Promise.all(
    bookings.map(async (booking) => {
      const features = await extractFeatures(booking, practiceId);
      return scoreWithStatisticalModel(
        booking.id,
        practiceId,
        null,
        booking.scheduledAt,
        features,
        weights
      );
    })
  );

  // Store predictions
  for (const pred of predictions) {
    await supabaseAdmin.from(tables.predictions).upsert(
      {
        booking_id: pred.bookingId,
        practice_id: pred.practiceId,
        patient_id: pred.patientId,
        scheduled_at: pred.scheduledAt,
        risk_score: pred.riskScore,
        risk_level: pred.riskLevel,
        confidence: pred.confidence,
        model_version: pred.modelVersion,
        features: pred.features,
        explanation: pred.explanation,
      },
      { onConflict: "booking_id" }
    );
  }

  const highRisk = predictions.filter(
    (p) => p.riskLevel === "high" || p.riskLevel === "critical"
  );
  const predictedNoShows = predictions.filter((p) => p.riskScore >= 50).length;

  // Check waitlist matches
  const { count: waitlistCount } = await supabaseAdmin
    .from(tables.waitlist)
    .select("id", { count: "exact", head: true })
    .eq("practice_id", practiceId)
    .eq("status", "waiting");

  // Determine bottleneck risk based on volume + no-show rate
  const noShowRate =
    bookings.length > 0 ? predictedNoShows / bookings.length : 0;
  let bottleneckRisk: RiskLevel = "low";
  if (noShowRate > 0.3) bottleneckRisk = "high";
  else if (noShowRate > 0.15) bottleneckRisk = "medium";

  const forecast: DayForecast = {
    practiceId,
    forecastDate: date,
    totalBookings: bookings.length,
    predictedNoShows,
    predictedAttendance: bookings.length - predictedNoShows,
    highRiskCount: highRisk.length,
    waitlistMatches: Math.min(waitlistCount ?? 0, predictedNoShows),
    totalSlots: Math.max(bookings.length, 20), // Assume 20 min capacity baseline
    utilizedSlots: bookings.length,
    utilizationPct:
      bookings.length > 0
        ? Math.round((bookings.length / Math.max(bookings.length, 20)) * 100)
        : 0,
    atRiskRevenue: highRisk.length * fee,
    recoverableRevenue:
      Math.min(waitlistCount ?? 0, predictedNoShows) * fee,
    avgWaitTimePredicted: null,
    peakHour: findPeakHour(bookings),
    bottleneckRisk,
  };

  // Save forecast
  await supabaseAdmin.from(tables.forecasts).upsert(
    {
      practice_id: practiceId,
      forecast_date: date,
      ...snakeCase(forecast),
    },
    { onConflict: "practice_id,forecast_date" }
  );

  return forecast;
}

function findPeakHour(
  bookings: { scheduledAt: string }[]
): string | null {
  if (bookings.length === 0) return null;
  const hourCounts: Record<number, number> = {};
  for (const b of bookings) {
    const hour = new Date(b.scheduledAt).getHours();
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
  }
  const peakHour = Object.entries(hourCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];
  return peakHour ? `${peakHour[0].padStart(2, "0")}:00` : null;
}

function snakeCase(obj: DayForecast) {
  return {
    total_bookings: obj.totalBookings,
    predicted_no_shows: obj.predictedNoShows,
    predicted_attendance: obj.predictedAttendance,
    high_risk_count: obj.highRiskCount,
    waitlist_matches: obj.waitlistMatches,
    total_slots: obj.totalSlots,
    utilized_slots: obj.utilizedSlots,
    utilization_pct: obj.utilizationPct,
    at_risk_revenue: obj.atRiskRevenue,
    recoverable_revenue: obj.recoverableRevenue,
    avg_wait_time_predicted: obj.avgWaitTimePredicted,
    peak_hour: obj.peakHour,
    bottleneck_risk: obj.bottleneckRisk,
  };
}
