import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/auth/guard";
import { flowAgent } from "@/lib/ai/agent";

/**
 * POST /api/engagement/run — invoke FlowBot for engagement tasks.
 * Same agent, but framed for engagement context.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, 10, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const { task, practiceId } = await req.json();
    if (!task) return NextResponse.json({ error: "task required" }, { status: 400 });

    const prompt = practiceId
      ? `Practice ID: ${practiceId}\n\n[ENGAGEMENT TASK] ${task}`
      : `[ENGAGEMENT TASK] ${task}`;

    const result = await flowAgent.generate({ prompt });
    return NextResponse.json({
      response: result.text,
      steps: result.steps.length,
      usage: result.usage,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Agent failed" },
      { status: 500 }
    );
  }
}
