import { NextResponse } from "next/server";

/** Public route — returns demo login hint (email only, not password) */
export async function GET() {
  return NextResponse.json({
    demoEmail: process.env.DEMO_EMAIL ?? "demo@netcare.co.za",
    demoPassword: process.env.DEMO_PASSWORD_HINT ?? "flowbot2026",
    practiceName: "Netcare Primary 001 — Medicross Sandton",
  });
}
