/**
 * Analytics, feedback, and learning tools for FlowBot.
 * Tracks every execution, captures user corrections,
 * and feeds into the self-improvement loop.
 */
import { tool } from "ai";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";

const FEEDBACK_TABLE = "pf_feedback";
const ANALYTICS_TABLE = "pf_agent_analytics";
const LEARNING_TABLE = "pf_learning_events";

/** Log an agent execution to analytics (called automatically) */
export async function logAgentExecution(data: {
  practiceId?: string;
  task: string;
  toolsUsed: string[];
  stepsTaken: number;
  totalTokens: number;
  modelUsed: string;
  durationMs: number;
  success: boolean;
  error?: string;
}) {
  await supabaseAdmin.from(ANALYTICS_TABLE).insert({
    practice_id: data.practiceId ?? null,
    task: data.task.slice(0, 500),
    tools_used: data.toolsUsed,
    steps_taken: data.stepsTaken,
    total_tokens: data.totalTokens,
    model_used: data.modelUsed,
    duration_ms: data.durationMs,
    success: data.success,
    error: data.error ?? null,
  });
}

/** Record a learning event from feedback or self-correction */
export async function recordLearning(
  eventType: string,
  source: string,
  lesson: string,
  context?: Record<string, unknown>
) {
  await supabaseAdmin.from(LEARNING_TABLE).insert({
    event_type: eventType,
    source,
    lesson,
    context: context ?? null,
  });
}

export function createAnalyticsTools() {
  return {
    submit_feedback: tool({
      description:
        "Record user feedback on a FlowBot response — ratings (1-5), corrections, or comments. This feeds the self-improvement loop.",
      inputSchema: z.object({
        practiceId: z.string(),
        rating: z.number().min(1).max(5).optional().describe("1=poor, 5=excellent"),
        comment: z.string().optional(),
        correction: z.string().optional().describe("What FlowBot got wrong and the correct answer"),
        bookingId: z.string().optional(),
        predictionId: z.string().optional(),
      }),
      execute: async ({ practiceId, rating, comment, correction, bookingId, predictionId }) => {
        const { data, error } = await supabaseAdmin
          .from(FEEDBACK_TABLE)
          .insert({
            practice_id: practiceId,
            feedback_type: correction ? "correction" : "rating",
            rating: rating ?? null,
            comment: comment ?? null,
            correction: correction ?? null,
            booking_id: bookingId ?? null,
            prediction_id: predictionId ?? null,
          })
          .select("id")
          .single();

        if (error) return { error: error.message };

        // If correction, record as learning event
        if (correction) {
          await recordLearning(
            "user_correction",
            "feedback",
            correction,
            { practiceId, bookingId, predictionId }
          );
        }

        return { recorded: true, feedbackId: data.id };
      },
    }),

    get_feedback_summary: tool({
      description:
        "Get feedback analytics — average rating, correction count, recent comments. Use to understand how well FlowBot is performing.",
      inputSchema: z.object({
        practiceId: z.string(),
        days: z.number().optional().describe("Look back period in days (default 30)"),
      }),
      execute: async ({ practiceId, days }) => {
        const since = new Date(Date.now() - (days ?? 30) * 86_400_000).toISOString();

        const { data } = await supabaseAdmin
          .from(FEEDBACK_TABLE)
          .select("rating, feedback_type, correction, comment, created_at")
          .eq("practice_id", practiceId)
          .gte("created_at", since)
          .order("created_at", { ascending: false });

        if (!data?.length) return { totalFeedback: 0, message: "No feedback yet." };

        const ratings = data.filter((f) => f.rating).map((f) => f.rating!);
        const avgRating = ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : null;
        const corrections = data.filter((f) => f.feedback_type === "correction");

        return {
          totalFeedback: data.length,
          avgRating,
          totalRatings: ratings.length,
          totalCorrections: corrections.length,
          recentCorrections: corrections.slice(0, 5).map((c) => c.correction),
          recentComments: data.filter((f) => f.comment).slice(0, 5).map((f) => f.comment),
        };
      },
    }),

    get_agent_analytics: tool({
      description:
        "Get FlowBot performance analytics — executions, tool usage, token consumption, error rate, average duration.",
      inputSchema: z.object({
        days: z.number().optional().describe("Look back period in days (default 7)"),
      }),
      execute: async ({ days }) => {
        const since = new Date(Date.now() - (days ?? 7) * 86_400_000).toISOString();

        const { data } = await supabaseAdmin
          .from(ANALYTICS_TABLE)
          .select("*")
          .gte("created_at", since)
          .order("created_at", { ascending: false });

        if (!data?.length) return { totalExecutions: 0, message: "No analytics yet." };

        const successful = data.filter((d) => d.success);
        const failed = data.filter((d) => !d.success);
        const totalTokens = data.reduce((a, b) => a + (b.total_tokens ?? 0), 0);
        const avgDuration = Math.round(
          data.reduce((a, b) => a + (b.duration_ms ?? 0), 0) / data.length
        );

        // Count tool usage frequency
        const toolCounts: Record<string, number> = {};
        for (const d of data) {
          for (const t of d.tools_used ?? []) {
            toolCounts[t] = (toolCounts[t] ?? 0) + 1;
          }
        }
        const topTools = Object.entries(toolCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, count]) => ({ name, count }));

        return {
          totalExecutions: data.length,
          successful: successful.length,
          failed: failed.length,
          errorRate: `${Math.round((failed.length / data.length) * 100)}%`,
          totalTokens,
          avgTokensPerExecution: Math.round(totalTokens / data.length),
          avgDurationMs: avgDuration,
          topTools,
          recentErrors: failed.slice(0, 3).map((f) => ({ task: f.task?.slice(0, 80), error: f.error })),
        };
      },
    }),

    get_learning_log: tool({
      description:
        "View what FlowBot has learned from feedback, corrections, and prediction outcomes. Shows the improvement trajectory.",
      inputSchema: z.object({
        limit: z.number().optional(),
      }),
      execute: async ({ limit }) => {
        const { data } = await supabaseAdmin
          .from(LEARNING_TABLE)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit ?? 20);

        return { count: data?.length ?? 0, events: data ?? [] };
      },
    }),
  };
}
