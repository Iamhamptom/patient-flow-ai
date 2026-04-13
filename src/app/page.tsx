"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Bot, Activity, Users, Clock, BarChart3, AlertTriangle, CheckCircle2,
  TrendingDown, Brain, Building2, Heart, Stethoscope, BadgeCheck, Lock,
  Globe, Zap, ArrowRight, ChevronRight, FlaskConical, Beaker, Calendar,
  Bell, Shield,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] } }),
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium tracking-tight">Patient Flow AI</span>
            <span className="text-[9px] font-mono text-muted-foreground ml-1 hidden sm:inline">by Visio Research Labs</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="#research" className="text-[11px] text-muted-foreground hover:text-foreground transition hidden sm:inline">Research</Link>
            <Link href="#compliance" className="text-[11px] text-muted-foreground hover:text-foreground transition hidden sm:inline">Compliance</Link>
            <Link href="/dashboard/chat"><Button variant="outline" size="sm" className="text-xs gap-1.5"><Bot className="h-3.5 w-3.5" /> FlowBot</Button></Link>
            <Link href="/dashboard"><Button size="sm" className="text-xs">Dashboard</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 pt-24 pb-20 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/5 to-transparent blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto relative z-10">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full ring-1 ring-border bg-card/50 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[10px] font-mono text-muted-foreground">SAHPRA Registered &middot; AI No-Show Prediction &middot; FlowBot Agent</span>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]">
              AI That Predicts Which<br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Patients Won't Show Up</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-6 text-[15px] text-muted-foreground max-w-xl mx-auto leading-relaxed">
              15-25% of appointments in SA practices are no-shows — costing the industry <span className="text-foreground font-semibold">R2.4 billion per year</span>.
              Patient Flow AI uses predictive intelligence to reduce no-shows, optimize scheduling, and maximize every consultation slot.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <Link href="/dashboard/chat"><Button className="gap-2"><Bot className="h-4 w-4" /> Talk to FlowBot</Button></Link>
              <Link href="#research"><Button variant="outline" className="gap-2"><FlaskConical className="h-4 w-4" /> Read the Research</Button></Link>
              <Link href="/dashboard"><Button variant="ghost" className="gap-2 text-muted-foreground"><BarChart3 className="h-4 w-4" /> View Dashboard</Button></Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Crisis Stats */}
      <section id="research" className="border-t border-border px-6 py-20 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">Visio Research Labs &middot; Patient Flow Intelligence</p>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">The No-Show Crisis</h2>
            <p className="text-[14px] text-muted-foreground max-w-2xl leading-relaxed mb-10">
              Every missed appointment cascades through the system — doctors sit idle, follow-up patients overflow,
              and the practice loses R480-R1,200 per empty slot. The problem is not reminders. The problem is prediction.
            </p>
          </FadeIn>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: "15-25%", label: "Average No-Show Rate", icon: TrendingDown },
              { value: "R2.4B", label: "Annual No-Show Cost (SA)", icon: BarChart3 },
              { value: "R480-1.2K", label: "Lost Per Empty Slot", icon: Clock },
              { value: "20-35min", label: "Average Wait Time", icon: Users },
            ].map((s, i) => {
              const SIcon = s.icon;
              return (
              <motion.div key={s.label} variants={fadeUp} custom={i} className="rounded-xl ring-1 ring-border bg-card p-5 text-center">
                <SIcon className="w-5 h-5 text-muted-foreground mx-auto mb-3" />
                <p className="text-2xl sm:text-3xl font-bold">{s.value}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</p>
              </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* FlowBot */}
      <section className="border-t border-border px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">FlowBot: Your AI Practice Manager</h2>
            <p className="text-[14px] text-muted-foreground mb-10">An AI agent that manages patient flow end-to-end — from check-in to checkout, from prediction to optimization.</p>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Brain, title: "No-Show Prediction", desc: "ML models predict which patients are likely to miss their appointment based on history, weather, day-of-week, and 15+ features." },
              { icon: Calendar, title: "Smart Scheduling", desc: "Overbooking intelligence that fills predicted gaps. Double-book high-risk slots. Waitlist auto-fill for cancellations." },
              { icon: Users, title: "Check-In Automation", desc: "Self-service kiosk mode. Queue management. Real-time wait time estimation for patients and staff." },
              { icon: Clock, title: "Wait Time Prediction", desc: "Live wait time estimates per doctor, per room. Alerts when delays cascade. Auto-notify waiting patients." },
              { icon: BarChart3, title: "Capacity Forecasting", desc: "Predict demand by hour, day, season. Staff scheduling recommendations. Room utilization optimization." },
              { icon: Bell, title: "Smart Reminders", desc: "Not just SMS reminders — personalized timing, channel preference, escalation for high-risk patients." },
              { icon: Activity, title: "Daily Briefings", desc: "Morning intelligence: today's schedule, risk patients, predicted gaps, recommended overbookings." },
              { icon: Heart, title: "Engagement Tracking", desc: "Patient engagement scores. Recall compliance. Follow-up completion rates. Chronic care adherence." },
              { icon: Zap, title: "Doctor Performance", desc: "Consultation duration trends. Patient throughput. On-time rates. Utilization optimization per provider." },
            ].map((f, i) => {
              const FIcon = f.icon;
              return (
              <FadeIn key={f.title} delay={i * 0.04}>
                <div className="rounded-xl ring-1 ring-border bg-card px-5 py-4 hover:ring-blue-500/20 transition group h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <FIcon className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition" />
                    <span className="text-[13px] font-semibold">{f.title}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Impact Math */}
      <section className="border-t border-border px-6 py-20 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">The Impact Math</h2>
            <p className="text-[14px] text-muted-foreground mb-10">Measurable improvements that go directly to your bottom line.</p>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { metric: "20% Reduction in No-Shows", impact: "R192K-R480K/yr", desc: "For multi-doctor practice. Predicted gaps filled via overbooking intelligence and waitlist auto-fill." },
              { metric: "15% Reduction in Wait Times", impact: "Higher satisfaction", desc: "Real-time queue management reduces patient frustration and Google review complaints." },
              { metric: "10% Better Capacity Utilization", impact: "R240K/yr additional", desc: "More patients seen per day without extending hours. Staff scheduled to actual demand." },
            ].map((m, i) => (
              <FadeIn key={m.metric} delay={i * 0.1}>
                <div className="rounded-xl ring-1 ring-blue-500/20 bg-blue-500/5 p-6 h-full">
                  <p className="text-[13px] font-semibold mb-2">{m.metric}</p>
                  <p className="text-2xl font-bold text-blue-400 mb-3">{m.impact}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{m.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="border-t border-border px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Qventus-Grade Intelligence at 1/10th the Cost</h2>
            <p className="text-[14px] text-muted-foreground max-w-2xl leading-relaxed mb-10">
              US patient flow companies raised $700M+ combined but built for US hospitals at $50K+/yr. We deliver the same
              predictive intelligence for SA practices — and license our engine as API to any PMS vendor.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead><tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-mono text-muted-foreground text-[10px] uppercase">Vendor</th>
                  <th className="text-center py-3 px-3 font-mono text-muted-foreground text-[10px] uppercase">No-Show AI</th>
                  <th className="text-center py-3 px-3 font-mono text-muted-foreground text-[10px] uppercase">Queue Mgmt</th>
                  <th className="text-center py-3 px-3 font-mono text-muted-foreground text-[10px] uppercase">Capacity AI</th>
                  <th className="text-center py-3 px-3 font-mono text-muted-foreground text-[10px] uppercase">SA Market</th>
                  <th className="text-right py-3 px-4 font-mono text-muted-foreground text-[10px] uppercase">Funding</th>
                </tr></thead>
                <tbody>
                  {[
                    { name: "Patient Flow AI", ns: true, q: true, c: true, sa: true, fund: "Bootstrapped", hl: true },
                    { name: "Qventus", ns: true, q: true, c: true, sa: false, fund: "$300M raised" },
                    { name: "LeanTaaS", ns: true, q: false, c: true, sa: false, fund: "$400M raised" },
                    { name: "GoodX", ns: false, q: false, c: false, sa: true, fund: "40+ years" },
                    { name: "Health Focus", ns: false, q: false, c: false, sa: true, fund: "Optometry" },
                    { name: "Healthbridge", ns: false, q: false, c: false, sa: true, fund: "7K practices" },
                  ].map((r) => (
                    <tr key={r.name} className={`border-b border-border/50 ${r.hl ? "bg-blue-500/5" : ""}`}>
                      <td className={`py-3 px-4 font-medium ${r.hl ? "text-blue-400" : ""}`}>{r.name}</td>
                      {[r.ns, r.q, r.c, r.sa].map((v, j) => (
                        <td key={j} className="text-center py-3 px-3">{v ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <span className="text-muted-foreground">—</span>}</td>
                      ))}
                      <td className="text-right py-3 px-4 text-muted-foreground font-mono text-[10px]">{r.fund}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="mt-8 rounded-xl ring-1 ring-blue-500/20 bg-blue-500/5 px-5 py-4">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                <span className="text-blue-400 font-semibold">Enterprise Licensing:</span> Available as
                <span className="text-foreground font-medium"> direct SaaS</span> for practices,
                <span className="text-foreground font-medium"> prediction API</span> for PMS vendors to embed no-show intelligence, and
                <span className="text-foreground font-medium"> enterprise deployment</span> for hospital groups. We license our prediction engine — not gatekeep it.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Compliance */}
      <section id="compliance" className="border-t border-border px-6 py-20 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <FadeIn><h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-10">Enterprise-Grade Compliance</h2></FadeIn>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { badge: "SAHPRA", desc: "Registered Medical Device Software" },
              { badge: "POPIA", desc: "Full data protection compliance" },
              { badge: "HPCSA", desc: "Health Professions Council aligned" },
              { badge: "AES-256", desc: "Military-grade encryption" },
              { badge: "ISO 27001", desc: "Information security aligned" },
              { badge: "NHI Ready", desc: "National Health Insurance prepared" },
              { badge: "HL7 FHIR R4", desc: "Healthcare interoperability" },
              { badge: "Audit Trail", desc: "Full HPCSA-compliant logging" },
            ].map((b, i) => (
              <FadeIn key={b.badge} delay={i * 0.05}>
                <div className="rounded-xl ring-1 ring-blue-500/20 bg-blue-500/5 p-4 text-center hover:ring-blue-500/40 transition">
                  <p className="text-[13px] font-bold text-blue-400">{b.badge}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{b.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Dr Hampton + VRL */}
      <section className="border-t border-border px-6 py-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <FadeIn>
            <div className="flex items-center gap-2 mb-2">
              <Beaker className="w-4 h-4 text-blue-400" />
              <p className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">Visio Research Labs</p>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">Our Mission: Save Lives Through Intelligence</h2>
            <p className="text-[14px] text-muted-foreground leading-relaxed mb-4">
              VRL is the research arm of VisioCorp — an enterprise AI infrastructure and software group with 100+ products
              and 30+ live in market. Patient Flow AI represents our belief that healthcare operations intelligence
              should be accessible to every practice, not just US hospitals with $50K budgets.
            </p>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              Every no-show is a patient who did not receive care. Every overcrowded waiting room is a practice
              losing patients to competitors. Every idle consultation slot is revenue that never returns. We built
              Patient Flow AI to close these gaps with the same predictive power that $700M-funded US companies use —
              at a price point SA practices can actually afford.
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="rounded-xl ring-1 ring-border bg-card p-6 mb-4">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Founder</p>
              <h3 className="text-xl font-bold mb-1">Dr. David M. Hampton</h3>
              <p className="text-[12px] text-blue-400 font-mono mb-4">CEO, VisioCorp &middot; Founder, Visio Research Labs</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Dr. Hampton leads VisioCorp across 4 organizations and a portfolio of health AI products that cover
                the complete clinical workflow — from patient flow and scheduling, to clinical coding and claims
                validation, to hospital interoperability and enterprise intelligence. These are massive verticals
                that are extraordinarily hard to build, and we did it at enterprise grade.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[{ val: "100+", label: "Products Built" }, { val: "30+", label: "Live in Market" }, { val: "7", label: "Health Products" }].map((s) => (
                <div key={s.label} className="rounded-lg ring-1 ring-border bg-card p-3 text-center">
                  <p className="text-lg font-bold">{s.val}</p>
                  <p className="text-[9px] font-mono text-muted-foreground uppercase">{s.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Connected Ecosystem */}
      <section className="border-t border-border px-6 py-16 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <FadeIn><h2 className="text-lg font-semibold mb-6">Part of the Visio Health Stack</h2></FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { name: "Doctor OS", desc: "AI clinical copilot — 38 tools", url: "https://doctor-os.vercel.app" },
              { name: "VisioCode", desc: "AI clinical coding — 61K records", url: "https://visiocode.vercel.app" },
              { name: "Claims Analyzer", desc: "Pre-submission validation", url: "https://claims-rejection-analyzer.vercel.app" },
              { name: "HealthOps", desc: "White-label practice management", url: "https://healthops-platform.vercel.app" },
            ].map((sys) => (
              <a key={sys.name} href={sys.url} target="_blank" rel="noopener noreferrer"
                className="rounded-lg ring-1 ring-border bg-card px-4 py-3 hover:ring-blue-500/20 transition group flex items-center justify-between">
                <div><p className="text-[13px] font-medium">{sys.name}</p><p className="text-[10px] text-muted-foreground">{sys.desc}</p></div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Optimize Your Patient Flow</h2>
            <p className="text-[14px] text-muted-foreground mb-8">
              No-show prediction. Smart scheduling. Queue management. FlowBot agent.
              Built for SA practices by SA engineers.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/dashboard/chat"><Button className="gap-2"><Bot className="h-4 w-4" /> Talk to FlowBot</Button></Link>
              <a href="mailto:david@visiocorp.co"><Button variant="outline" className="gap-2"><Building2 className="h-4 w-4" /> Enterprise API</Button></a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[11px] font-mono text-muted-foreground">Patient Flow AI v1.0.0</span>
          <span className="text-[11px] text-muted-foreground">A product of <span className="text-foreground font-medium">VisioCorp</span> &middot; Research by <span className="text-blue-400">Visio Research Labs</span></span>
          <span className="text-[10px] text-muted-foreground font-mono">david@visiocorp.co</span>
        </div>
      </footer>
    </div>
  );
}
