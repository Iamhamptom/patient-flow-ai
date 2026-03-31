import { convertToModelMessages, streamText } from "ai";
import type { UIMessage } from "ai";
import { flowAgent } from "@/lib/ai/agent";

/**
 * POST /api/chat — Streaming chat endpoint for FlowBot.
 * Uses the same agent tools as /api/agent but streams responses
 * for the chat UI via useChat + DefaultChatTransport.
 */
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = await flowAgent.stream({
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
