/**
 * Email Processor — AI triage + patient matching for inbound email.
 * Adapted from Netcare Health OS for Supabase.
 */
import { supabaseAdmin, hoTables } from "@/lib/supabase";

const INBOX_TABLE = "pf_email_inbox";

type EmailCategory =
  | "appointment"
  | "prescription"
  | "results"
  | "billing"
  | "complaint"
  | "referral"
  | "spam";

/** Classify an email into a category */
export function classifyEmail(
  subject: string,
  body: string
): { category: EmailCategory; priority: string; summary: string } {
  const text = `${subject} ${body}`.toLowerCase();

  if (text.includes("appointment") || text.includes("booking") || text.includes("schedule"))
    return { category: "appointment", priority: "normal", summary: "Appointment request/inquiry" };

  if (text.includes("prescription") || text.includes("medication") || text.includes("refill"))
    return { category: "prescription", priority: "normal", summary: "Prescription/medication request" };

  if (text.includes("result") || text.includes("lab") || text.includes("test") || text.includes("pathology"))
    return { category: "results", priority: "high", summary: "Lab/test results inquiry" };

  if (text.includes("invoice") || text.includes("bill") || text.includes("payment") || text.includes("account"))
    return { category: "billing", priority: "normal", summary: "Billing/payment inquiry" };

  if (text.includes("complaint") || text.includes("unhappy") || text.includes("dissatisfied"))
    return { category: "complaint", priority: "high", summary: "Patient complaint" };

  if (text.includes("referral") || text.includes("refer"))
    return { category: "referral", priority: "normal", summary: "Referral correspondence" };

  if (text.includes("urgent") || text.includes("emergency"))
    return { category: "appointment", priority: "high", summary: "Urgent medical inquiry" };

  return { category: "spam", priority: "low", summary: "Uncategorized email" };
}

/** Match email sender to a patient */
export async function matchEmailToPatient(
  fromEmail: string,
  practiceId: string
): Promise<{ patientId: string; patientName: string } | null> {
  const { data } = await supabaseAdmin
    .from(hoTables.patients)
    .select("id, name")
    .eq("practice_id", practiceId)
    .eq("email", fromEmail)
    .limit(1);

  if (data?.[0]) return { patientId: data[0].id, patientName: data[0].name };
  return null;
}

/** Process an inbound email — triage + save to inbox */
export async function processInboundEmail(
  practiceId: string,
  fromEmail: string,
  fromName: string,
  subject: string,
  bodyText: string,
  bodyHtml?: string,
  source: string = "gmail",
  externalId?: string
) {
  const triage = classifyEmail(subject, bodyText);
  const patient = await matchEmailToPatient(fromEmail, practiceId);

  const { data, error } = await supabaseAdmin
    .from(INBOX_TABLE)
    .insert({
      practice_id: practiceId,
      source,
      external_id: externalId ?? null,
      from_email: fromEmail,
      from_name: fromName,
      subject,
      body_text: bodyText,
      body_html: bodyHtml ?? null,
      patient_id: patient?.patientId ?? null,
      patient_name: patient?.patientName ?? null,
      triage_category: triage.category,
      triage_priority: triage.priority,
      triage_summary: triage.summary,
      status: "unread",
      received_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return {
    inboxId: data.id,
    category: triage.category,
    priority: triage.priority,
    patientMatch: patient,
  };
}
