import { NextRequest, NextResponse } from "next/server";
import { guardCronRoute, isDemoMode } from "@/lib/auth/guard";
import { supabaseAdmin, tables, hoTables } from "@/lib/supabase";

/**
 * Cron: Weekly Monday 03:00 — retrain prediction model from actual outcomes.
 *
 * Self-learning loop:
 * 1. Fetch predictions from the past week that have actual outcomes
 * 2. Calculate accuracy metrics (TP, FP, TN, FN, precision, recall, F1)
 * 3. Adjust statistical model weights based on feature importance
 * 4. Store accuracy metrics in pf_model_accuracy
 * 5. Store updated weights in pf_model_weights
 */
export async function GET(req: NextRequest) {
  const blocked = guardCronRoute(req);
  if (blocked) return blocked;

  if (isDemoMode()) {
    return NextResponse.json({ message: "Demo mode — skipped" });
  }

  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const today = new Date().toISOString().split("T")[0];

  // Step 1: Get predictions from last week
  const { data: predictions, error } = await supabaseAdmin
    .from(tables.predictions)
    .select("*")
    .gte("created_at", weekAgo)
    .not("actual_outcome", "is", null);

  if (error || !predictions?.length) {
    // Try to backfill outcomes from booking statuses
    const backfilled = await backfillOutcomes();

    if (backfilled === 0) {
      return NextResponse.json({
        message: "No predictions with outcomes to train on",
        backfilled: 0,
      });
    }

    // Re-fetch after backfill
    const { data: retryPreds } = await supabaseAdmin
      .from(tables.predictions)
      .select("*")
      .gte("created_at", weekAgo)
      .not("actual_outcome", "is", null);

    if (!retryPreds?.length) {
      return NextResponse.json({ message: "No outcomes after backfill", backfilled });
    }

    return await trainAndReport(retryPreds, today, backfilled);
  }

  return await trainAndReport(predictions, today, 0);
}

async function backfillOutcomes(): Promise<number> {
  // Find predictions without outcomes where the booking date has passed
  const { data: pending } = await supabaseAdmin
    .from(tables.predictions)
    .select("booking_id, practice_id")
    .is("actual_outcome", null)
    .lt("scheduled_at", new Date().toISOString());

  if (!pending?.length) return 0;

  let backfilled = 0;
  for (const pred of pending) {
    const { data: booking } = await supabaseAdmin
      .from(hoTables.bookings)
      .select("status")
      .eq("id", pred.booking_id)
      .single();

    if (!booking) continue;

    const outcome =
      booking.status === "no_show"
        ? "no_show"
        : booking.status === "cancelled"
          ? "cancelled"
          : booking.status === "completed" || booking.status === "confirmed"
            ? "showed"
            : null;

    if (outcome) {
      await supabaseAdmin
        .from(tables.predictions)
        .update({
          actual_outcome: outcome,
          outcome_recorded_at: new Date().toISOString(),
        })
        .eq("booking_id", pred.booking_id);
      backfilled++;
    }
  }

  return backfilled;
}

interface PredRow {
  booking_id: string;
  practice_id: string;
  risk_score: string;
  risk_level: string;
  actual_outcome: string;
  features: Record<string, unknown>;
}

