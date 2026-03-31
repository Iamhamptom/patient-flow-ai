import { supabaseAdmin, tables } from "@/lib/supabase";
import type {
  ModelWeights,
  NoShowPrediction,
  PredictionFeatures,
} from "./types";
import { scoreToLevel } from "./no-show-scorer";

/**
 * Default model weights — calibrated from SA healthcare literature.
 * Updated weekly via /api/cron/model-retrain from actual outcomes.
 */
const DEFAULT_WEIGHTS: ModelWeights = {
  intercept: -1.2,
  historyNoShowRate: 3.5,
  historyCancelRate: 1.2,
  totalPastBookings: -0.05,
  dayMonday: 0.4,
  dayTuesday: 0.0,
  dayWednesday: -0.1,
  dayThursday: 0.1,
  dayFriday: 0.5,
  daySaturday: 0.2,
  leadTimeDays: 0.03,
  isNewPatient: 0.8,
  depositPaid: -2.5,
  reminderSent: -0.6,
  hasMedicalAid: -0.4,
  sourcePublic: 0.6,
  sourceWhatsapp: -0.3,
  sourcePhone: -0.2,
};

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Score a booking using local logistic regression.
 * Zero API cost — used for batch scoring and fallback.
 */
export function scoreWithStatisticalModel(
  bookingId: string,
  practiceId: string,
  patientId: string | null,
  scheduledAt: string,
  features: PredictionFeatures,
  weights: ModelWeights = DEFAULT_WEIGHTS
): NoShowPrediction {
  const w = weights;

  let logit = w.intercept;
  logit += w.historyNoShowRate * features.historyNoShowRate;
  logit += w.historyCancelRate * features.historyCancelRate;
  logit += w.totalPastBookings * Math.min(features.totalPastBookings, 20);

  // Day-of-week encoding
  const dayWeights: Record<number, number> = {
    1: w.dayMonday,
    2: w.dayTuesday,
    3: w.dayWednesday,
    4: w.dayThursday,
    5: w.dayFriday,
    6: w.daySaturday,
  };
  logit += dayWeights[features.dayOfWeek] ?? 0;

  logit += w.leadTimeDays * Math.min(features.leadTimeDays, 30);
  logit += w.isNewPatient * (features.isNewPatient ? 1 : 0);
  logit += w.depositPaid * (features.depositPaid ? 1 : 0);
  logit += w.reminderSent * (features.reminderSent ? 1 : 0);
  logit += w.hasMedicalAid * (features.hasMedicalAid ? 1 : 0);

  // Source encoding
  if (features.bookingSource === "public") logit += w.sourcePublic;
  else if (features.bookingSource === "whatsapp") logit += w.sourceWhatsapp;
  else if (features.bookingSource === "phone") logit += w.sourcePhone;

  const probability = sigmoid(logit) * 100;
  const riskScore = Math.round(probability * 100) / 100;

  return {
    bookingId,
    practiceId,
    patientId,
    scheduledAt,
    riskScore,
    riskLevel: scoreToLevel(riskScore),
    confidence: 65, // Statistical model has moderate confidence
    modelVersion: "statistical-v1",
    features,
    explanation: buildExplanation(features, riskScore),
  };
}

function buildExplanation(f: PredictionFeatures, score: number): string {
  const factors: string[] = [];

  if (f.historyNoShowRate > 0.3)
    factors.push(
      `high historical no-show rate (${(f.historyNoShowRate * 100).toFixed(0)}%)`
    );
  if (f.isNewPatient) factors.push("new patient with no history");
  if (f.depositPaid) factors.push("deposit paid (strong show signal)");
  if (f.leadTimeDays > 14)
    factors.push(`booked ${f.leadTimeDays} days ahead (higher risk)`);
  if (!f.hasMedicalAid) factors.push("no medical aid on file");
  if (f.dayOfWeek === 1 || f.dayOfWeek === 5)
    factors.push("Monday/Friday (higher no-show day)");
  if (f.reminderSent) factors.push("reminder sent (reduces risk)");

  if (factors.length === 0) {
    return score > 50
      ? "Moderate risk based on combined factors."
      : "Low risk — standard booking profile.";
  }

  return `Key factors: ${factors.join(", ")}.`;
}

/**
 * Load practice-specific weights from DB, falling back to defaults.
 */
export async function loadWeights(
  practiceId: string
): Promise<ModelWeights> {
  const { data } = await supabaseAdmin
    .from(tables.modelWeights)
    .select("weights")
    .eq("practice_id", practiceId)
    .eq("model_type", "no_show")
    .eq("active", true)
    .single();

  if (data?.weights) return data.weights as ModelWeights;
  return DEFAULT_WEIGHTS;
}
