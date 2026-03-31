export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface PredictionFeatures {
  historyNoShowRate: number;
  historyCancelRate: number;
  totalPastBookings: number;
  dayOfWeek: number;
  hourOfDay: number;
  leadTimeDays: number;
  bookingSource: string;
  leadSource: string;
  serviceType: string;
  isNewPatient: boolean;
  depositPaid: boolean;
  reminderSent: boolean;
  confirmationReceived: boolean;
  daysSinceLastVisit: number | null;
  hasMedicalAid: boolean;
}

export interface NoShowPrediction {
  bookingId: string;
  practiceId: string;
  patientId: string | null;
  scheduledAt: string;
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  modelVersion: string;
  features: PredictionFeatures;
  explanation: string;
}

export interface ModelWeights {
  intercept: number;
  historyNoShowRate: number;
  historyCancelRate: number;
  totalPastBookings: number;
  dayMonday: number;
  dayTuesday: number;
  dayWednesday: number;
  dayThursday: number;
  dayFriday: number;
  daySaturday: number;
  leadTimeDays: number;
  isNewPatient: number;
  depositPaid: number;
  reminderSent: number;
  hasMedicalAid: number;
  sourcePublic: number;
  sourceWhatsapp: number;
  sourcePhone: number;
}

export interface DoctorPattern {
  doctorName: string;
  serviceType: string;
  patientType: "new" | "follow_up" | "procedure";
  avgDuration: number;
  medianDuration: number;
  p75Duration: number;
  p95Duration: number;
  stdDeviation: number;
  sampleSize: number;
  morningAvg: number | null;
  afternoonAvg: number | null;
  dayPatterns: Record<string, number>;
}

export interface DayForecast {
  practiceId: string;
  forecastDate: string;
  totalBookings: number;
  predictedNoShows: number;
  predictedAttendance: number;
  highRiskCount: number;
  waitlistMatches: number;
  totalSlots: number;
  utilizedSlots: number;
  utilizationPct: number;
  atRiskRevenue: number;
  recoverableRevenue: number;
  avgWaitTimePredicted: number | null;
  peakHour: string | null;
  bottleneckRisk: RiskLevel;
}

export interface FlowSnapshot {
  practiceId: string;
  waitingCount: number;
  inConsultationCount: number;
  checkedOutCount: number;
  noShowCount: number;
  avgWaitMinutes: number;
  longestWaitMinutes: number;
  blockers: FlowBlocker[];
}

export interface FlowBlocker {
  patientName: string;
  reason: string;
  minutesBlocked: number;
}

export interface ScheduleSlot {
  time: string;
  durationMinutes: number;
  type: "consultation" | "procedure" | "follow_up" | "buffer";
  patientType: "new" | "follow_up" | "procedure" | null;
  buffer: boolean;
  bookingId?: string;
  patientName?: string;
}

export interface PracticeConfig {
  practiceId: string;
  riskThresholdHigh: number;
  riskThresholdMedium: number;
  autoRemindAbove: number;
  enableDoubleBooking: boolean;
  slotDurationDefault: number;
  bufferMinutes: number;
  morningComplexCases: boolean;
  reminderChannels: string[];
  reminder24h: boolean;
  reminder2h: boolean;
  extraReminderHighRisk: boolean;
  avgConsultationFee: number;
  currency: string;
}

export const DEFAULT_CONFIG: PracticeConfig = {
  practiceId: "",
  riskThresholdHigh: 70,
  riskThresholdMedium: 40,
  autoRemindAbove: 60,
  enableDoubleBooking: false,
  slotDurationDefault: 20,
  bufferMinutes: 5,
  morningComplexCases: true,
  reminderChannels: ["whatsapp"],
  reminder24h: true,
  reminder2h: true,
  extraReminderHighRisk: true,
  avgConsultationFee: 600,
  currency: "ZAR",
};
