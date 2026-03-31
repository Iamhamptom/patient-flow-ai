import type {
  NoShowPrediction,
  DayForecast,
  FlowSnapshot,
  DoctorPattern,
  PracticeConfig,
  DEFAULT_CONFIG,
} from "@/lib/prediction/types";

const PRACTICE_ID = "demo-practice-001";

/** Generate synthetic bookings for demo mode */
export function getDemoBookings() {
  const today = new Date().toISOString().split("T")[0];
  return [
    {
      id: "bk-001",
      patientName: "Thandi Mokoena",
      patientPhone: "+27821234001",
      patientEmail: "thandi@example.com",
      service: "General Consultation",
      scheduledAt: `${today}T08:30:00`,
      status: "confirmed",
      source: "whatsapp",
      leadSource: "word_of_mouth",
      depositPaid: false,
      reminderSentAt: `${today}T06:30:00`,
      practiceId: PRACTICE_ID,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: "bk-002",
      patientName: "Sipho Ndlovu",
      patientPhone: "+27821234002",
      patientEmail: "sipho@example.com",
      service: "Follow-up",
      scheduledAt: `${today}T09:00:00`,
      status: "confirmed",
      source: "phone",
      leadSource: "gp_referral",
      depositPaid: true,
      reminderSentAt: null,
      practiceId: PRACTICE_ID,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: "bk-003",
      patientName: "Lerato Khumalo",
      patientPhone: "+27821234003",
      patientEmail: "lerato@example.com",
      service: "New Patient Assessment",
      scheduledAt: `${today}T09:30:00`,
      status: "pending",
      source: "public",
      leadSource: "google_ads",
      depositPaid: false,
      reminderSentAt: null,
      practiceId: PRACTICE_ID,
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: "bk-004",
      patientName: "Nokuthula Zulu",
      patientPhone: "+27821234004",
      patientEmail: "noku@example.com",
      service: "Blood Test",
      scheduledAt: `${today}T10:00:00`,
      status: "confirmed",
      source: "dashboard",
      leadSource: "medical_aid_dir",
      depositPaid: true,
      reminderSentAt: `${today}T06:00:00`,
      practiceId: PRACTICE_ID,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: "bk-005",
      patientName: "Bongani Mthembu",
      patientPhone: "+27821234005",
      patientEmail: "bongani@example.com",
      service: "Chronic Medication Review",
      scheduledAt: `${today}T10:30:00`,
      status: "confirmed",
      source: "whatsapp",
      leadSource: "word_of_mouth",
      depositPaid: false,
      reminderSentAt: `${today}T06:30:00`,
      practiceId: PRACTICE_ID,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: "bk-006",
      patientName: "Zanele Dlamini",
      patientPhone: "+27821234006",
      patientEmail: "zanele@example.com",
      service: "Procedure — Minor Surgery",
      scheduledAt: `${today}T11:00:00`,
      status: "confirmed",
      source: "phone",
      leadSource: "gp_referral",
      depositPaid: true,
      reminderSentAt: `${today}T07:00:00`,
      practiceId: PRACTICE_ID,
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      id: "bk-007",
      patientName: "Themba Ngcobo",
      patientPhone: "+27821234007",
      patientEmail: "themba@example.com",
      service: "General Consultation",
      scheduledAt: `${today}T11:30:00`,
      status: "pending",
      source: "public",
      leadSource: "social_media",
      depositPaid: false,
      reminderSentAt: null,
      practiceId: PRACTICE_ID,
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
    {
      id: "bk-008",
      patientName: "Nomvula Mabaso",
      patientPhone: "+27821234008",
      patientEmail: "nomvula@example.com",
      service: "Follow-up",
      scheduledAt: `${today}T13:00:00`,
      status: "confirmed",
      source: "dashboard",
      leadSource: "word_of_mouth",
      depositPaid: false,
      reminderSentAt: `${today}T06:30:00`,
      practiceId: PRACTICE_ID,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: "bk-009",
      patientName: "Andile Sithole",
      patientPhone: "+27821234009",
      patientEmail: "andile@example.com",
      service: "General Consultation",
      scheduledAt: `${today}T14:00:00`,
      status: "confirmed",
      source: "public",
      leadSource: "seo",
      depositPaid: false,
      reminderSentAt: null,
      practiceId: PRACTICE_ID,
      createdAt: new Date(Date.now() - 21 * 86400000).toISOString(),
    },
    {
      id: "bk-010",
      patientName: "Palesa Molefe",
      patientPhone: "+27821234010",
      patientEmail: "palesa@example.com",
      service: "Vaccination",
      scheduledAt: `${today}T15:00:00`,
      status: "confirmed",
      source: "whatsapp",
      leadSource: "corporate_wellness",
      depositPaid: true,
      reminderSentAt: `${today}T06:30:00`,
      practiceId: PRACTICE_ID,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ];
}

/** Demo predictions — pre-scored */
export function getDemoPredictions(): NoShowPrediction[] {
  const today = new Date().toISOString().split("T")[0];
  const bookings = getDemoBookings();

  const scores = [22, 8, 78, 12, 45, 5, 85, 30, 62, 10];

  return bookings.map((b, i) => ({
    bookingId: b.id,
    practiceId: PRACTICE_ID,
    patientId: null,
    scheduledAt: b.scheduledAt,
    riskScore: scores[i],
    riskLevel:
      scores[i] >= 80
        ? ("critical" as const)
        : scores[i] >= 60
          ? ("high" as const)
          : scores[i] >= 35
            ? ("medium" as const)
            : ("low" as const),
    confidence: 72,
    modelVersion: "demo-v1",
    features: {
      historyNoShowRate: scores[i] > 50 ? 0.4 : 0.1,
      historyCancelRate: 0.1,
      totalPastBookings: Math.floor(Math.random() * 10),
      dayOfWeek: new Date(b.scheduledAt).getDay(),
      hourOfDay: new Date(b.scheduledAt).getHours(),
      leadTimeDays: Math.floor(
        (new Date(b.scheduledAt).getTime() - new Date(b.createdAt).getTime()) /
          86400000
      ),
      bookingSource: b.source,
      leadSource: b.leadSource,
      serviceType: b.service,
      isNewPatient: scores[i] > 70,
      depositPaid: b.depositPaid,
      reminderSent: !!b.reminderSentAt,
      confirmationReceived: b.depositPaid,
      daysSinceLastVisit: scores[i] > 50 ? 90 : 14,
      hasMedicalAid: b.depositPaid,
    },
    explanation:
      scores[i] >= 60
        ? "High risk: new patient, no deposit, booked far in advance, no confirmation."
        : scores[i] >= 35
          ? "Moderate risk: some history of cancellations, no deposit."
          : "Low risk: returning patient, good attendance history.",
  }));
}

/** Demo flow board state */
export function getDemoFlowSnapshot(): FlowSnapshot {
  return {
    practiceId: PRACTICE_ID,
    waitingCount: 3,
    inConsultationCount: 2,
    checkedOutCount: 4,
    noShowCount: 1,
    avgWaitMinutes: 12.5,
    longestWaitMinutes: 22.0,
    blockers: [
      {
        patientName: "Andile Sithole",
        reason: "Waiting for lab results from Lancet — 35 minutes",
        minutesBlocked: 35,
      },
    ],
  };
}

/** Demo day forecast */
export function getDemoForecast(): DayForecast {
  const today = new Date().toISOString().split("T")[0];
  return {
    practiceId: PRACTICE_ID,
    forecastDate: today,
    totalBookings: 10,
    predictedNoShows: 2,
    predictedAttendance: 8,
    highRiskCount: 3,
    waitlistMatches: 1,
    totalSlots: 16,
    utilizedSlots: 10,
    utilizationPct: 62.5,
    atRiskRevenue: 1800,
    recoverableRevenue: 600,
    avgWaitTimePredicted: 15,
    peakHour: "10:00",
    bottleneckRisk: "medium",
  };
}

/** Demo doctor patterns */
export function getDemoDoctorPatterns(): DoctorPattern[] {
  return [
    {
      doctorName: "Dr. Nkosi",
      serviceType: "general",
      patientType: "follow_up",
      avgDuration: 18.5,
      medianDuration: 16,
      p75Duration: 22,
      p95Duration: 35,
      stdDeviation: 7.2,
      sampleSize: 245,
      morningAvg: 16.2,
      afternoonAvg: 21.1,
      dayPatterns: {
        monday: 19.5,
        tuesday: 17.2,
        wednesday: 18.0,
        thursday: 18.8,
        friday: 20.5,
        saturday: 15.0,
      },
    },
    {
      doctorName: "Dr. van der Merwe",
      serviceType: "general",
      patientType: "follow_up",
      avgDuration: 22.1,
      medianDuration: 20,
      p75Duration: 28,
      p95Duration: 42,
      stdDeviation: 9.5,
      sampleSize: 189,
      morningAvg: 20.0,
      afternoonAvg: 24.5,
      dayPatterns: {
        monday: 23.0,
        tuesday: 21.5,
        wednesday: 22.0,
        thursday: 21.8,
        friday: 24.2,
      },
    },
  ];
}

export const DEMO_PRACTICE_ID = PRACTICE_ID;
