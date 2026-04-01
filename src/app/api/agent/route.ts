import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/auth/guard";
import { flowAgent } from "@/lib/ai/agent";
import { logAgentExecution } from "@/lib/ai/analytics-tools";

const GATEWAY_KEY = process.env.VISIO_GATEWAY_KEY;

/**
 * POST /api/agent — invoke the FlowBot agent.
 * Auth: VISIO_GATEWAY_KEY (for external agents) or session.
 * Every execution is tracked in pf_agent_analytics.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, 10, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const authHeader = req.headers.get("authorization");
  if (GATEWAY_KEY && authHeader !== `Bearer ${GATEWAY_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let command: string;
  let practiceId: string | undefined;
  try {
    const body = await req.json();
    command = body.command;
    practiceId = body.practiceId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!command) {
    return NextResponse.json({ error: "command required" }, { status: 400 });
  }

  const startTime = Date.now();

  try {
    const prompt = practiceId
      ? `Practice ID: ${practiceId}\n\nTask: ${command}`
      : command;

    const result = await flowAgent.generate({ prompt });

    // Extract tool names used
    const toolsUsed = result.steps
      .flatMap((s) => s.toolCalls ?? [])
      .map((tc) => tc.toolName)
      .filter(Boolean);

    // Log execution
    await logAgentExecution({
      practiceId,
      task: command,
      toolsUsed: [...new Set(toolsUsed)],
      stepsTaken: result.steps.length,
      totalTokens: result.usage?.totalTokens ?? 0,
      modelUsed: "anthropic/claude-sonnet-4.6",
      durationMs: Date.now() - startTime,
      success: true,
    }).catch(() => {}); // Don't fail the response if analytics fails

    return NextResponse.json({
      response: result.text,
      steps: result.steps.length,
      usage: result.usage,
    });
  } catch (err) {
    // Log failed execution
    await logAgentExecution({
      practiceId,
      task: command,
      toolsUsed: [],
      stepsTaken: 0,
      totalTokens: 0,
      modelUsed: "anthropic/claude-sonnet-4.6",
      durationMs: Date.now() - startTime,
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }).catch(() => {});

    console.error("[FlowBot Agent Error]", err);
    return NextResponse.json(
      {
        error: "FlowBot agent failed",
        detail: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
