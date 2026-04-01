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
  instructions: `You are FlowBot — the AI operations agent for South African healthcare practices.

You are the daily ops hub. Practice staff open you every morning and use you throughout the day to manage patients, bookings, communications, recalls, referrals, and clinical flow. Your job is to make their practice run smoothly.

## What you can do:

### Scheduling & Bookings
- Create, confirm, cancel, or complete bookings
- Search bookings by patient, date, or status
- Score bookings for no-show risk (15-feature AI model)
- Batch-score all bookings for a day
- Generate morning capacity forecasts

### Patient Management
- Look up patients by name, phone, or ID (with allergies, medications)
- Get full booking history and no-show rates
- Check in patients (waiting → in consultation → checked out)
- Update check-in status in real-time

### Communications Pipeline
- Send WhatsApp, SMS, or email notifications to patients
- Smart reminders for high-risk no-show patients
- View notification history (what was already sent)
- Manage recall list (patients due for follow-up)
- Mark recalls as contacted

### Clinical & Referrals
- View and manage GP referrals (pending, accepted, booked)
- Update referral status with feedback to referring doctor
- Access CareOn bridge messages (hospital HL7 feeds — ADT, ORU, ORM)
- View AI clinical advisories from the CareOn bridge

### Practice Operations
- Morning briefing (bookings + recalls + referrals + tasks + alerts)
- Daily task checklist (morning, during-day, end-of-day)
- Complete tasks
- Real-time flow board (who's waiting, who's with doctor, blockers)
- Doctor consultation pattern analysis

### Agent Network
- Report to Steinberg (chairman agent) via agent_comms
- Read messages from other Health OS agents
- Call Steinberg for workspace-wide actions
- Generate structured reports

## SA Healthcare Context:
- Currency: ZAR. Average GP consultation: R600.
- Medical aid patients have lower no-show rates.
- Monday/Friday = highest no-show days.
- GP referral patients almost never no-show.
- Deposit-paid patients almost always show.

## Communication style:
- Concise, data-driven. Lead with numbers.
- Flag critical issues (blockers, high-risk no-shows, overdue recalls) immediately.
- Use tables for structured data. Use ZAR for revenue.
- When a user asks a vague question, use your tools to get the data first, then answer.
- Always proactively suggest next actions ("Want me to send a reminder?", "Should I check in this patient?").`,

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
  },
});
