import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { getDemoForecast, getDemoPredictions, getDemoFlowSnapshot, getDemoBookings } from "@/lib/demo/seed";
import { cn } from "@/lib/utils";

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  accent,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  accent?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon
          className={cn("h-4 w-4", accent ?? "text-muted-foreground")}
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">{value}</div>
        <div className="flex items-center gap-1 mt-1">
          {trend === "up" && (
            <TrendingUp className="h-3 w-3 text-[var(--color-risk-low)]" />
          )}
          {trend === "down" && (
            <TrendingDown className="h-3 w-3 text-[var(--color-risk-high)]" />
          )}
          {(subtitle || trendLabel) && (
            <p className="text-xs text-muted-foreground">
              {trendLabel ?? subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


function RiskDistribution({
  predictions,
}: {
  predictions: ReturnType<typeof getDemoPredictions>;
}) {
  const counts = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const p of predictions) {
    counts[p.riskLevel]++;
  }
  const total = predictions.length;

  const bars = [
    {
      label: "Low",
      count: counts.low,
      color: "bg-[var(--color-risk-low)]",
    },
    {
      label: "Medium",
      count: counts.medium,
      color: "bg-[var(--color-risk-medium)]",
    },
    {
      label: "High",
      count: counts.high,
      color: "bg-[var(--color-risk-high)]",
    },
    {
      label: "Critical",
      count: counts.critical,
      color: "bg-[var(--color-risk-critical)]",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Risk Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-14">
              {bar.label}
            </span>
            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={cn("h-full rounded-full", bar.color)}
                style={{
                  width: total > 0 ? `${(bar.count / total) * 100}%` : "0%",
                }}
              />
            </div>
            <span className="text-xs font-mono w-6 text-right">
              {bar.count}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FlowSummary({
  flow,
}: {
  flow: ReturnType<typeof getDemoFlowSnapshot>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Live Patient Flow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-flow-waiting)]" />
            <span className="text-sm text-muted-foreground">Waiting</span>
            <span className="ml-auto font-mono font-bold">
              {flow.waitingCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-flow-in-consult)]" />
            <span className="text-sm text-muted-foreground">In Consult</span>
            <span className="ml-auto font-mono font-bold">
              {flow.inConsultationCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-flow-done)]" />
            <span className="text-sm text-muted-foreground">Done</span>
            <span className="ml-auto font-mono font-bold">
              {flow.checkedOutCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-flow-no-show)]" />
            <span className="text-sm text-muted-foreground">No-Show</span>
            <span className="ml-auto font-mono font-bold">
              {flow.noShowCount}
            </span>
          </div>
        </div>
        {flow.blockers.length > 0 && (
          <div className="mt-4 rounded-md border border-[var(--color-risk-high)]/30 bg-[var(--color-risk-high)]/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-[var(--color-risk-high)]" />
              <span className="text-xs font-medium text-[var(--color-risk-high)]">
                Blocker Detected
              </span>
            </div>
            {flow.blockers.map((b, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                {b.patientName}: {b.reason}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardOverview() {
  // TODO: Replace with real API calls when not in demo mode
  const forecast = getDemoForecast();
  const predictions = getDemoPredictions();
  const flow = getDemoFlowSnapshot();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Morning Briefing
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-ZA", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-primary/30 text-primary"
        >
          <Zap className="h-3 w-3 mr-1" />
          DEMO
        </Badge>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Today's Bookings"
          value={forecast.totalBookings}
          subtitle={`${forecast.predictedAttendance} expected to attend`}
          icon={CalendarCheck}
          accent="text-primary"
        />
        <KpiCard
          title="Predicted No-Shows"
          value={forecast.predictedNoShows}
          subtitle={`${forecast.highRiskCount} high-risk flagged`}
          icon={AlertTriangle}
          trend="down"
          accent="text-[var(--color-risk-high)]"
        />
        <KpiCard
          title="At-Risk Revenue"
          value={`R${forecast.atRiskRevenue.toLocaleString()}`}
          subtitle={`R${forecast.recoverableRevenue.toLocaleString()} recoverable via waitlist`}
          icon={TrendingDown}
          accent="text-[var(--color-risk-medium)]"
        />
        <KpiCard
          title="Utilization"
          value={`${forecast.utilizationPct}%`}
          subtitle={`Peak at ${forecast.peakHour}`}
          icon={Activity}
          trend="up"
          accent="text-primary"
        />
      </div>

      {/* Second Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <RiskDistribution predictions={predictions} />
        <FlowSummary flow={flow} />
      </div>

      {/* High-Risk Patients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--color-risk-high)]" />
            High-Risk Bookings Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {predictions
              .filter((p) => p.riskScore >= 50)
              .sort((a, b) => b.riskScore - a.riskScore)
              .map((p) => {
                const booking = getDemoBookingsLookup()[p.bookingId];
                return (
                  <div
                    key={p.bookingId}
                    className="flex items-center justify-between rounded-md border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <RiskBadge level={p.riskLevel} score={p.riskScore} />
                      <div>
                        <p className="text-sm font-medium">
                          {booking?.patientName ?? p.bookingId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking?.service} at{" "}
                          {new Date(p.scheduledAt).toLocaleTimeString("en-ZA", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground max-w-[200px] text-right">
                      {p.explanation}
                    </p>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RiskBadge({
  level,
  score,
}: {
  level: string;
  score: number;
}) {
  const colors: Record<string, string> = {
    low: "bg-[var(--color-risk-low)]/15 text-[var(--color-risk-low)] border-[var(--color-risk-low)]/30",
    medium:
      "bg-[var(--color-risk-medium)]/15 text-[var(--color-risk-medium)] border-[var(--color-risk-medium)]/30",
    high: "bg-[var(--color-risk-high)]/15 text-[var(--color-risk-high)] border-[var(--color-risk-high)]/30",
    critical:
      "bg-[var(--color-risk-critical)]/15 text-[var(--color-risk-critical)] border-[var(--color-risk-critical)]/30",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono font-bold ${colors[level] ?? colors.low}`}
    >
      {score}%
    </span>
  );
}

function getDemoBookingsLookup() {
  const bookings = getDemoBookings();
  const lookup: Record<string, (typeof bookings)[0]> = {};
  for (const b of bookings) {
    lookup[b.id] = b;
  }
  return lookup;
}
