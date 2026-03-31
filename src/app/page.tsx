import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarClock,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">
              Patient Flow AI
            </span>
          </div>
          <Link href="/dashboard">
            <Button size="sm">
              Dashboard
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <Badge
          variant="outline"
          className="mb-4 border-primary/30 text-primary"
        >
          <Zap className="h-3 w-3 mr-1" />
          AI-Powered Healthcare Operations
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          Predict No-Shows.
          <br />
          Optimize Schedules.
          <br />
          <span className="text-primary">Recover Lost Revenue.</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Patient Flow AI uses machine learning to predict which patients
          won't show up, automatically fills gaps from your waitlist, and
          optimizes doctor schedules — saving R792K/year per doctor.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/dashboard">
            <Button size="lg">
              Open Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">No-Show Prediction</h3>
              <p className="text-sm text-muted-foreground">
                AI scores every booking on 15 features — history, day of week,
                deposit status, source. Flags high-risk patients before they
                miss their slot.
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <CalendarClock className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Schedule Optimization</h3>
              <p className="text-sm text-muted-foreground">
                Analyzes each doctor's consultation patterns. Complex cases in
                the morning, follow-ups afternoon, buffer slots for overruns.
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Waitlist Auto-Fill</h3>
              <p className="text-sm text-muted-foreground">
                When a no-show is predicted, the system matches waitlist
                patients to fill the gap — recovering revenue automatically.
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Smart Reminders</h3>
              <p className="text-sm text-muted-foreground">
                High-risk patients get extra WhatsApp/SMS reminders. Low-risk
                patients aren't bothered.
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Real-Time Flow Board</h3>
              <p className="text-sm text-muted-foreground">
                Kanban view of patient flow: waiting, in consultation, done.
                Blocker detection alerts when patients are stuck.
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">POPIA Compliant</h3>
              <p className="text-sm text-muted-foreground">
                Full audit trail. Patient data in SA-hosted Supabase. Consent
                tracking built in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="border-t border-border py-16 bg-card">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-8">
            The Numbers Speak
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="text-3xl font-bold font-mono text-primary">
                R792K
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Lost per doctor/year from no-shows (at R600/consult)
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold font-mono text-primary">40%</p>
              <p className="text-sm text-muted-foreground mt-1">
                Reduction in no-shows with prediction + smart reminders
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold font-mono text-primary">
                R316K
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Recovered per doctor per year
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            VisioCorp Health Division — Patient Flow AI v0.1.0
          </p>
          <p className="text-xs text-muted-foreground">
            Built for South African healthcare
          </p>
        </div>
      </footer>
    </div>
  );
}
