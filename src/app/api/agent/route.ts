import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/auth/guard";
import { flowAgent } from "@/lib/ai/agent";

const GATEWAY_KEY = process.env.VISIO_GATEWAY_KEY;

/**
 * POST /api/agent — invoke the FlowBot agent.
 * Auth: VISIO_GATEWAY_KEY (for external agents) or session.
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

  try {
    const prompt = practiceId
      ? `Practice ID: ${practiceId}\n\nTask: ${command}`
      : command;

    const result = await flowAgent.generate({ prompt });

    return NextResponse.json({
      response: result.text,
      steps: result.steps.length,
      usage: result.usage,
    });
  } catch (err) {
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
