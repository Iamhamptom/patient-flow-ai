"use client";

import { useState, useEffect } from "react";

const BASE = "";
const PRACTICE_ID = "netcare-primary-001";

export function usePracticeData<T>(
  endpoint: string,
  params?: Record<string, string>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams({ practiceId: PRACTICE_ID, ...params });
    fetch(`${BASE}${endpoint}?${qs}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [endpoint]);

  return { data, loading, error };
}

export function usePredictions(date?: string) {
  return usePracticeData<{
    predictions: Array<{
      booking_id: string;
      practice_id: string;
      patient_id: string | null;
      scheduled_at: string;
      risk_score: number;
      risk_level: string;
      confidence: number;
      model_version: string;
      features: Record<string, unknown>;
      explanation: string;
    }>;
  }>("/api/predictions/no-show", date ? { date } : undefined);
}

export function useFlowBoard() {
  return usePracticeData<{
    practiceId: string;
    waitingCount: number;
    inConsultationCount: number;
    checkedOutCount: number;
    noShowCount: number;
    avgWaitMinutes: number;
    longestWaitMinutes: number;
    blockers: Array<{
      patientName: string;
      reason: string;
      minutesBlocked: number;
    }>;
  }>("/api/flow/board");
}

export function useForecast(date?: string) {
  return usePracticeData<{
    practiceId: string;
    forecastDate: string;
    totalBookings: number;
    predictedNoShows: number;
    predictedAttendance: number;
    highRiskCount: number;
    waitlistMatches: number;
    utilizationPct: number;
    atRiskRevenue: number;
    recoverableRevenue: number;
    peakHour: string | null;
    bottleneckRisk: string;
  }>("/api/flow/forecast", date ? { date } : undefined);
}

export function useDoctorPatterns() {
  return usePracticeData<
    Array<{
      doctor_name: string;
      service_type: string;
      patient_type: string;
      avg_duration: number;
      median_duration: number;
      p75_duration: number;
      p95_duration: number;
      std_deviation: number;
      sample_size: number;
      morning_avg: number | null;
      afternoon_avg: number | null;
      day_patterns: Record<string, number>;
    }>
  >("/api/schedule/patterns");
}

export function useWaitlist() {
  return usePracticeData<{
    waitlist: Array<{
      id: string;
      practice_id: string;
      patient_name: string;
      patient_phone: string;
      preferred_service: string;
      preferred_times: string[];
      urgency: string;
      status: string;
      created_at: string;
    }>;
  }>("/api/waitlist");
}

export const PRACTICE_ID_DEFAULT = PRACTICE_ID;
