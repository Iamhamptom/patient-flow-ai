import { NextRequest, NextResponse } from "next/server";

const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "demo@netcare.co.za";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@visiocorp.co";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password required" },
      { status: 400 }
    );
  }

  // Match against demo users
  let session = null;

  if (email === DEMO_EMAIL && password === DEMO_PASSWORD && DEMO_PASSWORD) {
    session = {
      email,
      name: "Dr. Nkosi (Demo)",
      practiceId: "netcare-primary-001",
      practiceName: "Netcare Primary 001 — Medicross Sandton",
      role: "practice_admin",
    };
  } else if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD && ADMIN_PASSWORD) {
    session = {
      email,
      name: "David Hampton",
      practiceId: "netcare-primary-001",
      practiceName: "VisioCorp — All Practices",
      role: "platform_admin",
    };
  }

  if (!session) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const sessionData = { ...session, loginAt: new Date().toISOString() };
  const response = NextResponse.json({ success: true, user: sessionData });

  response.cookies.set("pf_session", JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });

  return response;
}
