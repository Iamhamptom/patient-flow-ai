import { supabaseAdmin, hoTables } from "@/lib/supabase";
import type { PredictionFeatures } from "./types";

interface BookingRow {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  service: string;
  scheduledAt: string;
  status: string;
  source: string;
  leadSource: string;
  depositPaid: boolean;
  reminderSentAt: string | null;
  practiceId: string;
  createdAt: string;
}

interface PatientRow {
  id: string;
  name: string;
  phone: string;
  medicalAid: string | null;
  lastVisit: string | null;
}

/**
 * Extract prediction features from a booking + patient history.
 * Reads directly from ho_ tables in shared Supabase.
 */
export async function extractFeatures(
  booking: BookingRow,
  practiceId: string
): Promise<PredictionFeatures> {
  // Find patient by phone or email match
  const { data: patients } = await supabaseAdmin
    .from(hoTables.patients)
    .select("id, name, phone, medicalAid, lastVisit")
    .eq("practiceId", practiceId)
    .or(`phone.eq.${booking.patientPhone},email.eq.${booking.patientEmail}`)
    .limit(1);

  const patient: PatientRow | null = patients?.[0] ?? null;

  // Get all past bookings for this patient (by phone)
  const { data: pastBookings } = await supabaseAdmin
    .from(hoTables.bookings)
    .select("id, status, scheduledAt")
    .eq("practiceId", practiceId)
    .eq("patientPhone", booking.patientPhone)
    .lt("scheduledAt", booking.scheduledAt)
    .order("scheduledAt", { ascending: false });

  const history = pastBookings ?? [];
  const totalPast = history.length;
  const noShows = history.filter((b) => b.status === "no_show").length;
  const cancellations = history.filter((b) => b.status === "cancelled").length;

  const scheduledDate = new Date(booking.scheduledAt);
  const createdDate = new Date(booking.createdAt);
  const leadTimeDays = Math.max(
    0,
    Math.floor(
      (scheduledDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const daysSinceLastVisit = patient?.lastVisit
    ? Math.floor(
        (Date.now() - new Date(patient.lastVisit).getTime()) /
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
    leadSource: booking.leadSource || "unknown",
    serviceType: booking.service || "general",
    isNewPatient: totalPast === 0,
    depositPaid: booking.depositPaid ?? false,
    reminderSent: !!booking.reminderSentAt,
    confirmationReceived: false, // TODO: infer from WhatsApp response
    daysSinceLastVisit,
    hasMedicalAid: !!patient?.medicalAid,
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
    .eq("practiceId", practiceId)
    .gte("scheduledAt", startOfDay)
    .lte("scheduledAt", endOfDay)
    .in("status", ["pending", "confirmed"]);

  if (error) throw new Error(`Failed to fetch bookings: ${error.message}`);
  return (data as BookingRow[]) ?? [];
}
