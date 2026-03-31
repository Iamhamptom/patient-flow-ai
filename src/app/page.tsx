import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Terminal } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-14">
          <span className="text-sm font-medium tracking-tight font-mono">
            patient-flow-ai
          </span>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/chat">
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <Bot className="h-3.5 w-3.5" />
                Talk to FlowBot
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="text-xs">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-6">
          AI Healthcare Operations Platform
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] max-w-3xl">
          The AI agent that runs
          <br />
          your clinic's patient flow.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
          FlowBot predicts which patients won't show up, fills their slots
          from your waitlist, optimizes doctor schedules, and learns from
          every booking — all autonomously.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <Link href="/dashboard/chat">
            <Button size="lg" className="px-8 gap-2">
              <Bot className="h-4 w-4" />
              Open FlowBot
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg" className="px-8">
              View Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* What is this — explainer */}
      <section className="border-t border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-4">
            What is Patient Flow AI?
          </p>
          <div className="grid md:grid-cols-2 gap-16">
            <div className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                Patient Flow AI is a standalone health product built for South
                African clinics and hospitals. It sits on top of your existing
                booking system and uses AI to solve the three biggest
                operational problems in healthcare:
              </p>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-4 pt-0.5">1</span>
                  <div>
                    <p className="text-sm font-medium">Patients don't show up</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      5 no-shows/day at R600/consult = R792K lost per doctor per year.
                      FlowBot scores every booking on 15 features and flags who's likely to miss.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-4 pt-0.5">2</span>
                  <div>
                    <p className="text-sm font-medium">Schedules waste capacity</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Every doctor has different consultation patterns. FlowBot learns them —
                      complex cases in the morning, follow-ups stacked in the afternoon, buffer
                      slots where overruns happen.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-4 pt-0.5">3</span>
                  <div>
                    <p className="text-sm font-medium">Nobody knows what's happening in real-time</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Who's waiting? How long? Is anyone stuck? FlowBot gives you a live
                      Kanban board of patient movement and flags blockers automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-2">
                How it works
              </p>
              <div className="rounded-lg border border-border/50 bg-card p-5 space-y-4 font-mono text-xs">
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground/50">01</span>
                  <div>
                    <p className="text-foreground">Reads your booking data</p>
                    <p className="text-muted-foreground mt-0.5">
                      Connects to your existing Supabase/HealthOps tables. No migration needed.
                    </p>
                  </div>
                </div>
                <div className="h-px bg-border/30" />
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground/50">02</span>
                  <div>
                    <p className="text-foreground">Scores every booking</p>
                    <p className="text-muted-foreground mt-0.5">
                      Dual engine — Gemini 3 Flash for precision, logistic regression for batch.
                      15 features: history, deposit, day of week, source, medical aid, etc.
                    </p>
                  </div>
                </div>
                <div className="h-px bg-border/30" />
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground/50">03</span>
                  <div>
                    <p className="text-foreground">Takes action</p>
                    <p className="text-muted-foreground mt-0.5">
                      Sends smart reminders to high-risk patients. Matches waitlist to predicted
                      no-show slots. Generates morning capacity forecasts.
                    </p>
                  </div>
                </div>
                <div className="h-px bg-border/30" />
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground/50">04</span>
                  <div>
                    <p className="text-foreground">Learns and improves</p>
                    <p className="text-muted-foreground mt-0.5">
                      Records actual outcomes. Retrains weekly. Adjusts weights from
                      correlations. 90% accuracy on first retrain.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Agent — FlowBot */}
      <section className="border-t border-border/50 bg-card">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex items-start gap-4 mb-8">
            <div className="h-10 w-10 rounded-lg bg-foreground/5 border border-border/50 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">FlowBot</h2>
              <p className="text-sm text-muted-foreground">
                The AI agent at the center of Patient Flow AI
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-lg border border-border/50 bg-background p-5">
              <p className="text-xs font-mono text-muted-foreground mb-3">SDK AGENT</p>
              <p className="text-sm font-medium mb-2">Built on Vercel AI SDK 6</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ToolLoopAgent with 13 tools. Claude Sonnet 4.6 for reasoning.
                Streaming chat UI via useChat + DefaultChatTransport.
                Up to 15 autonomous steps per request.
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background p-5">
              <p className="text-xs font-mono text-muted-foreground mb-3">13 TOOLS</p>
              <p className="text-sm font-medium mb-2">Full operational control</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Score bookings. Batch-score days. Generate forecasts. Read flow board.
                Analyze doctor patterns. Manage waitlist. Generate reports.
                Send messages to Steinberg. Call the workspace gateway.
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background p-5">
              <p className="text-xs font-mono text-muted-foreground mb-3">AGENT NETWORK</p>
              <p className="text-sm font-medium mb-2">Connected to Health OS</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reports to Steinberg via agent_comms table. Receives tasks from
                the chairman agent. Polls every 10 minutes. Bidirectional
                communication with the full VisioCorp agent network.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-border/50 bg-background p-5">
            <p className="text-xs font-mono text-muted-foreground mb-3">TRY IT</p>
            <div className="flex items-center gap-3">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <code className="text-xs font-mono text-muted-foreground flex-1">
                curl -X POST https://patient-flow-ai.vercel.app/api/agent -H &quot;Authorization: Bearer $KEY&quot; -d &apos;{'{'}&quot;command&quot;:&quot;Score all bookings for today&quot;{'}'}&#39;
              </code>
            </div>
            <div className="mt-4 flex gap-3">
              <Link href="/dashboard/chat">
                <Button size="sm" className="gap-1.5">
                  <Bot className="h-3.5 w-3.5" />
                  Open FlowBot Chat
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="border-t border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid grid-cols-4 gap-8">
            {[
              { value: "R792K", label: "Lost per doctor/year from no-shows" },
              { value: "90%", label: "Prediction accuracy (first retrain)" },
              { value: "13", label: "Agent tools for autonomous operation" },
              { value: "<50ms", label: "Per-booking scoring latency" },
            ].map((stat) => (
              <div key={stat.value}>
                <p className="text-2xl font-bold font-mono">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="border-t border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-6">
            Stack
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "Next.js 16",
              "Vercel AI SDK 6",
              "Claude Sonnet 4.6",
              "Gemini 3 Flash",
              "Supabase",
              "TypeScript",
              "Tailwind 4",
              "shadcn/ui",
              "ToolLoopAgent",
              "Vercel Cron",
            ].map((tech) => (
              <span
                key={tech}
                className="text-xs font-mono text-muted-foreground border border-border/50 rounded-md px-2.5 py-1"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-mono">
            patient-flow-ai v0.2.0
          </p>
          <p className="text-xs text-muted-foreground">
            VisioCorp Health Division
          </p>
        </div>
      </footer>
    </div>
  );
}
