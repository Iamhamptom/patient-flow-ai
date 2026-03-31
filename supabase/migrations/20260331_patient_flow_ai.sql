-- Patient Flow AI — Database Schema
-- Tables use pf_ prefix in shared Supabase project xquzbgaenmohruluyhgv
-- Reads from existing ho_ tables (ho_bookings, ho_patients, ho_check_ins, etc.)

-- No-show predictions (one per booking)
CREATE TABLE IF NOT EXISTS pf_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL,
  practice_id TEXT NOT NULL,
  patient_id TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  risk_score NUMERIC(5,2) NOT NULL,
  risk_level TEXT NOT NULL,
  confidence NUMERIC(5,2),
  model_version TEXT NOT NULL,
  features JSONB NOT NULL,
  explanation TEXT,
  actual_outcome TEXT,
  outcome_recorded_at TIMESTAMPTZ,
  extra_reminder_sent BOOLEAN DEFAULT FALSE,
  double_booked BOOLEAN DEFAULT FALSE,
  waitlist_filled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_predictions_booking ON pf_predictions(booking_id);
CREATE INDEX IF NOT EXISTS idx_pf_predictions_practice ON pf_predictions(practice_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_pf_predictions_risk ON pf_predictions(practice_id, risk_level);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pf_predictions_booking_unique ON pf_predictions(booking_id);

-- Waitlist entries
CREATE TABLE IF NOT EXISTS pf_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT,
  preferred_service TEXT NOT NULL,
  preferred_dates JSONB,
  preferred_times JSONB,
  urgency TEXT DEFAULT 'routine',
  status TEXT DEFAULT 'waiting',
  offered_booking_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_waitlist_practice ON pf_waitlist(practice_id, status);

-- Statistical model weights
CREATE TABLE IF NOT EXISTS pf_model_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  model_type TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  weights JSONB NOT NULL,
  metrics JSONB,
  training_size INTEGER,
  trained_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pf_weights_active
  ON pf_model_weights(practice_id, model_type) WHERE active = TRUE;

-- Doctor consultation patterns
CREATE TABLE IF NOT EXISTS pf_doctor_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  patient_type TEXT NOT NULL,
  avg_duration NUMERIC(6,1) NOT NULL,
  median_duration NUMERIC(6,1),
  p75_duration NUMERIC(6,1),
  p95_duration NUMERIC(6,1),
  std_deviation NUMERIC(6,1),
  sample_size INTEGER NOT NULL,
  morning_avg NUMERIC(6,1),
  afternoon_avg NUMERIC(6,1),
  day_patterns JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_doctor_patterns ON pf_doctor_patterns(practice_id, doctor_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pf_doctor_patterns_unique
  ON pf_doctor_patterns(practice_id, doctor_name, service_type, patient_type);

-- Optimized schedules
CREATE TABLE IF NOT EXISTS pf_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  schedule_date DATE NOT NULL,
  slots JSONB NOT NULL,
  total_capacity INTEGER,
  estimated_revenue NUMERIC(12,2),
  optimization_notes TEXT,
  original_slots JSONB,
  improvement_pct NUMERIC(5,2),
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_schedules_date ON pf_schedules(practice_id, schedule_date);

-- Daily forecasts
CREATE TABLE IF NOT EXISTS pf_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  forecast_date DATE NOT NULL,
  total_bookings INTEGER,
  predicted_no_shows INTEGER,
  predicted_attendance INTEGER,
  high_risk_count INTEGER,
  waitlist_matches INTEGER,
  total_slots INTEGER,
  utilized_slots INTEGER,
  utilization_pct NUMERIC(5,2),
  at_risk_revenue NUMERIC(12,2),
  recoverable_revenue NUMERIC(12,2),
  avg_wait_time_predicted NUMERIC(6,1),
  peak_hour TEXT,
  bottleneck_risk TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pf_forecasts_date ON pf_forecasts(practice_id, forecast_date);

-- Flow snapshots (hourly)
CREATE TABLE IF NOT EXISTS pf_flow_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  snapshot_at TIMESTAMPTZ DEFAULT NOW(),
  waiting_count INTEGER,
  in_consultation_count INTEGER,
  checked_out_count INTEGER,
  no_show_count INTEGER,
  avg_wait_minutes NUMERIC(6,1),
  longest_wait_minutes NUMERIC(6,1),
  blockers JSONB
);

CREATE INDEX IF NOT EXISTS idx_pf_snapshots ON pf_flow_snapshots(practice_id, snapshot_at);

-- Smart reminders sent
CREATE TABLE IF NOT EXISTS pf_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES pf_predictions(id),
  booking_id TEXT NOT NULL,
  practice_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  patient_confirmed BOOLEAN,
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pf_reminders_booking ON pf_reminders(booking_id);

-- POPIA audit log
CREATE TABLE IF NOT EXISTS pf_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_audit ON pf_audit_log(practice_id, created_at);

-- Practice configuration
CREATE TABLE IF NOT EXISTS pf_practice_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL UNIQUE,
  risk_threshold_high NUMERIC(5,2) DEFAULT 70.0,
  risk_threshold_medium NUMERIC(5,2) DEFAULT 40.0,
  auto_remind_above NUMERIC(5,2) DEFAULT 60.0,
  enable_double_booking BOOLEAN DEFAULT FALSE,
  slot_duration_default INTEGER DEFAULT 20,
  buffer_minutes INTEGER DEFAULT 5,
  morning_complex_cases BOOLEAN DEFAULT TRUE,
  reminder_channels TEXT[] DEFAULT '{whatsapp}',
  reminder_24h BOOLEAN DEFAULT TRUE,
  reminder_2h BOOLEAN DEFAULT TRUE,
  extra_reminder_high_risk BOOLEAN DEFAULT TRUE,
  avg_consultation_fee NUMERIC(10,2) DEFAULT 600.00,
  currency TEXT DEFAULT 'ZAR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Model accuracy tracking
CREATE TABLE IF NOT EXISTS pf_model_accuracy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id TEXT NOT NULL,
  model_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_predictions INTEGER,
  correct_predictions INTEGER,
  accuracy NUMERIC(5,2),
  precision_score NUMERIC(5,2),
  recall_score NUMERIC(5,2),
  f1_score NUMERIC(5,2),
  true_positives INTEGER,
  false_positives INTEGER,
  true_negatives INTEGER,
  false_negatives INTEGER,
  revenue_saved NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pf_accuracy ON pf_model_accuracy(practice_id, period_start);
