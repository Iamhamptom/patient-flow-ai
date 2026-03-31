import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 h-14">
          <span className="text-sm font-medium tracking-tight font-mono">
            patient-flow-ai
          </span>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="text-xs">
              Open Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center">
        <div className="max-w-4xl mx-auto px-6 py-32">
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-6">
            Predictive Healthcare Operations
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] max-w-3xl">
            Know which patients
            <br />
            won't show up.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
            AI that predicts no-shows, optimizes schedules, and recovers
            lost revenue for South African healthcare practices.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="px-8">
                Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard/chat">
              <Button variant="outline" size="lg" className="px-8">
                Talk to FlowBot
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="border-t border-border/50">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="grid grid-cols-3 gap-12">
            <div>
              <p className="text-3xl font-bold font-mono">R792K</p>
              <p className="text-sm text-muted-foreground mt-2">
                Lost per doctor/year from no-shows
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold font-mono">90%</p>
              <p className="text-sm text-muted-foreground mt-2">
                Prediction accuracy on first retrain
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold font-mono">15</p>
              <p className="text-sm text-muted-foreground mt-2">
                Features per booking scored in &lt;50ms
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities — text only, no icons */}
      <section className="border-t border-border/50">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-10">
            {[
              {
                title: "No-Show Prediction",
                desc: "Dual-model engine — Gemini for precision, logistic regression for batch. Scores 15 features from booking history, deposit status, and patient behavior.",
              },
              {
                title: "Schedule Optimization",
                desc: "Learns each doctor's consultation patterns. Places complex cases in mornings, stacks follow-ups in afternoons, inserts buffers where overruns are predicted.",
              },
              {
                title: "Real-Time Flow Board",
                desc: "Live Kanban of patient movement through the clinic. Auto-detects blockers — patients waiting too long, consultations overrunning.",
              },
              {
                title: "Waitlist Auto-Fill",
                desc: "When a no-show is predicted, matches waitlist patients to fill the gap before the slot goes empty.",
              },
              {
                title: "Self-Learning",
                desc: "Records actual outcomes. Retrains weekly. Adjusts feature weights from correlations. Gets more accurate with every booking.",
              },
              {
                title: "Agent Network",
                desc: "FlowBot reports to the Health OS agent network. Steinberg can trigger flow analysis, scoring, and capacity forecasts remotely.",
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="text-sm font-medium">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
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