async function trainAndReport(predictions: PredRow[], periodEnd: string, backfilled: number) {
  // Step 2: Calculate accuracy metrics
  let tp = 0, fp = 0, tn = 0, fn = 0;

  for (const pred of predictions) {
    const predictedNoShow = Number(pred.risk_score) >= 50;
    const actualNoShow = pred.actual_outcome === "no_show";

    if (predictedNoShow && actualNoShow) tp++;
    else if (predictedNoShow && !actualNoShow) fp++;
    else if (!predictedNoShow && !actualNoShow) tn++;
    else if (!predictedNoShow && actualNoShow) fn++;
  }

  const total = tp + fp + tn + fn;
  const accuracy = total > 0 ? ((tp + tn) / total) * 100 : 0;
  const precision = tp + fp > 0 ? (tp / (tp + fp)) * 100 : 0;
  const recall = tp + fn > 0 ? (tp / (tp + fn)) * 100 : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  const revenueSaved = tp * 600; // Slots filled from correctly predicted no-shows

  // Step 3: Compute feature importance (simple correlation-based)
  const weights = computeWeightAdjustments(predictions);

  // Step 4: Store accuracy
  const practiceIds = [...new Set(predictions.map((p) => p.practice_id))];
  const periodStart = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0];

  for (const practiceId of practiceIds) {
    await supabaseAdmin.from(tables.modelAccuracy).insert({
      practice_id: practiceId,
      model_type: "no_show",
      period_start: periodStart,
      period_end: periodEnd,
      total_predictions: total,
      correct_predictions: tp + tn,
      accuracy: Math.round(accuracy * 100) / 100,
      precision_score: Math.round(precision * 100) / 100,
      recall_score: Math.round(recall * 100) / 100,
      f1_score: Math.round(f1 * 100) / 100,
      true_positives: tp,
      false_positives: fp,
      true_negatives: tn,
      false_negatives: fn,
      revenue_saved: revenueSaved,
    });

    // Step 5: Update model weights if we have enough data
    if (total >= 10 && weights) {
      // Deactivate old weights
      await supabaseAdmin
        .from(tables.modelWeights)
        .update({ active: false })
        .eq("practice_id", practiceId)
        .eq("model_type", "no_show");

      // Insert new weights
      await supabaseAdmin.from(tables.modelWeights).insert({
        practice_id: practiceId,
        model_type: "no_show",
        weights,
        metrics: { accuracy, precision, recall, f1, tp, fp, tn, fn },
        training_size: total,
        active: true,
      });
    }
  }

  return NextResponse.json({
    message: "Model retrained",
    backfilled,
    metrics: {
      total,
      accuracy: Math.round(accuracy * 10) / 10,
      precision: Math.round(precision * 10) / 10,
      recall: Math.round(recall * 10) / 10,
      f1: Math.round(f1 * 10) / 10,
      tp, fp, tn, fn,
      revenueSaved,
    },
    practices: practiceIds.length,
  });
}

function computeWeightAdjustments(predictions: PredRow[]) {
  // Simple feature importance: for each feature, calculate correlation with actual outcome
  const features = predictions.map((p) => ({
    features: p.features,
    noShow: p.actual_outcome === "no_show" ? 1 : 0,
  }));

  if (features.length < 10) return null;

  // Compute adjusted weights based on observed correlations
  const noShowRate = features.reduce((a, b) => a + b.noShow, 0) / features.length;

  return {
    intercept: Math.log(noShowRate / (1 - noShowRate + 0.001)),
    historyNoShowRate: computeCorrelation(features, "historyNoShowRate") * 4.0,
    historyCancelRate: computeCorrelation(features, "historyCancelRate") * 1.5,
    totalPastBookings: -0.05,
    dayMonday: 0.4,
    dayTuesday: 0.0,
    dayWednesday: -0.1,
    dayThursday: 0.1,
    dayFriday: 0.5,
    daySaturday: 0.2,
    leadTimeDays: computeCorrelation(features, "leadTimeDays") * 0.05,
    isNewPatient: computeCorrelation(features, "isNewPatient") * 1.0,
    depositPaid: computeCorrelation(features, "depositPaid") * -3.0,
    reminderSent: computeCorrelation(features, "reminderSent") * -0.8,
    hasMedicalAid: computeCorrelation(features, "hasMedicalAid") * -0.5,
    sourcePublic: 0.6,
    sourceWhatsapp: -0.3,
    sourcePhone: -0.2,
  };
}

function computeCorrelation(
  data: { features: Record<string, unknown>; noShow: number }[],
  featureName: string
): number {
  const values = data.map((d) => ({
    x: Number(d.features[featureName] ?? 0),
    y: d.noShow,
  }));

  const n = values.length;
  if (n < 5) return 0;

  const sumX = values.reduce((a, b) => a + b.x, 0);
  const sumY = values.reduce((a, b) => a + b.y, 0);
  const sumXY = values.reduce((a, b) => a + b.x * b.y, 0);
  const sumX2 = values.reduce((a, b) => a + b.x * b.x, 0);
  const sumY2 = values.reduce((a, b) => a + b.y * b.y, 0);

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));

  return den === 0 ? 0 : Math.max(-1, Math.min(1, num / den));
}
