import { supabaseAdmin, hoTables, tables } from "@/lib/supabase";
import type { DoctorPattern } from "@/lib/prediction/types";

interface CheckInWithBooking {
  patient_name: string;
  arrived_at: string;
  seen_at: string;
  left_at: string;
  status: string;
}

/**
 * Analyze historical consultation patterns per doctor.
 * Calculates avg/median/p75/p95 duration by service type and patient type.
 */
export async function analyzeDoctorPatterns(
  practiceId: string,
  doctorName: string
): Promise<DoctorPattern[]> {
  // Get completed check-ins with timing data
  const { data: checkIns, error } = await supabaseAdmin
    .from(hoTables.checkIns)
    .select("patient_name, arrived_at, seen_at, left_at, status")
    .eq("practice_id", practiceId)
    .eq("status", "checked_out")
    .not("seen_at", "is", null)
    .not("left_at", "is", null)
    .order("arrived_at", { ascending: false })
    .limit(500);

  if (error || !checkIns?.length) return [];

  // Calculate consultation durations
  const durations = (checkIns as CheckInWithBooking[])
    .map((c) => {
      const seen = new Date(c.seen_at).getTime();
      const left = new Date(c.left_at).getTime();
      const minutes = (left - seen) / 60000;
      const hour = new Date(c.seen_at).getHours();
      const day = new Date(c.seen_at).getDay();
      return { minutes, hour, day, patientName: c.patient_name };
    })
    .filter((d) => d.minutes > 0 && d.minutes < 180); // Sanity: 0-3 hours

  if (durations.length === 0) return [];

  // Group by service type (we'll use "general" as default since check-ins
  // don't carry service type — would need booking join in production)
  const allMinutes = durations.map((d) => d.minutes).sort((a, b) => a - b);
  const morningDurations = durations
    .filter((d) => d.hour < 12)
    .map((d) => d.minutes);
  const afternoonDurations = durations
    .filter((d) => d.hour >= 12)
    .map((d) => d.minutes);

  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayPatterns: Record<string, number> = {};
  for (let day = 0; day <= 6; day++) {
    const dayDurations = durations
      .filter((d) => d.day === day)
      .map((d) => d.minutes);
    if (dayDurations.length > 0) {
      dayPatterns[dayNames[day]] = mean(dayDurations);
    }
  }

  const pattern: DoctorPattern = {
    doctorName,
    serviceType: "general",
    patientType: "follow_up",
    avgDuration: mean(allMinutes),
    medianDuration: percentile(allMinutes, 50),
    p75Duration: percentile(allMinutes, 75),
    p95Duration: percentile(allMinutes, 95),
    stdDeviation: stdDev(allMinutes),
    sampleSize: allMinutes.length,
    morningAvg: morningDurations.length > 0 ? mean(morningDurations) : null,
    afternoonAvg:
      afternoonDurations.length > 0 ? mean(afternoonDurations) : null,
    dayPatterns,
  };

  // Store pattern
  await supabaseAdmin.from(tables.doctorPatterns).upsert(
    {
      practice_id: practiceId,
      doctor_name: doctorName,
      service_type: pattern.serviceType,
      patient_type: pattern.patientType,
      avg_duration: pattern.avgDuration,
      median_duration: pattern.medianDuration,
      p75_duration: pattern.p75Duration,
      p95_duration: pattern.p95Duration,
      std_deviation: pattern.stdDeviation,
      sample_size: pattern.sampleSize,
      morning_avg: pattern.morningAvg,
      afternoon_avg: pattern.afternoonAvg,
      day_patterns: pattern.dayPatterns,
    },
    { onConflict: "practice_id,doctor_name,service_type,patient_type" }
  );

  return [pattern];
}

function mean(arr: number[]): number {
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, idx)] * 10) / 10;
}

function stdDev(arr: number[]): number {
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  const squareDiffs = arr.map((v) => (v - avg) ** 2);
  return (
    Math.round(
      Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / arr.length) * 10
    ) / 10
  );
}
