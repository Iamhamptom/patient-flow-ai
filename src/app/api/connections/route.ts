import { NextResponse } from "next/server";

export async function GET() {
  const connections = [
    { id: "supabase", name: "Supabase (Database)", status: "connected", description: "Core data storage", powers: ["All data"], breaksWithout: "Everything" },
    { id: "whatsapp", name: "WhatsApp (Twilio)", status: process.env.TWILIO_ACCOUNT_SID ? "connected" : "disconnected", description: "Patient notifications", powers: ["Confirmations", "Reminders", "Engagement", "Broadcast"], breaksWithout: "Falls back to email" },
    { id: "email", name: "Email (Resend)", status: process.env.RESEND_API_KEY ? "connected" : "disconnected", description: "Transactional email", powers: ["Confirmations", "Follow-ups", "Branded HTML"], breaksWithout: "No email delivery" },
    { id: "google_calendar", name: "Google Calendar", status: "disconnected", description: "Bidirectional calendar sync", powers: ["Calendar sync"], breaksWithout: "Bookings only in-app" },
    { id: "heal", name: "HEAL System (A2D24)", status: "disconnected", description: "SA primary care PMS", powers: ["Booking import"], breaksWithout: "Manual entry" },
    { id: "healthbridge", name: "Healthbridge", status: process.env.HEALTHBRIDGE_API_KEY ? "connected" : "disconnected", description: "Medical aid eligibility", powers: ["Eligibility checks", "Benefit lookup"], breaksWithout: "Manual phone verification" },
    { id: "careon", name: "CareOn Bridge", status: "connected", description: "Hospital HL7/FHIR integration", powers: ["Discharge import", "Lab results", "Clinical advisories"], breaksWithout: "No hospital data" },
    { id: "microsoft365", name: "Microsoft 365", status: "disconnected", description: "Outlook, OneDrive, Teams", powers: ["Email inbox", "Document sync", "Teams alerts"], breaksWithout: "No MS integration" },
    { id: "gmail", name: "Gmail", status: "disconnected", description: "Gmail inbox with AI triage", powers: ["Email triage", "Patient matching"], breaksWithout: "No Gmail" },
    { id: "ai", name: "AI Models (Claude + Gemini)", status: process.env.ANTHROPIC_API_KEY ? "connected" : "disconnected", description: "Powers FlowBot agent", powers: ["Agent", "Predictions", "Scoring", "Engagement"], breaksWithout: "AI offline" },
  ];
  return NextResponse.json({ connections });
}
