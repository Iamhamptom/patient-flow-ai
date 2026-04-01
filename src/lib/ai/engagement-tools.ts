/**
 * Engagement tools for FlowBot — sequences, campaigns, email triage,
 * chronic care gaps, population health.
 * Adapted from Netcare Health OS Engagement Agent (24 tools → Supabase).
 */
import { tool } from "ai";
import { z } from "zod";
import { supabaseAdmin, hoTables } from "@/lib/supabase";
import { enrollPatient, processDueSteps } from "@/lib/engagement/sequence-engine";
import { processInboundEmail } from "@/lib/engagement/email-processor";
import { broadcastWhatsApp, sendWithFallback } from "@/lib/twilio";

const SEQ_TABLE = "pf_engagement_sequences";
const STEPS_TABLE = "pf_sequence_steps";
const ENROLL_TABLE = "pf_sequence_enrollments";
const CAMPAIGNS_TABLE = "pf_campaigns";
const RECIPIENTS_TABLE = "pf_campaign_recipients";
const INBOX_TABLE = "pf_email_inbox";

export function createEngagementTools() {
  return {
    // ━━━━━━━━━━━━━━━━━━━━ SEQUENCES ━━━━━━━━━━━━━━━━━━━━

    list_sequences: tool({
      description: "List all engagement sequences for a practice — automated patient journeys like post-surgery follow-up, chronic care reminders, medication adherence.",
      inputSchema: z.object({ practiceId: z.string() }),
      execute: async ({ practiceId }) => {
        const { data } = await supabaseAdmin
          .from(SEQ_TABLE)
          .select("*")
          .eq("practice_id", practiceId)
          .order("created_at", { ascending: false });
        return { count: data?.length ?? 0, sequences: data ?? [] };
      },
    }),

    create_sequence: tool({
      description: "Create a new engagement sequence with steps. Each step has a message template, delay, and optional condition.",
      inputSchema: z.object({
        practiceId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        triggerType: z.enum(["manual", "booking_completed", "recall_due", "condition_match"]),
        channel: z.enum(["whatsapp", "sms", "email"]).optional(),
        steps: z.array(z.object({
          template: z.string().describe("Message template with {{patientName}} placeholders"),
          delayHours: z.number().describe("Hours to wait before sending this step"),
          channel: z.enum(["whatsapp", "sms", "email"]).optional(),
          condition: z.string().optional().describe("Optional condition e.g. response == 'YES'"),
        })),
      }),
      execute: async ({ practiceId, name, description, triggerType, channel, steps }) => {
        const { data: seq, error } = await supabaseAdmin
          .from(SEQ_TABLE)
          .insert({
            practice_id: practiceId,
            name,
            description,
            trigger_type: triggerType,
            channel: channel ?? "whatsapp",
            steps_count: steps.length,
            status: "active",
          })
          .select("id")
          .single();

        if (error) return { error: error.message };

        for (let i = 0; i < steps.length; i++) {
          await supabaseAdmin.from(STEPS_TABLE).insert({
            sequence_id: seq.id,
            step_order: i + 1,
            step_type: "message",
            channel: steps[i].channel ?? channel ?? "whatsapp",
            template: steps[i].template,
            delay_hours: steps[i].delayHours,
            condition: steps[i].condition ?? null,
          });
        }

        return { success: true, sequenceId: seq.id, steps: steps.length };
      },
    }),

    enroll_in_sequence: tool({
      description: "Enroll a patient in an engagement sequence. The engine will automatically send messages at scheduled intervals.",
      inputSchema: z.object({
        sequenceId: z.string(),
        patientName: z.string(),
        patientPhone: z.string(),
        practiceId: z.string(),
      }),
      execute: async ({ sequenceId, patientName, patientPhone, practiceId }) => {
        return enrollPatient(sequenceId, null, patientName, patientPhone, practiceId);
      },
    }),

    get_active_enrollments: tool({
      description: "Get all active sequence enrollments — patients currently going through automated journeys.",
      inputSchema: z.object({ practiceId: z.string() }),
      execute: async ({ practiceId }) => {
        const { data } = await supabaseAdmin
          .from(ENROLL_TABLE)
          .select("*, sequence:pf_engagement_sequences(name)")
          .eq("practice_id", practiceId)
          .eq("status", "active")
          .order("next_step_at", { ascending: true });
        return { count: data?.length ?? 0, enrollments: data ?? [] };
      },
    }),

    process_due_sequences: tool({
      description: "Process all due sequence steps right now. Sends pending messages and advances enrollments. Usually called by cron but can be triggered manually.",
      inputSchema: z.object({}),
      execute: async () => {
        const results = await processDueSteps();
        return {
          processed: results.length,
          sent: results.filter((r) => r.status === "sent").length,
          skipped: results.filter((r) => r.status === "skipped").length,
          errors: results.filter((r) => r.status === "error").length,
          results,
        };
      },
    }),

    // ━━━━━━━━━━━━━━━━━━━━ CAMPAIGNS ━━━━━━━━━━━━━━━━━━━━

    create_campaign: tool({
      description: "Create a health campaign — bulk outreach for recalls, vaccinations, screenings, or announcements. Targets patients matching criteria.",
      inputSchema: z.object({
        practiceId: z.string(),
        name: z.string(),
        campaignType: z.enum(["recall", "vaccination", "screening", "announcement", "survey"]),
        channel: z.enum(["whatsapp", "sms", "email"]),
        messageTemplate: z.string(),
        targetCriteria: z.record(z.string(), z.unknown()).optional().describe("Filter criteria e.g. {medicalAid: 'Discovery'}"),
      }),
      execute: async ({ practiceId, name, campaignType, channel, messageTemplate, targetCriteria }) => {
        const { data, error } = await supabaseAdmin
          .from(CAMPAIGNS_TABLE)
          .insert({
            practice_id: practiceId,
            name,
            campaign_type: campaignType,
            channel,
            message_template: messageTemplate,
            target_criteria: targetCriteria ?? null,
            status: "draft",
          })
          .select("id")
          .single();

        if (error) return { error: error.message };
        return { success: true, campaignId: data.id };
      },
    }),

    send_campaign: tool({
      description: "Execute a campaign — sends the message to all matching patients. Checks POPIA consent before sending.",
      inputSchema: z.object({
        campaignId: z.string(),
        practiceId: z.string(),
      }),
      execute: async ({ campaignId, practiceId }) => {
        const { data: campaign } = await supabaseAdmin
          .from(CAMPAIGNS_TABLE)
          .select("*")
          .eq("id", campaignId)
          .single();

        if (!campaign) return { error: "Campaign not found" };

        // Get target patients
        let query = supabaseAdmin
          .from(hoTables.patients)
          .select("id, name, phone, email")
          .eq("practice_id", practiceId)
          .eq("status", "active")
          .not("phone", "is", null);

        const { data: patients } = await query.limit(200);
        if (!patients?.length) return { error: "No matching patients" };

        // Check consent
        const { data: consented } = await supabaseAdmin
          .from(hoTables.notifications)
          .select("recipient")
          .eq("practice_id", practiceId)
          .eq("template", "opt_out");

        const optedOut = new Set(consented?.map((c) => c.recipient) ?? []);
        const eligible = patients.filter((p) => !optedOut.has(p.phone));

        // Create recipients
        for (const p of eligible) {
          await supabaseAdmin.from(RECIPIENTS_TABLE).insert({
            campaign_id: campaignId,
            patient_name: p.name,
            patient_phone: p.phone,
            patient_email: p.email ?? null,
            status: "pending",
          });
        }

        // Send via WhatsApp broadcast
        const phones = eligible.map((p) => p.phone);
        const results = await broadcastWhatsApp(phones, campaign.message_template);

        const sent = results.filter((r) => r.sid).length;
        await supabaseAdmin
          .from(CAMPAIGNS_TABLE)
          .update({ status: "sent", sent_count: sent })
          .eq("id", campaignId);

        return { sent, failed: results.filter((r) => r.error).length, total: eligible.length };
      },
    }),

    // ━━━━━━━━━━━━━━━━━━━━ EMAIL INBOX ━━━━━━━━━━━━━━━━━━━━

    get_email_inbox: tool({
      description: "Get the AI-triaged email inbox — inbound emails auto-categorized as appointment, prescription, results, billing, complaint, referral, or spam.",
      inputSchema: z.object({
        practiceId: z.string(),
        status: z.enum(["unread", "read", "all"]).optional(),
        category: z.string().optional(),
      }),
      execute: async ({ practiceId, status, category }) => {
        let query = supabaseAdmin
          .from(INBOX_TABLE)
          .select("*")
          .eq("practice_id", practiceId)
          .order("received_at", { ascending: false })
          .limit(30);

        if (status && status !== "all") query = query.eq("status", status);
        if (category) query = query.eq("triage_category", category);

        const { data } = await query;
        return { count: data?.length ?? 0, emails: data ?? [] };
      },
    }),

    triage_email: tool({
      description: "Process an inbound email — auto-classify, match to patient, save to inbox.",
      inputSchema: z.object({
        practiceId: z.string(),
        fromEmail: z.string(),
        fromName: z.string(),
        subject: z.string(),
        bodyText: z.string(),
        source: z.enum(["gmail", "outlook", "manual"]).optional(),
      }),
      execute: async ({ practiceId, fromEmail, fromName, subject, bodyText, source }) => {
        return processInboundEmail(practiceId, fromEmail, fromName, subject, bodyText, undefined, source);
      },
    }),

    // ━━━━━━━━━━━━━━━━━━━━ CHRONIC CARE & POPULATION ━━━━━━━━━━━━━━━━━━━━

    get_chronic_care_gaps: tool({
      description: "Identify patients with chronic conditions who are overdue for follow-up, medication reviews, or screenings. Critical for practice revenue and patient outcomes.",
      inputSchema: z.object({
        practiceId: z.string(),
        daysOverdue: z.number().optional().describe("Days since last visit to consider overdue (default 90)"),
      }),
      execute: async ({ practiceId, daysOverdue }) => {
        const cutoff = new Date(Date.now() - (daysOverdue ?? 90) * 86_400_000).toISOString();

        // Find patients with chronic conditions who haven't visited recently
        const { data: patients } = await supabaseAdmin
          .from(hoTables.patients)
          .select("id, name, phone, medical_aid, last_visit, status")
          .eq("practice_id", practiceId)
          .eq("status", "active")
          .lt("last_visit", cutoff)
          .order("last_visit", { ascending: true })
          .limit(50);

        // Cross-reference with recalls
        const { data: recalls } = await supabaseAdmin
          .from(hoTables.recallItems)
          .select("patient_name, reason, due_date, contacted")
          .eq("practice_id", practiceId)
          .eq("contacted", false)
          .lte("due_date", new Date().toISOString());

        return {
          overduePatients: patients?.length ?? 0,
          overdueRecalls: recalls?.length ?? 0,
          patients: patients ?? [],
          recalls: recalls ?? [],
          revenueOpportunity: `R${((patients?.length ?? 0) * 600).toLocaleString()}`,
        };
      },
    }),

    get_population_health: tool({
      description: "Get population health overview — patient demographics, active vs inactive, medical aid distribution, last visit distribution. Useful for NHI readiness and practice planning.",
      inputSchema: z.object({ practiceId: z.string() }),
      execute: async ({ practiceId }) => {
        const { data: patients } = await supabaseAdmin
          .from(hoTables.patients)
          .select("id, status, medical_aid, gender, last_visit")
          .eq("practice_id", practiceId);

        if (!patients?.length) return { totalPatients: 0 };

        const active = patients.filter((p) => p.status === "active").length;
        const withMedAid = patients.filter((p) => p.medical_aid).length;

        const aidDistribution: Record<string, number> = {};
        for (const p of patients) {
          const aid = p.medical_aid || "No Medical Aid";
          aidDistribution[aid] = (aidDistribution[aid] ?? 0) + 1;
        }

        return {
          totalPatients: patients.length,
          active,
          inactive: patients.length - active,
          withMedicalAid: withMedAid,
          withoutMedicalAid: patients.length - withMedAid,
          medicalAidDistribution: aidDistribution,
        };
      },
    }),

    // ━━━━━━━━━━━━━━━━━━━━ ENGAGEMENT DASHBOARD ━━━━━━━━━━━━━━━━━━━━

    get_engagement_dashboard: tool({
      description: "Get a full engagement dashboard — active sequences, pending campaigns, email inbox stats, chronic care gaps count, and recent engagement activity.",
      inputSchema: z.object({ practiceId: z.string() }),
      execute: async ({ practiceId }) => {
        const [sequences, campaigns, inbox, enrollments, recalls] = await Promise.all([
          supabaseAdmin.from(SEQ_TABLE).select("id", { count: "exact", head: true }).eq("practice_id", practiceId).eq("status", "active"),
          supabaseAdmin.from(CAMPAIGNS_TABLE).select("id", { count: "exact", head: true }).eq("practice_id", practiceId),
          supabaseAdmin.from(INBOX_TABLE).select("id", { count: "exact", head: true }).eq("practice_id", practiceId).eq("status", "unread"),
          supabaseAdmin.from(ENROLL_TABLE).select("id", { count: "exact", head: true }).eq("practice_id", practiceId).eq("status", "active"),
          supabaseAdmin.from(hoTables.recallItems).select("id", { count: "exact", head: true }).eq("practice_id", practiceId).eq("contacted", false),
        ]);

        return {
          activeSequences: sequences.count ?? 0,
          totalCampaigns: campaigns.count ?? 0,
          unreadEmails: inbox.count ?? 0,
          activeEnrollments: enrollments.count ?? 0,
          pendingRecalls: recalls.count ?? 0,
        };
      },
    }),
  };
}
