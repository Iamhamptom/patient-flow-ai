import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, hoTables } from "@/lib/supabase";
import { validateTwilioSignature } from "@/lib/twilio";
import { flowAgent } from "@/lib/ai/agent";

/**
 * POST /api/whatsapp/incoming — Twilio webhook for inbound WhatsApp messages.
 * Processes patient messages through FlowBot agent and responds.
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = value.toString();
  });

  const from = params.From?.replace("whatsapp:", "") ?? "";
  const body = params.Body ?? "";
  const profileName = params.ProfileName ?? "Patient";

  if (!from || !body) {
    return new Response("<Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Find patient by phone
  const { data: patients } = await supabaseAdmin
    .from(hoTables.patients)
    .select("id, name, medical_aid, practice_id")
    .eq("phone", from)
    .limit(1);

  const patient = patients?.[0];
  const practiceId = patient?.practice_id ?? "netcare-primary-001";
  const patientName = patient?.name ?? profileName;

  // Store inbound message
  await supabaseAdmin.from(hoTables.notifications).insert({
    type: "whatsapp",
    recipient: from,
    patient_name: patientName,
    subject: "Inbound WhatsApp",
    message: body,
    status: "received",
    template: "inbound",
    practice_id: practiceId,
    sent_at: new Date().toISOString(),
  });

  // Process through FlowBot
  try {
    const result = await flowAgent.generate({
      prompt: `A patient named ${patientName} (phone: ${from}, practice: ${practiceId}) sent this WhatsApp message:\n\n"${body}"\n\nRespond helpfully. If they want to book, create a booking. If it's an emergency (chest pain, can't breathe, severe bleeding), tell them to call 082 911 immediately. Keep your response under 300 words — this is WhatsApp.`,
    });

    const reply = result.text.slice(0, 1500);

    return new Response(
      `<Response><Message>${escapeXml(reply)}</Message></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  } catch {
    return new Response(
      `<Response><Message>Thank you for your message. A staff member will get back to you shortly.</Message></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
