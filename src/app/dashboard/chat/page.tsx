"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  Bot,
  CornerDownLeft,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";

const SUGGESTED_PROMPTS = [
  "Score all bookings for today and flag high-risk patients",
  "Check the real-time patient flow board",
  "What are Dr. Nkosi's consultation patterns?",
  "How many patients are on the waitlist?",
  "Generate a morning capacity forecast",
  "Add Mpho Radebe to the waitlist for a GP consultation",
  "Send a status update to Steinberg about today's flow",
];

export default function ChatPage() {
  const [practiceId, setPracticeId] = useState("netcare-primary-001");
  const scrollRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const prompt = practiceId
      ? `Practice ID: ${practiceId}\n\n${input}`
      : input;
    sendMessage({ text: prompt });
    setInput("");
  }

  function handleSuggestion(prompt: string) {
    const fullPrompt = practiceId
      ? `Practice ID: ${practiceId}\n\n${prompt}`
      : prompt;
    sendMessage({ text: fullPrompt });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">FlowBot</h1>
            <p className="text-xs text-muted-foreground">
              AI Patient Flow Agent — {practiceId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              isStreaming
                ? "border-primary/50 text-primary animate-pulse"
                : "border-[var(--color-risk-low)]/50 text-[var(--color-risk-low)]"
            }
          >
            <Activity className="h-3 w-3 mr-1" />
            {isStreaming ? "Thinking..." : "Online"}
          </Badge>
        </div>
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 overflow-hidden border-border/50">
        <ScrollArea className="h-full" ref={scrollRef}>
          <CardContent className="p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-semibold">
                    What can I help with?
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-md">
                    I can score bookings for no-show risk, check patient flow,
                    optimize schedules, manage your waitlist, and report to
                    the Health OS agent network.
                  </p>
                </div>
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 max-w-lg w-full">
                  {SUGGESTED_PROMPTS.slice(0, 4).map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSuggestion(prompt)}
                      className="text-left text-xs rounded-lg border border-border/50 p-3 hover:bg-accent/50 hover:border-primary/30 transition-colors text-muted-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div
                  className={`h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    msg.role === "user"
                      ? "bg-secondary"
                      : "bg-primary/10"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">
                      {msg.role === "user" ? "You" : "FlowBot"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date().toLocaleTimeString(
                        "en-ZA",
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </span>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words prose prose-invert prose-sm max-w-none">
                    {msg.parts?.map((part, i) => {
                      if (part.type === "text") {
                        return <span key={i}>{part.text}</span>;
                      }
                      // v6: tool parts are typed as tool-<toolName>
                      if (part.type.startsWith("tool-")) {
                        const toolName = part.type.replace("tool-", "");
                        const p = part as { state?: string; toolCallId?: string };
                        return (
                          <div
                            key={i}
                            className="my-2 rounded-md border border-border/50 bg-secondary/30 p-2"
                          >
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-3 w-3 text-primary" />
                              <span className="text-xs font-mono text-muted-foreground">
                                {toolName}
                              </span>
                              {p.state && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] py-0"
                                >
                                  {p.state}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                </div>
                <div className="text-sm text-muted-foreground animate-pulse">
                  FlowBot is thinking...
                </div>
              </div>
            )}
          </CardContent>
        </ScrollArea>
      </Card>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-3">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask FlowBot anything about patient flow, no-show risk, scheduling..."
            className="min-h-[60px] max-h-[120px] resize-none pr-14 bg-card border-border/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isStreaming}
            className="absolute bottom-2 right-2"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CornerDownLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
