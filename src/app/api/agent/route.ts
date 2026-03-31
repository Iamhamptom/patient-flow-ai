import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/auth/guard";
import { flowAgent } from "@/lib/ai/agent";

const GATEWAY_KEY = process.env.VISIO_GATEWAY_KEY;

/**
 * POST /api/agent — invoke the FlowBot agent.
 * Auth: VISIO_GATEWAY_KEY (for external agents) or session.
 *
 * Body: { command: string, practiceId?: string }
 * The agent will use tools autonomously to fulfill the command.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, 10, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  // Auth check
  const authHeader = req.headers.get("authorization");
  if (GATEWAY_KEY && authHeader !== `Bearer ${GATEWAY_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { command, practiceId } = body;

  if (!command) {
    return NextResponse.json(
      { error: "command required" },
      { status: 400 }
    );
  }

  const prompt = practiceId
    ? `Practice ID: ${practiceId}\n\nTask: ${command}`
    : command;

  const result = await flowAgent.generate({
    prompt,
  });

  return NextResponse.json({
    response: result.text,
    steps: result.steps.length,
    usage: result.usage,
  });
}
