import { supabaseAdmin, hoTables } from "@/lib/supabase";
import type { PredictionFeatures } from "./types";

/** Matches actual ho_bookings columns (snake_case in Supabase) */
export interface BookingRow {
  id: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  service: string;
  scheduled_at: string;
  status: string;
  source: string;
  lead_source: string;
  deposit_paid: boolean;
  reminder_sent_at: string | null;
  practice_id: string;
  created_at: string;
}

interface PatientRow {
  id: string;
  name: string;
  phone: string;
  medical_aid: string | null;
  last_visit: string | null;
}

/**
 * Extract prediction features from a booking + patient history.
 * Reads directly from ho_ tables in shared Supabase.
 */
export async function extractFeatures(
  booking: BookingRow,
  practiceId: string
): Promise<PredictionFeatures> {
  // Find patient by phone match (safe — no string interpolation in filter)
  const { data: patientsByPhone } = await supabaseAdmin
    .from(hoTables.patients)
    .select("id, name, phone, medical_aid, last_visit")
    .eq("practice_id", practiceId)
    .eq("phone", booking.patient_phone)
    .limit(1);

  // Fallback: try email if no phone match
  let patients = patientsByPhone;
  if (!patients?.length && booking.patient_email) {
    const { data: patientsByEmail } = await supabaseAdmin
      .from(hoTables.patients)
      .select("id, name, phone, medical_aid, last_visit")
      .eq("practice_id", practiceId)
      .eq("email", booking.patient_email)
      .limit(1);
    patients = patientsByEmail;
  }

  const patient: PatientRow | null = patients?.[0] ?? null;

  // Get all past bookings for this patient (by phone)
  const { data: pastBookings } = await supabaseAdmin
    .from(hoTables.bookings)
    .select("id, status, scheduled_at")
    .eq("practice_id", practiceId)
    .eq("patient_phone", booking.patient_phone)
    .lt("scheduled_at", booking.scheduled_at)
    .order("scheduled_at", { ascending: false });

  const history = pastBookings ?? [];
  const totalPast = history.length;
  const noShows = history.filter((b) => b.status === "no_show").length;
  const cancellations = history.filter((b) => b.status === "cancelled").length;

  const scheduledDate = new Date(booking.scheduled_at);
  const createdDate = new Date(booking.created_at);
  const leadTimeDays = Math.max(
    0,
    Math.floor(
      (scheduledDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const daysSinceLastVisit = patient?.last_visit
    ? Math.floor(
        (Date.now() - new Date(patient.last_visit).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return {
    historyNoShowRate: totalPast > 0 ? noShows / totalPast : 0,
    historyCancelRate: totalPast > 0 ? cancellations / totalPast : 0,
    totalPastBookings: totalPast,
    dayOfWeek: scheduledDate.getDay(),
    hourOfDay: scheduledDate.getHours(),
    leadTimeDays,
    bookingSource: booking.source || "dashboard",
    leadSource: booking.lead_source || "unknown",
    serviceType: booking.service || "general",
    isNewPatient: totalPast === 0,
    depositPaid: booking.deposit_paid ?? false,
    reminderSent: !!booking.reminder_sent_at,
    confirmationReceived: false,
    daysSinceLastVisit,
    hasMedicalAid: !!patient?.medical_aid,
  };
}

/**
 * Batch-fetch all bookings for a given date range at a practice.
 */
export async function getBookingsForDate(
  practiceId: string,
  date: string
): Promise<BookingRow[]> {
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  const { data, error } = await supabaseAdmin
    .from(hoTables.bookings)
    .select("*")
    .eq("practice_id", practiceId)
    .gte("scheduled_at", startOfDay)
    .lte("scheduled_at", endOfDay)
    .in("status", ["pending", "confirmed"]);

  if (error) throw new Error(`Failed to fetch bookings: ${error.message}`);
  return (data as BookingRow[]) ?? [];
}
