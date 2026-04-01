import { ToolLoopAgent, tool, stepCountIs } from "ai";
import { z } from "zod";
import { supabaseAdmin, tables, hoTables } from "@/lib/supabase";
import { extractFeatures, getBookingsForDate } from "@/lib/prediction/features";
import { scoreWithGemini } from "@/lib/prediction/no-show-scorer";
import {
  scoreWithStatisticalModel,
  loadWeights,
} from "@/lib/prediction/statistical-model";
import { getFlowBoardState } from "@/lib/flow/board-state";
import { generateDayForecast } from "@/lib/flow/capacity-forecast";
import { analyzeDoctorPatterns } from "@/lib/schedule/pattern-analyzer";
import { WORKSPACE_ID } from "@/lib/constants";
import { createOpsTools } from "./ops-tools";
import { createEngagementTools } from "./engagement-tools";
import { createFrontDeskTools } from "./frontdesk-tools";
import { createAnalyticsTools } from "./analytics-tools";
import { createClinicalTools } from "./clinical-tools";

/**
 * Patient Flow AI Agent — "FlowBot"
 *
 * Autonomous agent that can:
 * - Score bookings for no-show risk
 * - Generate capacity forecasts
 * - Manage waitlists
 * - Read real-time patient flow board
 * - Analyze doctor patterns
 * - Send smart reminders
 * - Report to Health OS agents via agent_comms
 *
 * Uses Claude Sonnet 4.6 for reasoning over patient flow data.
 */
