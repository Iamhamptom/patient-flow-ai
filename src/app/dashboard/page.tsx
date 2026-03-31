"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { usePredictions, useFlowBoard, useForecast } from "@/lib/hooks/use-practice-data";
import type { RiskLevel } from "@/lib/prediction/types";

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  loading,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  accent?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", accent ?? "text-muted-foreground")} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold font-mono">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RiskBadge({ level, score }: { level: string; score: number }) {
  const colors: Record<string, string> = {
    low: "bg-[var(--color-risk-low)]/15 text-[var(--color-risk-low)] border-[var(--color-risk-low)]/30",
    medium: "bg-[var(--color-risk-medium)]/15 text-[var(--color-risk-medium)] border-[var(--color-risk-medium)]/30",
    high: "bg-[var(--color-risk-high)]/15 text-[var(--color-risk-high)] border-[var(--color-risk-high)]/30",
    critical: "bg-[var(--color-risk-critical)]/15 text-[var(--color-risk-critical)] border-[var(--color-risk-critical)]/30",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono font-bold", colors[level] ?? colors.low)}>
      {score}%
    </span>
  );
}

export default function DashboardOverview() {
  const today = new Date().toISOString().split("T")[0];
  const { data: predData, loading: predLoading } = usePredictions(today);
  const { data: flow, loading: flowLoading } = useFlowBoard();
  const { data: forecast, loading: forecastLoading } = useForecast(today);

  const predictions = predData?.predictions ?? [];
  const highRisk = predictions.filter((p) => Number(p.risk_score) >= 50);

  const riskCounts = predictions.reduce(
    (acc, p) => { acc[p.risk_level as RiskLevel]++; return acc; },
    { low: 0, medium: 0, high: 0, critical: 0 } as Record<RiskLevel, number>
  );

  const anyLoading = predLoading || flowLoading || forecastLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Morning Briefing</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-ZA", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary">
          <Zap className="h-3 w-3 mr-1" />
          {anyLoading ? "Loading..." : "LIVE"}
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Today's Bookings"
          value={forecast?.totalBookings ?? 0}
          subtitle={`${forecast?.predictedAttendance ?? 0} expected to attend`}
          icon={CalendarCheck}
          accent="text-primary"
          loading={forecastLoading}
        />
        <KpiCard
          title="Predicted No-Shows"
          value={forecast?.predictedNoShows ?? 0}
          subtitle={`${forecast?.highRiskCount ?? 0} high-risk flagged`}
          icon={AlertTriangle}
          accent="text-[var(--color-risk-high)]"
          loading={forecastLoading}
        />
        <KpiCard
          title="At-Risk Revenue"
          value={`R${(forecast?.atRiskRevenue ?? 0).toLocaleString()}`}
          subtitle={`R${(forecast?.recoverableRevenue ?? 0).toLocaleString()} recoverable`}
          icon={TrendingDown}
          accent="text-[var(--color-risk-medium)]"
          loading={forecastLoading}
        />
        <KpiCard
          title="Utilization"
          value={`${forecast?.utilizationPct ?? 0}%`}
          subtitle={forecast?.peakHour ? `Peak at ${forecast.peakHour}` : undefined}
          icon={Activity}
          accent="text-primary"
          loading={forecastLoading}
        />
      </div>

      {/* Risk + Flow */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {predLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)
            ) : (
              (["low", "medium", "high", "critical"] as RiskLevel[]).map((level) => (
                <div key={level} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-14 capitalize">{level}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", {
                        "bg-[var(--color-risk-low)]": level === "low",
                        "bg-[var(--color-risk-medium)]": level === "medium",
                        "bg-[var(--color-risk-high)]": level === "high",
                        "bg-[var(--color-risk-critical)]": level === "critical",
                      })}
                      style={{ width: predictions.length > 0 ? `${(riskCounts[level] / predictions.length) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-xs font-mono w-6 text-right">{riskCounts[level]}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Live Patient Flow</CardTitle>
          </CardHeader>
          <CardContent>
            {flowLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : flow ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Waiting", count: flow.waitingCount, color: "bg-[var(--color-flow-waiting)]" },
                    { label: "In Consult", count: flow.inConsultationCount, color: "bg-[var(--color-flow-in-consult)]" },
                    { label: "Done", count: flow.checkedOutCount, color: "bg-[var(--color-flow-done)]" },
                    { label: "No-Show", count: flow.noShowCount, color: "bg-[var(--color-flow-no-show)]" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className={cn("h-2.5 w-2.5 rounded-full", item.color)} />
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="ml-auto font-mono font-bold">{item.count}</span>
                    </div>
                  ))}
                </div>
                {flow.blockers.length > 0 && (
                  <div className="mt-4 rounded-md border border-[var(--color-risk-high)]/30 bg-[var(--color-risk-high)]/5 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-[var(--color-risk-high)]" />
                      <span className="text-xs font-medium text-[var(--color-risk-high)]">Blocker Detected</span>
                    </div>
                    {flow.blockers.map((b, i) => (
                      <p key={i} className="text-xs text-muted-foreground">{b.patientName}: {b.reason}</p>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No flow data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* High-Risk Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--color-risk-high)]" />
            High-Risk Bookings Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          {predLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : highRisk.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {predictions.length === 0
                ? "No predictions yet — run batch scoring first"
                : "No high-risk bookings today"}
            </p>
          ) : (
            <div className="space-y-2">
              {highRisk
                .sort((a, b) => Number(b.risk_score) - Number(a.risk_score))
                .map((p) => (
                  <div key={p.booking_id} className="flex items-center justify-between rounded-md border border-border p-3">
                    <div className="flex items-center gap-3">
                      <RiskBadge level={p.risk_level} score={Number(p.risk_score)} />
                      <div>
                        <p className="text-sm font-medium">{p.booking_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.scheduled_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground max-w-[250px] text-right">{p.explanation}</p>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
