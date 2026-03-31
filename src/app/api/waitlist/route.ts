import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, rateLimit, getClientIp } from "@/lib/auth/guard";
import { supabaseAdmin, tables } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const practiceId = searchParams.get("practiceId");

  if (!practiceId) {
    return NextResponse.json(
      { error: "practiceId required" },
      { status: 400 }
    );
  }

  if (isDemoMode()) {
    return NextResponse.json({
      waitlist: [
        {
          id: "wl-001",
          practiceId,
          patientName: "Mpho Radebe",
          patientPhone: "+27821234099",
          preferredService: "General Consultation",
          preferredDates: [new Date().toISOString().split("T")[0]],
          preferredTimes: ["morning"],
          urgency: "semi-urgent",
          status: "waiting",
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }

  const { data, error } = await supabaseAdmin
    .from(tables.waitlist)
    .select("*")
    .eq("practice_id", practiceId)
    .in("status", ["waiting", "offered"])
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ waitlist: data });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  if (isDemoMode()) {
    return NextResponse.json({ success: true, id: "wl-demo-001" });
  }

  const body = await req.json();
  const {
    practiceId,
    patientName,
    patientPhone,
    patientEmail,
    preferredService,
    preferredDates,
    preferredTimes,
    urgency,
    notes,
  } = body;

  if (!practiceId || !patientName || !patientPhone || !preferredService) {
    return NextResponse.json(
      { error: "practiceId, patientName, patientPhone, preferredService required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from(tables.waitlist)
    .insert({
      practice_id: practiceId,
      patient_name: patientName,
      patient_phone: patientPhone,
      patient_email: patientEmail ?? null,
      preferred_service: preferredService,
      preferred_dates: preferredDates ?? null,
      preferred_times: preferredTimes ?? null,
      urgency: urgency ?? "routine",
      notes: notes ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
