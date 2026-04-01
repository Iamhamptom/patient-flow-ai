import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://xquzbgaenmohruluyhgv.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Use a placeholder key at build time to prevent crash during static analysis.
// Actual calls will only happen at runtime when real keys are present.
const BUILD_PLACEHOLDER = "build-placeholder-key";

function getKey(): string {
  return SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY || BUILD_PLACEHOLDER;
}

let _admin: SupabaseClient | null = null;
let _public: SupabaseClient | null = null;

/** Server-side client — service role, full access. API routes only. */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(SUPABASE_URL, getKey(), {
      auth: { persistSession: false },
    });
  }
  return _admin;
}

/** Public client — anon key, client components. */
export function getSupabasePublic(): SupabaseClient {
  if (!_public) {
    _public = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || BUILD_PLACEHOLDER);
  }
  return _public;
}

/** Convenience exports for existing code — lazy initialization */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabasePublic() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/** Patient Flow AI tables (pf_ prefix) */
export const tables = {
  predictions: "pf_predictions",
  waitlist: "pf_waitlist",
  modelWeights: "pf_model_weights",
  doctorPatterns: "pf_doctor_patterns",
  schedules: "pf_schedules",
  forecasts: "pf_forecasts",
  flowSnapshots: "pf_flow_snapshots",
  reminders: "pf_reminders",
  auditLog: "pf_audit_log",
  practiceConfig: "pf_practice_config",
  modelAccuracy: "pf_model_accuracy",
} as const;

/** HealthOps tables we READ/WRITE (ho_ prefix, shared Supabase) */
export const hoTables = {
  practices: "ho_practices",
  patients: "ho_patients",
  bookings: "ho_bookings",
  checkIns: "ho_check_ins",
  notifications: "ho_notifications",
  users: "ho_users",
  vitals: "ho_vitals",
  medicalRecords: "ho_medical_records",
  conversations: "ho_conversations",
  messages: "ho_messages",
  recallItems: "ho_recall_items",
  referrals: "ho_referrals",
  dailyTasks: "ho_daily_tasks",
  invoices: "ho_invoices",
  allergies: "ho_allergies",
  medications: "ho_medications",
  bridgeMessages: "ho_bridge_messages",
  bridgeAdvisories: "ho_bridge_advisories",
  clinics: "ho_clinics",
  clinicDirectory: "ho_clinic_directory",
} as const;
