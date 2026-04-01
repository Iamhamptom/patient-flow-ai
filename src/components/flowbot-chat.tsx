"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState } from "react";
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

const PROMPTS = [
  "Give me a morning briefing",
  "Who's at risk of no-showing today?",
  "Show me overdue patient recalls",
  "What referrals are pending?",
  "Check the patient flow board",
  "Book Thandi Mkhize for a GP consultation tomorrow at 9am",
];

export function FlowBotWidget() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

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
      text: `Practice ID: netcare-primary-001\n\n${input}`,
    });
    setInput("");
  }

  function handlePrompt(prompt: string) {
    sendMessage({
      text: `Practice ID: netcare-primary-001\n\n${prompt}`,
    });
  }

  // Floating button when closed
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-foreground text-background flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"
      >
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  const panelClass = expanded
    ? "fixed inset-4 z-50"
    : "fixed bottom-6 right-6 z-50 w-[420px] h-[600px]";

  return (
    <div className={`${panelClass} flex flex-col rounded-xl border border-border/50 bg-background shadow-2xl overflow-hidden`}>
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
            onClick={() => { setOpen(false); setExpanded(false); }}
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
            <div className="space-y-4 py-8">
              <div className="text-center space-y-2">
                <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/30" />
                <p className="text-sm font-medium">FlowBot</p>
                <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
                  Your daily ops agent. Manage bookings, patients, comms,
                  recalls, referrals, CareOn bridge data — all conversationally.
                </p>
              </div>
              <div className="space-y-1.5">
                {PROMPTS.map((p) => (
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
                  msg.role === "user" ? "bg-secondary" : "bg-card border border-border/50"
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

          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>FlowBot is thinking...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border/50 flex-shrink-0">
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
