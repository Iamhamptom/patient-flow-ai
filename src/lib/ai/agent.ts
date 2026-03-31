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
  instructions: `You are FlowBot, the Patient Flow AI agent for South African healthcare practices.

Your job is to optimize patient flow — reduce no-shows, improve scheduling, and maximize practice capacity.

## What you can do:
- Score individual bookings or batch-score a full day for no-show risk
- Generate morning capacity forecasts
- Check real-time patient flow (who's waiting, in consultation, done)
- Analyze doctor consultation patterns (avg times, peak hours)
- Manage the waitlist (add patients, match to no-show gaps)
- Send smart reminders to high-risk patients
- Report status and insights back to the Health OS agent network

## SA Healthcare Context:
- Currency is ZAR (Rands)
- Average GP consultation fee: R600
- Medical aid patients have lower no-show rates
- Monday and Friday have highest no-show rates
- GP referral patients almost never no-show
- Deposit-paid patients almost always show up

## Communication style:
- Be concise and data-driven
- Lead with numbers and actionable insights
- Flag critical issues immediately
- Use ZAR for all revenue figures

When asked to do something, use your tools to gather data, analyze it, and return clear actionable insights.`,

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
        messageType: z
          .enum([
            "status_update",
            "data_report",
            "alert",
            "task_handoff",
            "sync_request",
          ])
          .describe("Type of inter-agent message"),
        content: z.string().describe("Message content"),
        priority: z
          .enum(["low", "normal", "high", "critical"])
          .optional(),
        targetAgent: z
          .string()
          .optional()
          .describe("Target agent name (steinberg, openclaw, chairman)"),
      }),
      execute: async ({ messageType, content, priority, targetAgent }) => {
        const { data, error } = await supabaseAdmin
          .from("agent_comms")
          .insert({
            sender: "flowbot",
            sender_type: "ai_agent",
            recipient: targetAgent ?? "steinberg",
            message_type: messageType,
            content,
            priority: priority ?? "normal",
            status: "unread",
            metadata: {
              source: "patient-flow-ai",
              timestamp: new Date().toISOString(),
            },
          })
          .select("id")
          .single();

        if (error) return { error: error.message };
        return { sent: true, messageId: data.id };
      },
    }),

    read_agent_messages: tool({
      description:
        "Read messages sent to FlowBot from other Health OS agents.",
      inputSchema: z.object({
        limit: z.number().optional().describe("Max messages to read (default 10)"),
        unreadOnly: z.boolean().optional(),
      }),
      execute: async ({ limit, unreadOnly }) => {
        let query = supabaseAdmin
          .from("agent_comms")
          .select("*")
          .eq("recipient", "flowbot")
          .order("created_at", { ascending: false })
          .limit(limit ?? 10);

        if (unreadOnly) {
          query = query.eq("status", "unread");
        }

        const { data } = await query;
        return { count: data?.length ?? 0, messages: data ?? [] };
      },
    }),
  },
});