export const flowAgent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.6",
  instructions: `You are FlowBot — the AI operations agent powering Patient Flow AI, a unified patient engagement and scheduling intelligence platform built for South African healthcare practices.

## WHO YOU ARE

You are the daily operations hub for practice managers, receptionists, and clinic administrators. Staff open you every morning for their briefing and use you throughout the day to manage the entire practice workflow. You have 45 tools that give you full control over scheduling, patient communications, engagement automation, clinical data, and inter-agent coordination.

You are built on Vercel AI SDK 6 (ToolLoopAgent) with Claude Sonnet 4.6 for reasoning. You run inside Patient Flow AI — a standalone Next.js 16 product deployed at patient-flow-ai.vercel.app. The platform has 27 API routes, 13 dashboard pages, 19 database tables, and 7 cron jobs.

## THE PLATFORM YOU POWER

Patient Flow AI is the unified product that merges scheduling intelligence with patient engagement. It was built for VisioCorp Health Division and is designed for the Netcare pilot (Sara Nayager, MD Primary Care Division).

### Architecture
- **Frontend**: Next.js 16.2.1, React 19, Tailwind 4, shadcn/ui (pure black/white monochrome theme)
- **Database**: Supabase (shared project xquzbgaenmohruluyhgv) — 19 pf_ tables + reads from 20 ho_ tables
- **Communications**: Twilio (WhatsApp send/broadcast, SMS, fallback) + Resend (branded HTML email)
- **Prediction Engine**: Dual-model — Gemini 3 Flash for individual scoring (~$0.002/prediction), TypeScript logistic regression for batch (zero cost)
- **Self-Learning**: Records actual outcomes → weekly retrain → adjusts model weights via feature correlation. 90% accuracy on first retrain.
- **Agent Network**: Connected to Steinberg (chairman agent in Visio Workspace) via agent_comms table + HTTP gateway. Polls for tasks every 10 minutes.

### Database Tables You Work With
**Your tables (pf_ prefix):** predictions, model_weights, model_accuracy, forecasts, waitlist, flow_snapshots, audit_log, reminders, practice_config, doctor_patterns, schedules, engagement_sequences, sequence_steps, sequence_enrollments, campaigns, campaign_recipients, email_inbox, document_sync, patient_auth

**HealthOps tables you read/write (ho_ prefix):** bookings, patients, check_ins, notifications, users, vitals, medical_records, conversations, messages, recall_items, referrals, daily_tasks, invoices, allergies, medications, bridge_messages, bridge_advisories, clinics, clinic_directory

## YOUR 45 TOOLS — ORGANIZED BY WORKFLOW

### 1. Morning Briefing (start of day)
- **morning_briefing** — Pull everything: today's bookings, predicted no-shows, overdue recalls, pending referrals, daily tasks, CareOn alerts. One tool, complete picture.
- **batch_score_day** — Score all today's bookings for no-show risk
- **generate_forecast** — Capacity forecast with revenue impact
- **get_daily_tasks** — Morning/during-day/end-of-day checklists

### 2. Scheduling & Bookings
- **create_booking** — New appointment (patient name, phone, service, time, source)
- **update_booking** — Confirm, cancel, complete, or mark no-show
- **search_bookings** — Find by patient name, phone, date, or status
- **get_bookings** — List all bookings for a specific date
- **score_booking** — Score individual booking (Gemini AI or statistical model)

### 3. Patient Flow (real-time)
- **get_flow_board** — Live Kanban: waiting, in consultation, done, no-show + blockers
- **check_in_patient** — Patient arrives → create waiting record
- **update_check_in** — Move: waiting → in consultation → checked out
- **get_doctor_patterns** — Avg/median/P75/P95 consultation duration per doctor

### 4. Patient Management
- **lookup_patient** — Full profile: demographics, medical aid, allergies, medications
- **get_patient_history** — Booking history + no-show rate calculation

### 5. Communications (REAL — not simulated)
- **send_whatsapp** — Send via Twilio to real phone numbers
- **send_sms** — SMS via Twilio
- **send_message_with_fallback** — Try WhatsApp first, fall back to SMS
- **broadcast_whatsapp** — Bulk send to up to 50 patients
- **send_email** — HTML email via Resend with practice branding
- **get_notification_history** — What was already sent to a patient

### 6. Patient Engagement (automated journeys)
- **list_sequences** — All automated patient journeys
- **create_sequence** — Build multi-step sequences (e.g., post-surgery: Day 1 check-in → Day 3 pain check → Day 7 review)
- **enroll_in_sequence** — Add patient to a sequence (messages auto-send on schedule)
- **get_active_enrollments** — Who's currently in a sequence
- **process_due_sequences** — Execute pending sequence steps now

### 7. Campaigns (bulk outreach)
- **create_campaign** — Build a health campaign (recall, vaccination, screening, announcement)
- **send_campaign** — Execute: targets matching patients, checks POPIA consent, sends via WhatsApp

### 8. Email Triage
- **get_email_inbox** — AI-categorized inbox (appointment, prescription, results, billing, complaint, referral, spam)
- **triage_email** — Process inbound email: classify + match to patient

### 9. Recalls & Referrals
- **get_recall_list** — Patients overdue for follow-up
- **mark_recall_contacted** — Track outreach
- **get_referrals** — GP referrals by status (pending/accepted/booked)
- **update_referral** — Update status + send feedback to referring doctor

### 10. Clinical Intelligence
- **get_bridge_messages** — CareOn hospital HL7 feeds (ADT admissions, ORU lab results, ORM orders)
- **get_bridge_advisories** — AI clinical alerts from hospital data
- **get_chronic_care_gaps** — Patients with chronic conditions overdue for care (revenue opportunity)
- **get_population_health** — Demographics, medical aid distribution, active vs inactive

### 11. Prediction & Self-Learning
- **get_predictions** — Stored prediction scores
- **generate_report** — Structured JSON risk report
- **get_engagement_dashboard** — All engagement KPIs in one call

### 12. Agent Network
- **send_agent_message** — Write to agent_comms table (Steinberg, OpenClaw, Chairman)
- **read_agent_messages** — Check for incoming tasks
- **call_steinberg** — HTTP call to Visio Workspace gateway for cross-business actions

### 13. Operations
- **complete_task** — Mark daily task as done
- **get_waitlist** / **add_to_waitlist** — Standby patients for cancelled slots

## SA HEALTHCARE CONTEXT

- **Currency**: ZAR (Rands). Average GP consultation: R600.
- **No-show economics**: 5 no-shows/day × R600 = R3,000/day = R792K/year per doctor.
- **Prediction features**: Historical no-show rate is strongest predictor. Deposit-paid patients almost always show. GP referral patients almost never no-show. Monday/Friday highest risk days. Public online bookings higher risk than phone/WhatsApp.
- **Medical aids**: Discovery, Bonitas, GEMS, Momentum, Medihelp, Bestmed. Patients with medical aid have lower no-show rates.
- **Compliance**: POPIA (data protection) — consent required before marketing. HPCSA — AI is decision support only, clinical responsibility stays with practitioner.
- **Hospital systems**: CareOn (Netcare hospitals, Deutsche Telekom iMedOne), HEAL (Netcare primary care, A2D24). Data comes via HL7v2 FHIR bridge.
- **Claims**: ICD-10 (WHO, not US ICD-10-CM), CCSA tariff codes (not CPT), 3 switching houses (Healthbridge, SwitchOn, MediKredit).

## HOW TO BEHAVE

1. **Start of day**: When someone says "morning briefing" or "what's happening today" — use the morning_briefing tool. Give them the complete picture in one response.

2. **Be proactive**: After completing any action, suggest the logical next step. Created a booking? Offer to score it for no-show risk. Found a high-risk patient? Offer to send a reminder. Found overdue recalls? Offer to start a campaign.

3. **Use data, not assumptions**: When asked a question, call the relevant tool first. Don't guess from memory — query the database. Lead with numbers, not opinions.

4. **Communication format**:
   - Use tables for structured data (bookings, predictions, recalls)
   - Use ZAR for all revenue figures
   - Flag CRITICAL items with warning emoji and bold text
   - Keep WhatsApp responses under 300 words
   - Dashboard responses can be longer and more detailed

5. **Patient communications**: When sending WhatsApp/SMS/email, always log to ho_notifications. When sending to multiple patients, use broadcast_whatsapp (max 50). Always check if a reminder was already sent before sending another.

6. **Agent network**: Report significant findings to Steinberg — daily summaries, critical blockers, revenue risks. Read messages from Steinberg for incoming tasks. When you can't handle something, escalate via call_steinberg.

7. **Self-learning awareness**: You know your prediction model was retrained with 90% accuracy. When predictions are wrong (false positives/negatives), acknowledge it and note the model will adjust on the next weekly retrain.

8. **Security**: Never expose patient data outside the practice context. All actions are logged to pf_audit_log. POPIA consent is checked before campaign sends.`,

  stopWhen: stepCountIs(15),

  tools: {
    score_booking: tool({
      description:
        "Score a single booking for no-show risk. Returns risk score (0-100), risk level, and explanation.",
      inputSchema: z.object({
        bookingId: z.string().describe("The booking ID from ho_bookings"),
        practiceId: z.string().describe("The practice ID"),
        useGemini: z
          .boolean()
          .optional()
          .describe("Use Gemini AI scorer (true) or statistical model (false, default)"),
      }),
      execute: async ({ bookingId, practiceId, useGemini }) => {
        const { data: booking } = await supabaseAdmin
          .from(hoTables.bookings)
          .select("*")
          .eq("id", bookingId)
          .eq("practice_id", practiceId)
          .single();

        if (!booking) return { error: "Booking not found" };

        const features = await extractFeatures(booking, practiceId);

        if (useGemini) {
          const pred = await scoreWithGemini(
            bookingId,
            practiceId,
            booking.patient_id ?? null,
            booking.scheduled_at,
            features
          );
          return pred;
        }

        const weights = await loadWeights(practiceId);
        return scoreWithStatisticalModel(
          bookingId,
          practiceId,
          booking.patient_id ?? null,
          booking.scheduled_at,
          features,
          weights
        );
      },
    }),

    batch_score_day: tool({
      description:
        "Score ALL bookings for a specific date. Returns summary with risk breakdown.",
      inputSchema: z.object({
        practiceId: z.string(),
        date: z
          .string()
          .describe("Date in YYYY-MM-DD format"),
      }),
      execute: async ({ practiceId, date }) => {
        const bookings = await getBookingsForDate(practiceId, date);
        const weights = await loadWeights(practiceId);

        const results = await Promise.all(
          bookings.map(async (b) => {
            const features = await extractFeatures(b, practiceId);
            return scoreWithStatisticalModel(
              b.id,
              practiceId,
              null,
              b.scheduled_at,
              features,
              weights
            );
          })
        );

        const low = results.filter((r) => r.riskLevel === "low").length;
        const medium = results.filter((r) => r.riskLevel === "medium").length;
        const high = results.filter((r) => r.riskLevel === "high").length;
        const critical = results.filter((r) => r.riskLevel === "critical").length;

        return {
          date,
          totalBookings: bookings.length,
          riskBreakdown: { low, medium, high, critical },
          highRiskBookings: results
            .filter((r) => r.riskScore >= 60)
            .map((r) => ({
              bookingId: r.bookingId,
              riskScore: r.riskScore,
              explanation: r.explanation,
            })),
          avgRiskScore:
            results.length > 0
              ? Math.round(
                  results.reduce((a, b) => a + b.riskScore, 0) / results.length
                )
              : 0,
        };
      },
    }),

    generate_forecast: tool({
      description:
        "Generate a full capacity forecast for a practice for today or a specific date.",
      inputSchema: z.object({
        practiceId: z.string(),
        date: z
          .string()
          .optional()
          .describe("Date in YYYY-MM-DD format. Defaults to today."),
      }),
      execute: async ({ practiceId, date }) => {
        const targetDate =
          date ?? new Date().toISOString().split("T")[0];
        return await generateDayForecast(practiceId, targetDate);
      },
    }),

    get_flow_board: tool({
      description:
        "Get real-time patient flow board — who's waiting, in consultation, done, and any blockers.",
      inputSchema: z.object({
        practiceId: z.string(),
      }),
      execute: async ({ practiceId }) => {
        return await getFlowBoardState(practiceId);
      },
    }),

    get_doctor_patterns: tool({
      description:
        "Analyze a doctor's consultation patterns — avg duration, peak times, day-of-week trends.",
      inputSchema: z.object({
        practiceId: z.string(),
        doctorName: z.string(),
      }),
      execute: async ({ practiceId, doctorName }) => {
        const patterns = await analyzeDoctorPatterns(practiceId, doctorName);
        return patterns.length > 0
          ? patterns[0]
          : { message: "No patterns found — insufficient history" };
      },
    }),

    get_waitlist: tool({
      description: "Get current waitlist entries for a practice.",
      inputSchema: z.object({
        practiceId: z.string(),
      }),
      execute: async ({ practiceId }) => {
        const { data } = await supabaseAdmin
          .from(tables.waitlist)
          .select("*")
          .eq("practice_id", practiceId)
          .in("status", ["waiting", "offered"])
          .order("created_at", { ascending: true });

        return { count: data?.length ?? 0, entries: data ?? [] };
      },
    }),

    add_to_waitlist: tool({
      description: "Add a patient to the waitlist for a practice.",
      inputSchema: z.object({
        practiceId: z.string(),
        patientName: z.string(),
        patientPhone: z.string(),
        preferredService: z.string(),
        urgency: z
          .enum(["routine", "semi-urgent", "urgent"])
          .optional(),
        notes: z.string().optional(),
      }),
      execute: async ({
        practiceId,
        patientName,
        patientPhone,
        preferredService,
        urgency,
        notes,
      }) => {
        const { data, error } = await supabaseAdmin
          .from(tables.waitlist)
          .insert({
            practice_id: practiceId,
            patient_name: patientName,
            patient_phone: patientPhone,
            preferred_service: preferredService,
            urgency: urgency ?? "routine",
            notes: notes ?? null,
          })
          .select("id")
          .single();

        if (error) return { error: error.message };
        return { success: true, id: data.id };
      },
    }),

    get_predictions: tool({
      description:
        "Get existing predictions for a practice, optionally filtered by date.",
      inputSchema: z.object({
        practiceId: z.string(),
        date: z.string().optional(),
        riskLevel: z
          .enum(["low", "medium", "high", "critical"])
          .optional(),
      }),
      execute: async ({ practiceId, date, riskLevel }) => {
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
        if (riskLevel) {
          query = query.eq("risk_level", riskLevel);
        }

        const { data } = await query.limit(50);
        return { count: data?.length ?? 0, predictions: data ?? [] };
      },
    }),

    get_bookings: tool({
      description:
        "Get bookings for a practice on a specific date with their statuses.",
      inputSchema: z.object({
        practiceId: z.string(),
        date: z.string().describe("YYYY-MM-DD"),
      }),
      execute: async ({ practiceId, date }) => {
        const bookings = await getBookingsForDate(practiceId, date);
        return {
          count: bookings.length,
          bookings: bookings.map((b) => ({
            id: b.id,
            patientName: b.patient_name,
            service: b.service,
            scheduledAt: b.scheduled_at,
            status: b.status,
            source: b.source,
            depositPaid: b.deposit_paid,
            reminderSent: !!b.reminder_sent_at,
          })),
        };
      },
    }),

    send_agent_message: tool({
      description:
        "Send a message to the Health OS agent network via agent_comms table. Use this to report insights, status updates, or escalations to Steinberg and other agents.",
      inputSchema: z.object({
        msgType: z
          .enum([
            "status_update",
            "data_report",
            "alert",
            "task_handoff",
            "sync_request",
            "directive",
            "ack",
          ])
          .describe("Type of inter-agent message"),
        subject: z.string().describe("Short subject line"),
        body: z.string().describe("Message body with details"),
        payload: z.record(z.string(), z.unknown()).optional().describe("Structured data payload (JSON)"),
        priority: z
          .enum(["low", "normal", "high", "critical"])
          .optional(),
        targetAgent: z
          .string()
          .optional()
          .describe("Target agent (steinberg, openclaw, chairman, all)"),
      }),
      execute: async ({ msgType, subject, body, payload, priority, targetAgent }) => {
        const { data, error } = await supabaseAdmin
          .from("agent_comms")
          .insert({
            workspace_id: WORKSPACE_ID,
            sender: "flowbot",
            recipient: targetAgent ?? "steinberg",
            msg_type: msgType,
            subject,
            body,
            payload: payload ?? null,
            priority: priority ?? "normal",
          })
          .select("id")
          .single();

        if (error) return { error: error.message };
        return { sent: true, messageId: data.id };
      },
    }),

    read_agent_messages: tool({
      description:
        "Read messages sent to FlowBot from other Health OS agents (Steinberg, OpenClaw, Chairman).",
      inputSchema: z.object({
        limit: z.number().optional().describe("Max messages to read (default 10)"),
        unreadOnly: z.boolean().optional(),
        fromSender: z.string().optional().describe("Filter by sender (steinberg, openclaw, chairman)"),
      }),
      execute: async ({ limit, unreadOnly, fromSender }) => {
        let query = supabaseAdmin
          .from("agent_comms")
          .select("*")
          .eq("recipient", "flowbot")
          .order("created_at", { ascending: false })
          .limit(limit ?? 10);

        if (unreadOnly) {
          query = query.is("read_at", null);
        }
        if (fromSender) {
          query = query.eq("sender", fromSender);
        }

        const { data } = await query;

        // Mark as read
        if (data?.length) {
          const ids = data.filter((m) => !m.read_at).map((m) => m.id);
          if (ids.length > 0) {
            await supabaseAdmin
              .from("agent_comms")
              .update({ read_at: new Date().toISOString() })
              .in("id", ids);
          }
        }

        return { count: data?.length ?? 0, messages: data ?? [] };
      },
    }),

    call_steinberg: tool({
      description:
        "Call Steinberg (the Chairman AI agent in Visio Workspace) to execute a command. Use this when you need data from the workspace, want to trigger actions across the business, or need to escalate something.",
      inputSchema: z.object({
        command: z.string().describe("The task for Steinberg to execute"),
      }),
      execute: async ({ command }) => {
        const GATEWAY_URL = process.env.WORKSPACE_URL ?? "https://visioworkspace-corpo1.vercel.app";
        const GATEWAY_KEY = process.env.VISIO_GATEWAY_KEY;
        if (!GATEWAY_KEY) return { error: "VISIO_GATEWAY_KEY not configured" };

        const res = await fetch(`${GATEWAY_URL}/api/gateway`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GATEWAY_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            command: `[FROM FLOWBOT - Patient Flow AI] ${command}`,
            agent: "steinberg",
            mode: "execute",
          }),
        });

        if (!res.ok) return { error: `Steinberg returned ${res.status}` };
        const data = await res.json();
        return {
          success: data.success,
          response: data.response,
          steps: data.steps,
          model: data.model_used,
        };
      },
    }),

    generate_report: tool({
      description:
        "Generate a structured patient flow report (JSON + markdown) that can be sent to other agents or stored. Use this to create daily summaries, risk reports, or optimization recommendations.",
      inputSchema: z.object({
        reportType: z
          .enum(["daily_summary", "risk_report", "optimization", "capacity_forecast"])
          .describe("Type of report to generate"),
        practiceId: z.string(),
        date: z.string().optional().describe("YYYY-MM-DD, defaults to today"),
      }),
      execute: async ({ reportType, practiceId, date }) => {
        const targetDate = date ?? new Date().toISOString().split("T")[0];

        // Gather all data
        const bookings = await getBookingsForDate(practiceId, targetDate);
        const weights = await loadWeights(practiceId);

        const predictions = await Promise.all(
          bookings.map(async (b) => {
            const features = await extractFeatures(b, practiceId);
            return scoreWithStatisticalModel(
              b.id, practiceId, null, b.scheduled_at, features, weights
            );
          })
        );

        let flowData = null;
        try {
          flowData = await getFlowBoardState(practiceId);
        } catch { /* no check-ins today */ }

        const high = predictions.filter((p) => p.riskScore >= 60);
        const avgRisk = predictions.length > 0
          ? Math.round(predictions.reduce((a, b) => a + b.riskScore, 0) / predictions.length)
          : 0;

        return {
          reportType,
          practiceId,
          date: targetDate,
          generatedAt: new Date().toISOString(),
          summary: {
            totalBookings: bookings.length,
            predictedNoShows: predictions.filter((p) => p.riskScore >= 50).length,
            highRiskCount: high.length,
            avgRiskScore: avgRisk,
            atRiskRevenue: high.length * 600,
          },
          flow: flowData,
          highRiskBookings: high.map((p) => ({
            bookingId: p.bookingId,
            riskScore: p.riskScore,
            riskLevel: p.riskLevel,
            explanation: p.explanation,
          })),
          predictions: predictions.map((p) => ({
            bookingId: p.bookingId,
            riskScore: p.riskScore,
            riskLevel: p.riskLevel,
          })),
        };
      },
    }),

    // ━━━━━━━━━━━━━━━━━━━━ OPERATIONAL TOOLS ━━━━━━━━━━━━━━━━━━━━
    // Booking management, patient lookup, comms, recalls, referrals,
    // daily tasks, CareOn bridge, check-in management, morning briefing
    ...createOpsTools(),

    // ━━━━━━━━━━━━━━━━━━━━ ENGAGEMENT TOOLS ━━━━━━━━━━━━━━━━━━━━
    // Sequences, campaigns, email triage, chronic care gaps,
    // population health, engagement dashboard
    ...createEngagementTools(),

    // ━━━━━━━━━━━━━━━━━━━━ FRONT DESK TOOLS ━━━━━━━━━━━━━━━━━━━━
    // Medical aid verification, calendar slots, bulk check-in import,
    // integration status, patient registration
    ...createFrontDeskTools(),

    // ━━━━━━━━━━━━━━━━━━━━ ANALYTICS & FEEDBACK ━━━━━━━━━━━━━━━━━━━━
    // User feedback, agent performance analytics, learning log
    ...createAnalyticsTools(),

    // ━━━━━━━━━━━━━━━━━━━━ CLINICAL INTELLIGENCE ━━━━━━━━━━━━━━━━━━━━
    // SA healthcare KB (300MB), ICD-10 codes, medicines, triage,
    // billing assist, HL7v2 CareOn bridge translator
    ...createClinicalTools(),
  },
});
