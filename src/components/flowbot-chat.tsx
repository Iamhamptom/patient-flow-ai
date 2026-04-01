"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  CornerDownLeft,
  Loader2,
  Maximize2,
  Minimize2,
  Sparkles,
  User,
  X,
} from "lucide-react";

/** Page-specific context — FlowBot knows where you are */
const PAGE_CONTEXT: Record<
  string,
  { greeting: string; prompts: string[]; hint: string }
> = {
  "/dashboard": {
    greeting: "You're on the Overview. Here's what I can do here:",
    hint: "I can see today's KPIs, risk distribution, and patient flow.",
    prompts: [
      "Give me a full morning briefing",
      "Score all bookings for today",
      "Who's at risk of no-showing?",
      "Generate a capacity forecast",
    ],
  },
  "/dashboard/no-show": {
    greeting: "You're on No-Show Risk. I can score and manage predictions.",
    hint: "I can score individual bookings or batch-score the full day.",
    prompts: [
      "Batch-score all of today's bookings",
      "Who has the highest no-show risk?",
      "Send reminders to high-risk patients",
      "What's the model accuracy this week?",
    ],
  },
  "/dashboard/flow": {
    greeting: "You're on Patient Flow. I see the live board.",
    hint: "I can check in patients, move them through stages, and flag blockers.",
    prompts: [
      "Who's been waiting the longest?",
      "Check in Thandi Mkhize",
      "Move Sipho to in consultation",
      "Import today's bookings to check-in",
    ],
  },
  "/dashboard/chat": {
    greeting: "You're in the FlowBot chat. Ask me anything.",
    hint: "I have 61 tools — scheduling, comms, clinical intelligence, engagement, analytics.",
    prompts: [
      "What can you do?",
      "Morning briefing",
      "Search ICD-10 for diabetes",
      "Check all connections status",
    ],
  },
  "/dashboard/engagement": {
    greeting: "You're on Engagement. I manage sequences and campaigns.",
    hint: "I can create automated patient journeys and run bulk campaigns.",
    prompts: [
      "Create a post-surgery follow-up sequence",
      "Show me active enrollment sequences",
      "Send a flu vaccination campaign",
      "What are the chronic care gaps?",
    ],
  },
  "/dashboard/bookings": {
    greeting: "You're on Bookings. I can manage the schedule.",
    hint: "I can create, confirm, cancel bookings and check slot availability.",
    prompts: [
      "Show me today's bookings",
      "Book a follow-up for tomorrow at 10am",
      "What slots are open tomorrow?",
      "Confirm all pending bookings",
    ],
  },
  "/dashboard/checkin": {
    greeting: "You're on Check-In. I manage the reception queue.",
    hint: "I can check patients in, move them through the flow, and flag long waits.",
    prompts: [
      "Import today's bookings to check-in",
      "Who's waiting right now?",
      "Check in a walk-in patient",
      "Mark Themba as no-show",
    ],
  },
  "/dashboard/daily": {
    greeting: "You're on Daily Tasks. I can manage the checklist.",
    hint: "I track morning, during-day, and end-of-day practice tasks.",
    prompts: [
      "What tasks are due now?",
      "Complete the claims review task",
      "How many tasks are done today?",
      "What's left for end of day?",
    ],
  },
  "/dashboard/calendar": {
    greeting: "You're on Calendar. I show slot availability.",
    hint: "I can check open slots and help book into available times.",
    prompts: [
      "What slots are free today?",
      "Show me tomorrow's availability",
      "Book the 10:30 slot for Sipho",
      "How full is next Monday?",
    ],
  },
  "/dashboard/connections": {
    greeting: "You're on Connections. I can check integration status.",
    hint: "I know which systems are connected and what each one powers.",
    prompts: [
      "Check all connection statuses",
      "What's connected right now?",
      "What breaks without WhatsApp?",
      "Is the CareOn bridge working?",
    ],
  },
  "/dashboard/notifications": {
    greeting: "You're on Notifications. I manage patient comms.",
    hint: "I send WhatsApp, SMS, and email via Twilio and Resend.",
    prompts: [
      "Send a reminder to all unconfirmed patients",
      "What notifications went out today?",
      "Broadcast a message to all active patients",
      "Check notification delivery status",
    ],
  },
  "/dashboard/schedule": {
    greeting: "You're on Schedule. I optimize doctor time.",
    hint: "I analyze consultation patterns and suggest optimal scheduling.",
    prompts: [
      "What are Dr. Nkosi's consultation patterns?",
      "Optimize tomorrow's schedule",
      "Which doctor runs longest?",
      "Suggest buffer slots for overruns",
    ],
  },
  "/dashboard/waitlist": {
    greeting: "You're on Waitlist. I manage standby patients.",
    hint: "I can add patients and auto-match them to predicted no-show gaps.",
    prompts: [
      "Who's on the waitlist?",
      "Add Mpho for a GP consultation",
      "Match waitlist to predicted no-shows",
      "How many are waiting for morning slots?",
    ],
  },
  "/dashboard/analytics": {
    greeting: "You're on Analytics. I track prediction accuracy.",
    hint: "I know my own accuracy, token usage, and learning trajectory.",
    prompts: [
      "What's my prediction accuracy?",
      "Show me agent analytics for this week",
      "What have I learned from feedback?",
      "How many tokens have I used?",
    ],
  },
  "/dashboard/doctors": {
    greeting: "You're on Doctors. I analyze consultation patterns.",
    hint: "I calculate avg/median/P75/P95 durations per doctor.",
    prompts: [
      "Analyze Dr. Nkosi's patterns",
      "Who's the most efficient doctor?",
      "What's the average consultation time?",
      "Suggest optimal slot duration",
    ],
  },
  "/dashboard/reminders": {
    greeting: "You're on Reminders. I handle smart patient outreach.",
    hint: "I send risk-based reminders — high-risk patients get extra nudges.",
    prompts: [
      "Send reminders to high-risk patients",
      "Who hasn't been reminded yet?",
      "What's the confirmation rate today?",
      "Send a 2-hour reminder to everyone",
    ],
  },
  "/dashboard/settings": {
    greeting: "You're on Settings. I can explain each option.",
    hint: "Configure risk thresholds, scheduling rules, and notification preferences.",
    prompts: [
      "What's the current no-show threshold?",
      "Explain the buffer slot setting",
      "What are the default reminder channels?",
      "How does double-booking work?",
    ],
  },
};

