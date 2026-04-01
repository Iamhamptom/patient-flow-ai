/**
 * Engagement Sequence Engine — Automated Patient Journeys
 * Adapted from Netcare Health OS for Supabase (no Prisma).
 */
import { supabaseAdmin, hoTables } from "@/lib/supabase";
import { sendWithFallback } from "@/lib/twilio";
import { sendEmail } from "@/lib/resend";

const SEQ_TABLE = "pf_engagement_sequences";
const STEPS_TABLE = "pf_sequence_steps";
const ENROLL_TABLE = "pf_sequence_enrollments";

export interface SequenceStepResult {
  enrollmentId: string;
  stepOrder: number;
  channel: string;
  status: "sent" | "skipped" | "escalated" | "error";
  error?: string;
}

export function resolveTemplate(
  template: string,
  ctx: Record<string, string | undefined>
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => ctx[key] ?? `{{${key}}}`
  );
}

export function evaluateCondition(
  condition: string,
  context: Record<string, unknown>
): boolean {
  if (!condition?.trim()) return true;
  const c = condition.trim();

  const eqMatch = c.match(/^(\w+)\s*==\s*'([^']+)'$/);
  if (eqMatch) return String(context[eqMatch[1]] ?? "").toUpperCase() === eqMatch[2].toUpperCase();

  const neqMatch = c.match(/^(\w+)\s*!=\s*'([^']+)'$/);
  if (neqMatch) return String(context[neqMatch[1]] ?? "").toUpperCase() !== neqMatch[2].toUpperCase();

  const gtMatch = c.match(/^(\w+)\s*>\s*(\d+)$/);
  if (gtMatch) return Number(context[gtMatch[1]] ?? 0) > Number(gtMatch[2]);

  const ltMatch = c.match(/^(\w+)\s*<\s*(\d+)$/);
  if (ltMatch) return Number(context[ltMatch[1]] ?? 0) < Number(ltMatch[2]);

  return true;
}

/** Enroll a patient in a sequence */
export async function enrollPatient(
  sequenceId: string,
  patientId: string | null,
  patientName: string,
  patientPhone: string,
  practiceId: string
) {
  // Check not already enrolled
  const { data: existing } = await supabaseAdmin
    .from(ENROLL_TABLE)
    .select("id")
    .eq("sequence_id", sequenceId)
    .eq("patient_phone", patientPhone)
    .eq("status", "active")
    .limit(1);

  if (existing?.length) return { error: "Patient already enrolled in this sequence" };

  // Get first step delay
  const { data: steps } = await supabaseAdmin
    .from(STEPS_TABLE)
    .select("delay_hours")
    .eq("sequence_id", sequenceId)
    .eq("step_order", 1)
    .single();

  const delayHours = steps?.delay_hours ?? 0;
  const nextStepAt = new Date(Date.now() + delayHours * 3600_000).toISOString();

  const { data, error } = await supabaseAdmin
    .from(ENROLL_TABLE)
    .insert({
      sequence_id: sequenceId,
      patient_id: patientId,
      patient_name: patientName,
      patient_phone: patientPhone,
      practice_id: practiceId,
      current_step: 0,
      status: "active",
      next_step_at: nextStepAt,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Increment enrolled count
  const { data: seq } = await supabaseAdmin
    .from(SEQ_TABLE)
    .select("enrolled_count")
    .eq("id", sequenceId)
    .single();
  if (seq) {
    await supabaseAdmin
      .from(SEQ_TABLE)
      .update({ enrolled_count: (seq.enrolled_count ?? 0) + 1 })
      .eq("id", sequenceId);
  }

  return { success: true, enrollmentId: data.id, nextStepAt };
}

/** Process all due sequence steps (called by cron) */
export async function processDueSteps(): Promise<SequenceStepResult[]> {
  const { data: due } = await supabaseAdmin
    .from(ENROLL_TABLE)
    .select("*, sequence:pf_engagement_sequences(*)")
    .eq("status", "active")
    .lte("next_step_at", new Date().toISOString())
    .limit(50);

  if (!due?.length) return [];

  const results: SequenceStepResult[] = [];

  for (const enrollment of due) {
    const nextStepOrder = enrollment.current_step + 1;

    const { data: step } = await supabaseAdmin
      .from(STEPS_TABLE)
      .select("*")
      .eq("sequence_id", enrollment.sequence_id)
      .eq("step_order", nextStepOrder)
      .single();

    if (!step) {
      // No more steps — mark completed
      await supabaseAdmin
        .from(ENROLL_TABLE)
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", enrollment.id);
      continue;
    }

    // Check condition
    if (step.condition && !evaluateCondition(step.condition, { response: enrollment.last_response })) {
      results.push({ enrollmentId: enrollment.id, stepOrder: nextStepOrder, channel: step.channel, status: "skipped" });
      // Skip to next step
      const nextDelay = step.delay_hours ?? 24;
      await supabaseAdmin
        .from(ENROLL_TABLE)
        .update({
          current_step: nextStepOrder,
          next_step_at: new Date(Date.now() + nextDelay * 3600_000).toISOString(),
        })
        .eq("id", enrollment.id);
      continue;
    }

    // Resolve template
    const message = resolveTemplate(step.template, {
      patientName: enrollment.patient_name,
      patientPhone: enrollment.patient_phone,
    });

    // Send via channel
    try {
      if (step.channel === "email") {
        await sendEmail({ to: enrollment.patient_phone, subject: "Health Update", html: `<p>${message}</p>` });
      } else {
        await sendWithFallback(enrollment.patient_phone, message);
      }

      // Log notification
      await supabaseAdmin.from(hoTables.notifications).insert({
        type: step.channel,
        recipient: enrollment.patient_phone,
        patient_name: enrollment.patient_name,
        subject: `Sequence: ${enrollment.sequence?.name ?? ""}`,
        message,
        status: "sent",
        template: "sequence",
        practice_id: enrollment.practice_id,
        sent_at: new Date().toISOString(),
      });

      // Advance to next step
      const { data: nextStep } = await supabaseAdmin
        .from(STEPS_TABLE)
        .select("delay_hours")
        .eq("sequence_id", enrollment.sequence_id)
        .eq("step_order", nextStepOrder + 1)
        .single();

      const nextDelay = nextStep?.delay_hours ?? 24;
      await supabaseAdmin
        .from(ENROLL_TABLE)
        .update({
          current_step: nextStepOrder,
          next_step_at: new Date(Date.now() + nextDelay * 3600_000).toISOString(),
        })
        .eq("id", enrollment.id);

      results.push({ enrollmentId: enrollment.id, stepOrder: nextStepOrder, channel: step.channel, status: "sent" });
    } catch (err) {
      results.push({
        enrollmentId: enrollment.id,
        stepOrder: nextStepOrder,
        channel: step.channel,
        status: "error",
        error: err instanceof Error ? err.message : "Send failed",
      });
    }
  }

  return results;
}

/** Handle patient response to a sequence message */
export async function handlePatientResponse(phone: string, response: string) {
  const { data: enrollment } = await supabaseAdmin
    .from(ENROLL_TABLE)
    .select("id, sequence_id, current_step")
    .eq("patient_phone", phone)
    .eq("status", "active")
    .order("enrolled_at", { ascending: false })
    .limit(1)
    .single();

  if (!enrollment) return null;

  await supabaseAdmin
    .from(ENROLL_TABLE)
    .update({ last_response: response })
    .eq("id", enrollment.id);

  return { enrollmentId: enrollment.id, sequenceId: enrollment.sequence_id };
}
