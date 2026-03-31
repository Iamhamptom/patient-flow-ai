import { generateText, Output } from "ai";
import { z } from "zod";
import type { NoShowPrediction, PredictionFeatures, RiskLevel } from "./types";

const NoShowResultSchema = z.object({
  riskScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  explanation: z.string(),
});

/**
 * Score a single booking for no-show risk using Gemini 2.5 Flash.
 * ~$0.002 per prediction. Returns structured JSON.
 */
export async function scoreWithGemini(
  bookingId: string,
  practiceId: string,
  patientId: string | null,
  scheduledAt: string,
  features: PredictionFeatures
): Promise<NoShowPrediction> {
  const prompt = buildPrompt(features);

  const { text } = await generateText({
    model: "google/gemini-3-flash",
    output: Output.object({ schema: NoShowResultSchema }),
    prompt,
  });

  const result = text as unknown as z.infer<typeof NoShowResultSchema>;
  const riskLevel = scoreToLevel(result.riskScore);

  return {
    bookingId,
    practiceId,
    patientId,
    scheduledAt,
    riskScore: Math.round(result.riskScore * 100) / 100,
    riskLevel,
    confidence: Math.round(result.confidence * 100) / 100,
    modelVersion: "gemini-v1",
    features,
    explanation: result.explanation,
  };
}

function buildPrompt(f: PredictionFeatures): string {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return `You are a patient no-show prediction model for a South African healthcare practice.

Given the following booking features, predict the probability (0-100) that this patient will NOT show up for their appointment.

## Patient Features
- Historical no-show rate: ${(f.historyNoShowRate * 100).toFixed(1)}% (${f.totalPastBookings} past bookings)
- Historical cancellation rate: ${(f.historyCancelRate * 100).toFixed(1)}%
- New patient: ${f.isNewPatient ? "Yes" : "No"}
- Days since last visit: ${f.daysSinceLastVisit ?? "N/A (new patient)"}
- Has medical aid: ${f.hasMedicalAid ? "Yes" : "No"}

## Appointment Features
- Day: ${dayNames[f.dayOfWeek]}
- Hour: ${f.hourOfDay}:00
- Lead time: ${f.leadTimeDays} days in advance
- Service: ${f.serviceType}
- Booking source: ${f.bookingSource}
- Lead source: ${f.leadSource}
- Deposit paid: ${f.depositPaid ? "Yes" : "No"}
- Reminder sent: ${f.reminderSent ? "Yes" : "No"}
- Confirmation received: ${f.confirmationReceived ? "Yes" : "No"}

## SA Healthcare Context
- Monday and Friday have higher no-show rates
- Public bookings (online) have higher no-show than phone/WhatsApp
- Deposit-paid patients almost always show up
- New patients without medical aid have highest no-show rates
- GP referrals have lowest no-show rates

Return a JSON object with:
- riskScore: 0-100 probability of no-show
- confidence: 0-100 how confident you are in this prediction
- explanation: 1-2 sentence explanation of the key risk factors`;
}

export function scoreToLevel(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}