const DEFAULT_CONTEXT = {
  greeting: "I'm FlowBot — your daily operations agent.",
  hint: "I have 61 tools for scheduling, comms, clinical intelligence, and engagement.",
  prompts: [
    "Give me a morning briefing",
    "Who's at risk of no-showing today?",
    "Show me overdue patient recalls",
    "Search ICD-10 for diabetes",
  ],
};

export function FlowBotWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const ctx = PAGE_CONTEXT[pathname ?? ""] ?? DEFAULT_CONTEXT;

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
    sendMessage({
      text: `[Page: ${pathname}] Practice ID: netcare-primary-001\n\n${input}`,
    });
    setInput("");
  }

  function handlePrompt(prompt: string) {
    sendMessage({
      text: `[Page: ${pathname}] Practice ID: netcare-primary-001\n\n${prompt}`,
    });
  }

  // Floating button
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-foreground text-background flex items-center justify-center shadow-2xl hover:scale-105 transition-transform group"
      >
        <Bot className="h-6 w-6" />
        <span className="absolute -top-10 right-0 bg-card border border-border/50 rounded-lg px-3 py-1.5 text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
          {ctx.hint}
        </span>
      </button>
    );
  }

  const panelClass = expanded
    ? "fixed inset-4 z-50"
    : "fixed bottom-6 right-6 z-50 w-[420px] h-[600px]";

  return (
    <div
      className={`${panelClass} flex flex-col rounded-xl border border-border/50 bg-background shadow-2xl overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border/50 bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          <span className="text-sm font-medium">FlowBot</span>
          {isStreaming && (
            <span className="text-[10px] text-muted-foreground animate-pulse">
              thinking...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors"
          >
            {expanded ? (
              <Minimize2 className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={() => {
              setOpen(false);
              setExpanded(false);
            }}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-4 py-6">
              {/* Context-aware greeting */}
              <div className="text-center space-y-2">
                <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/30" />
                <p className="text-sm font-medium">{ctx.greeting}</p>
                <p className="text-xs text-muted-foreground max-w-[300px] mx-auto">
                  {ctx.hint}
                </p>
              </div>
              {/* Context-aware prompts */}
              <div className="space-y-1.5">
                {ctx.prompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePrompt(p)}
                    className="w-full text-left text-xs rounded-lg border border-border/30 px-3 py-2.5 hover:bg-card hover:border-border/60 transition-colors text-muted-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-2.5">
              <div
                className={`h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  msg.role === "user"
                    ? "bg-secondary"
                    : "bg-card border border-border/50"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <Bot className="h-3 w-3" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground mb-0.5 font-mono">
                  {msg.role === "user" ? "you" : "flowbot"}
                </p>
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {msg.parts?.map((part, i) => {
                    if (part.type === "text") {
                      return <span key={i}>{part.text}</span>;
                    }
                    if (part.type.startsWith("tool-")) {
                      const toolName = part.type.replace("tool-", "");
                      const p = part as { state?: string };
                      return (
                        <div
                          key={i}
                          className="my-1.5 flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground"
                        >
                          <Sparkles className="h-2.5 w-2.5" />
                          <span>{toolName}</span>
                          {p.state && (
                            <span className="text-muted-foreground/50">
                              ({p.state})
                            </span>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          ))}

          {isStreaming &&
            messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>FlowBot is thinking...</span>
              </div>
            )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-border/50 flex-shrink-0"
      >
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask FlowBot..."
            className="min-h-[44px] max-h-[100px] resize-none pr-10 text-sm bg-card border-border/30"
            rows={1}
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
            variant="ghost"
            disabled={!input.trim() || isStreaming}
            className="absolute bottom-1 right-1 h-8 w-8 p-0"
          >
            {isStreaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CornerDownLeft className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
