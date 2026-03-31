import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, rateLimit, getClientIp } from "@/lib/auth/guard";
import { extractFeatures } from "@/lib/prediction/features";
import { scoreWithGemini } from "@/lib/prediction/no-show-scorer";
import {
  scoreWithStatisticalModel,
  loadWeights,
} from "@/lib/prediction/statistical-model";
import { supabaseAdmin, tables, hoTables } from "@/lib/supabase";
import { getDemoPredictions } from "@/lib/demo/seed";
import { logAudit } from "@/lib/utils/audit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const body = await req.json();
  const { bookingId, practiceId, useGemini = false } = body;

  if (!bookingId || !practiceId) {
    return NextResponse.json(
      { error: "bookingId and practiceId required" },
      { status: 400 }
    );
  }

  if (isDemoMode()) {
    const demo = getDemoPredictions().find((p) => p.bookingId === bookingId);
    return NextResponse.json(demo ?? getDemoPredictions()[0]);
  }

  // Fetch the booking
  const { data: booking, error } = await supabaseAdmin
    .from(hoTables.bookings)
    .select("*")
    .eq("id", bookingId)
    .eq("practiceId", practiceId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const features = await extractFeatures(booking, practiceId);

  let prediction;
  if (useGemini) {
    prediction = await scoreWithGemini(
      bookingId,
      practiceId,
      booking.patientId ?? null,
      booking.scheduledAt,
      features
    );
  } else {
    const weights = await loadWeights(practiceId);
    prediction = scoreWithStatisticalModel(
      bookingId,
      practiceId,
      booking.patientId ?? null,
      booking.scheduledAt,
      features,
      weights
    );
  }

  // Store prediction
  await supabaseAdmin.from(tables.predictions).upsert(
    {
      booking_id: prediction.bookingId,
      practice_id: prediction.practiceId,
      patient_id: prediction.patientId,
      scheduled_at: prediction.scheduledAt,
      risk_score: prediction.riskScore,
      risk_level: prediction.riskLevel,
      confidence: prediction.confidence,
      model_version: prediction.modelVersion,
      features: prediction.features,
      explanation: prediction.explanation,
    },
    { onConflict: "booking_id" }
  );

  await logAudit({
    practiceId,
    action: "prediction_created",
    resourceType: "prediction",
    resourceId: bookingId,
    details: { riskScore: prediction.riskScore, model: prediction.modelVersion },
    ipAddress: ip,
  });

  return NextResponse.json(prediction);
}

/** GET — retrieve existing predictions for a practice */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const practiceId = searchParams.get("practiceId");
  const date = searchParams.get("date");

  if (!practiceId) {
    return NextResponse.json(
      { error: "practiceId required" },
      { status: 400 }
    );
  }

  if (isDemoMode()) {
    return NextResponse.json({ predictions: getDemoPredictions() });
  }

  let query = supabaseAdmin
    .from(tables.predictions)
    .select("*")
    .eq("practice_id", practiceId)
    .order("risk_score", { ascending: false });

  if (date) {
    query = query
      .gte("scheduled_at", `${date}T00:00:00`)
      .lte("scheduled_at", `${date}T23:59:59`);
  }

  const { data, error } = await query.limit(100);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ predictions: data });
}
