import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Compliance & Security — Patient Flow AI",
  description:
    "How Patient Flow AI protects patient data, complies with POPIA and HPCSA regulations, and ensures AI agent safety in South African healthcare.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-6 py-2.5 border-b border-border/30">
      <span className="text-sm text-muted-foreground w-56 flex-shrink-0">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 h-14">
          <span className="text-sm font-medium tracking-tight font-mono">
            patient-flow-ai
          </span>
          <Badge variant="outline" className="text-xs">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Compliance
          </Badge>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        {/* Title */}
        <div>
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-3">
            Compliance & Security
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            How we protect patient data
            <br />
            and comply with SA regulations.
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">
            Patient Flow AI processes healthcare data in South Africa's
            regulated environment. This page explains our compliance posture,
            data handling practices, AI agent safety controls, and how we
            protect your patients' information.
          </p>
        </div>

        {/* POPIA */}
        <Section title="POPIA Compliance">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Protection of Personal Information Act (POPIA) is South Africa's
            primary data protection legislation. Health data is classified as
            "special personal information" under Section 26 and requires
            additional safeguards. The POPIA Health Regulations came into force
            on 27 February 2026 with no grace period.
          </p>
          <div className="rounded-lg border border-border/50 divide-y divide-border/30">
            <Row
              label="Lawful basis for processing"
              value="Legitimate interest (practice operations) and consent (marketing communications). Consent is tracked per patient with separate opt-in for treatment, data processing, marketing, and research."
            />
            <Row
              label="Data minimisation"
              value="FlowBot only accesses the data needed for each specific tool call. Prediction features are extracted from aggregated booking history, not raw medical records."
            />
            <Row
              label="Consent before marketing"
              value="Campaign sends check POPIA consent status before execution. Patients who have opted out are excluded automatically. Consent is recorded with method (digital/paper/verbal) and timestamp."
            />
            <Row
              label="Data subject rights"
              value="Patients can request access to, correction of, or deletion of their data. Requests are logged and traceable via the audit system."
            />
            <Row
              label="Cross-border transfers"
              value="Patient data is stored in Supabase (AWS eu-west-1 region). AI model calls to Anthropic (US) and Google (US) transmit only anonymised feature vectors for predictions, never raw patient records."
            />
            <Row
              label="Breach notification"
              value="In the event of a data breach, the Information Regulator and affected patients will be notified within 72 hours as required by POPIA Section 22."
            />
            <Row
              label="Information Officer"
              value="Touchline Agency (Pty) Ltd t/a VisioCorp — legal@touchlineagency.co.za"
            />
          </div>
        </Section>

        {/* HPCSA */}
        <Section title="HPCSA — AI in Healthcare">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Health Professions Council of South Africa (HPCSA) published
            Booklet 20 on AI guidelines for healthcare practitioners. Patient
            Flow AI operates strictly within these boundaries.
          </p>
          <div className="rounded-lg border border-border/50 divide-y divide-border/30">
            <Row
              label="AI role"
              value="Decision support ONLY. FlowBot provides predictions, recommendations, and operational insights. It does not make clinical decisions, diagnose, or prescribe."
            />
            <Row
              label="Clinical responsibility"
              value="All clinical decisions remain with the treating practitioner. FlowBot's no-show predictions and scheduling suggestions are administrative, not clinical."
            />
            <Row
              label="Transparency"
              value="Every prediction includes a human-readable explanation of the key risk factors. Model accuracy metrics (precision, recall, F1) are tracked and visible on the analytics dashboard."
            />
            <Row
              label="AI disclaimer"
              value="Displayed on all AI-generated outputs: 'AI suggestions are decision support only. Clinical responsibility remains with the treating practitioner.'"
            />
          </div>
        </Section>

        {/* Agent Safety */}
        <Section title="AI Agent Safety & Controls">
          <p className="text-sm text-muted-foreground leading-relaxed">
            FlowBot is an autonomous AI agent with 45 tools. These controls
            ensure it operates safely within defined boundaries.
          </p>
          <div className="rounded-lg border border-border/50 divide-y divide-border/30">
            <Row
              label="Step limit"
              value="Maximum 15 autonomous steps per request (stopWhen: stepCountIs(15)). Prevents runaway execution."
            />
            <Row
              label="Tool boundaries"
              value="FlowBot can only call tools explicitly defined in its tool map. It cannot access arbitrary APIs, execute system commands, or modify its own configuration."
            />
            <Row
              label="Rate limiting"
              value="All API routes are rate-limited (10-30 requests per minute per IP). Cron routes require CRON_SECRET authentication. Agent routes require VISIO_GATEWAY_KEY."
            />
            <Row
              label="Authentication"
              value="Dashboard access requires session cookie (httpOnly, 24h expiry). Agent API requires bearer token. Cron jobs require secret header. No unauthenticated access to patient data."
            />
            <Row
              label="Audit logging"
              value="Every prediction view, booking creation, notification send, and agent action is logged to pf_audit_log with timestamp, user ID, IP address, and action details."
            />
            <Row
              label="Data provenance"
              value="All data written by FlowBot includes source attribution. Predictions record which model version generated them. Notifications record which channel was used."
            />
            <Row
              label="No data fabrication"
              value="FlowBot queries real data from Supabase for every response. It does not generate synthetic patient data or hallucinate medical information."
            />
            <Row
              label="Self-learning safety"
              value="Model retraining is weekly (cron-scheduled), not continuous. Weights are stored in pf_model_weights with version tracking. Old weights are deactivated, never deleted — enabling rollback."
            />
            <Row
              label="Communication guardrails"
              value="WhatsApp responses are capped at 300 words. Campaign sends check consent. Broadcast is limited to 50 recipients per call. Emergency messages route to 082 911, not to the AI."
            />
            <Row
              label="Agent network isolation"
              value="FlowBot communicates with Steinberg (chairman agent) via agent_comms table with sender/recipient constraints enforced at database level. Only registered agents can send or receive."
            />
          </div>
        </Section>

        {/* Data Architecture */}
        <Section title="Data Architecture & Storage">
          <div className="rounded-lg border border-border/50 divide-y divide-border/30">
            <Row
              label="Database"
              value="Supabase (PostgreSQL) — hosted on AWS eu-west-1. All data encrypted at rest (AES-256) and in transit (TLS 1.3)."
            />
            <Row
              label="Table isolation"
              value="Patient Flow AI uses pf_ prefixed tables (19 tables). HealthOps data is in ho_ prefixed tables (20 tables). Cross-table access is read-only for prediction features."
            />
            <Row
              label="Practice isolation"
              value="All queries are scoped by practice_id. A practice can only see its own patients, bookings, and predictions. Row-level security enforced at the application layer."
            />
            <Row
              label="Secrets management"
              value="All API keys and credentials stored as Vercel encrypted environment variables. Never committed to source code. Rotatable without redeployment."
            />
            <Row
              label="Session management"
              value="httpOnly cookies with 24-hour expiry. No patient data stored in cookies — only practice context. Sessions are not shared across practices."
            />
            <Row
              label="AI model data"
              value="Prediction features sent to Claude/Gemini are aggregated statistics (no-show rate, day of week, deposit status) — not raw patient records. No PII is sent to LLM providers."
            />
          </div>
        </Section>

        {/* What FlowBot Cannot Do */}
        <Section title="What FlowBot Cannot Do">
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            These are hard boundaries enforced by architecture, not just policy.
          </p>
          <div className="space-y-2">
            {[
              "Cannot access medical records, prescriptions, or clinical notes — only booking/scheduling data",
              "Cannot diagnose, prescribe medication, or make clinical recommendations",
              "Cannot send communications without POPIA consent verification",
              "Cannot access data from practices other than the authenticated practice",
              "Cannot modify its own tool definitions, system prompt, or model configuration",
              "Cannot execute arbitrary code, access the filesystem, or make unconstrained API calls",
              "Cannot override the 15-step execution limit",
              "Cannot delete patient records — only create and update",
              "Cannot send emergency medical advice — routes emergencies to 082 911",
              "Cannot operate without audit logging — every action is recorded",
            ].map((item, i) => (
              <div key={i} className="flex gap-3 py-1.5">
                <span className="text-xs font-mono text-muted-foreground/50 w-5 flex-shrink-0 pt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Third-Party Integrations */}
        <Section title="Third-Party Integration Security">
          <div className="rounded-lg border border-border/50 divide-y divide-border/30">
            <Row
              label="Twilio (WhatsApp/SMS)"
              value="HMAC-SHA1 signature validation on all inbound webhooks. API credentials stored as encrypted environment variables. Messages sent via Twilio's compliant infrastructure."
            />
            <Row
              label="Resend (Email)"
              value="API key authentication. Emails sent from verified domain with DKIM/SPF/DMARC. No patient data in email subject lines."
            />
            <Row
              label="Anthropic (Claude)"
              value="API calls authenticated via key. No patient PII sent — only aggregated feature vectors for predictions and natural language commands for agent operations."
            />
            <Row
              label="Google (Gemini)"
              value="Used for individual booking scoring. Receives anonymised feature objects (15 numerical/categorical fields). No patient names, phone numbers, or medical record content."
            />
            <Row
              label="AIRIA (MCP Gateway)"
              value="Enterprise AI orchestration platform with governance layer. API key authenticated. Provides secure connectors to Google, Microsoft, and 1,000+ enterprise services. SOC 2 compliant."
            />
            <Row
              label="Vercel (Hosting)"
              value="SOC 2 Type II compliant. DDoS protection, WAF, and edge network security. Environment variables encrypted at rest. No patient data in build logs."
            />
            <Row
              label="Supabase (Database)"
              value="SOC 2 Type II compliant. PostgreSQL with row-level security. Data encrypted at rest and in transit. Hosted in AWS eu-west-1. Daily backups with point-in-time recovery."
            />
          </div>
        </Section>

        {/* Incident Response */}
        <Section title="Incident Response">
          <div className="rounded-lg border border-border/50 divide-y divide-border/30">
            <Row
              label="Detection"
              value="Audit logs monitored for anomalous access patterns. Rate limiting prevents brute-force attacks. Failed authentication attempts are logged."
            />
            <Row
              label="Containment"
              value="API keys can be rotated immediately via Vercel dashboard. Individual practice sessions can be invalidated. Agent execution can be paused by disabling CRON_SECRET."
            />
            <Row
              label="Notification"
              value="Information Regulator and affected data subjects notified within 72 hours (POPIA s22). HPCSA notified if clinical data is involved."
            />
            <Row
              label="Recovery"
              value="Supabase point-in-time recovery. Model weights versioned for rollback. All code changes tracked in Git with signed commits."
            />
          </div>
        </Section>

        {/* Regulatory Summary */}
        <Section title="Regulatory Framework Summary">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                reg: "POPIA",
                desc: "Protection of Personal Information Act",
                status: "Compliant",
                detail: "Consent tracking, data minimisation, cross-border disclosure, breach notification",
              },
              {
                reg: "HPCSA Booklet 20",
                desc: "AI Guidelines for Healthcare",
                status: "Compliant",
                detail: "Decision support only, clinical responsibility with practitioner, transparency",
              },
              {
                reg: "CPA",
                desc: "Consumer Protection Act",
                status: "Compliant",
                detail: "Transparent pricing, service description, AI disclosure",
              },
              {
                reg: "ECTA s43",
                desc: "Electronic Communications Act",
                status: "Compliant",
                detail: "Company information disclosed, electronic consent valid",
              },
            ].map((r) => (
              <div
                key={r.reg}
                className="rounded-lg border border-border/50 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.reg}</span>
                  <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                    {r.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
                <p className="text-xs text-muted-foreground/70">{r.detail}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Contact */}
        <div className="border-t border-border/50 pt-8">
          <p className="text-xs text-muted-foreground">
            For compliance inquiries, data subject requests, or security
            concerns:
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            <strong>Information Officer</strong>: Touchline Agency (Pty) Ltd t/a
            VisioCorp
          </p>
          <p className="text-xs text-muted-foreground">
            Email: legal@touchlineagency.co.za
          </p>
          <p className="text-xs text-muted-foreground/50 mt-4 font-mono">
            patient-flow-ai v0.3.0 — Last updated April 2026
          </p>
        </div>
      </div>
    </div>
  );
}
