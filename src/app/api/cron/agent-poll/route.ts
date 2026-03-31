import { NextRequest, NextResponse } from "next/server";
import { guardCronRoute, isDemoMode } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase";
import { flowAgent } from "@/lib/ai/agent";

const WORKSPACE_ID = "a1d9788c-55cf-4eb0-a3eb-1697ec9763de";

/**
 * Cron: Every 10 minutes — poll agent_comms for tasks sent to FlowBot.
 * Executes task_handoff and directive messages autonomously.
 */
export async function GET(req: NextRequest) {
  const blocked = guardCronRoute(req);
  if (blocked) return blocked;

  if (isDemoMode()) {
    return NextResponse.json({ message: "Demo mode — skipped" });
  }

  // Read unread messages for flowbot
  const { data: messages, error } = await supabaseAdmin
    .from("agent_comms")
    .select("*")
    .eq("recipient", "flowbot")
    .is("read_at", null)
    .in("msg_type", ["task_handoff", "directive", "sync_request"])
    .order("created_at", { ascending: true })
    .limit(3);

  if (error || !messages?.length) {
    return NextResponse.json({ message: "No pending tasks", processed: 0 });
  }

  const results: { id: string; status: string; error?: string }[] = [];

  for (const msg of messages) {
    try {
      // Mark as read
      await supabaseAdmin
        .from("agent_comms")
        .update({ read_at: new Date().toISOString() })
        .eq("id", msg.id);

      // Execute the task via FlowBot agent
      const command = `${msg.subject}\n\n${msg.body ?? ""}${
        msg.payload ? `\n\nPayload: ${JSON.stringify(msg.payload)}` : ""
      }`;

      const result = await flowAgent.generate({ prompt: command });

      // Send response back to sender
      await supabaseAdmin.from("agent_comms").insert({
        workspace_id: WORKSPACE_ID,
        sender: "flowbot",
        recipient: msg.sender,
        msg_type: "data_report",
        subject: `Re: ${msg.subject}`,
        body: result.text,
        payload: { steps: result.steps.length, usage: result.usage },
        ref_id: msg.id,
        priority: msg.priority,
      });

      // Mark as resolved
      await supabaseAdmin
        .from("agent_comms")
        .update({ resolved_at: new Date().toISOString() })
        .eq("id", msg.id);

      results.push({ id: msg.id, status: "completed" });
    } catch (err) {
      results.push({
        id: msg.id,
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    message: `Processed ${results.filter((r) => r.status === "completed").length} tasks`,
    results,
  });
}
