"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFlowBoard } from "@/lib/hooks/use-practice-data";
import { useState, useEffect } from "react";

export default function FlowBoard() {
  const { data: flow, loading, error } = useFlowBoard();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      window.location.reload();
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No flow data available</p>
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      </div>
    );
  }

  const columns = [
    {
      title: "Waiting",
      icon: Clock,
      count: flow.waitingCount,
      color: "text-[var(--color-flow-waiting)]",
      dotColor: "bg-[var(--color-flow-waiting)]",
    },
    {
      title: "In Consultation",
      icon: Stethoscope,
      count: flow.inConsultationCount,
      color: "text-[var(--color-flow-in-consult)]",
      dotColor: "bg-[var(--color-flow-in-consult)]",
    },
    {
      title: "Done Today",
      icon: CheckCircle2,
      count: flow.checkedOutCount,
      color: "text-[var(--color-flow-done)]",
      dotColor: "bg-[var(--color-flow-done)]",
    },
    {
      title: "No-Show",
      icon: XCircle,
      count: flow.noShowCount,
      color: "text-[var(--color-flow-no-show)]",
      dotColor: "bg-[var(--color-flow-no-show)]",
    },
  ];

  const totalPatients =
    flow.waitingCount + flow.inConsultationCount + flow.checkedOutCount + flow.noShowCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patient Flow Board</h1>
          <p className="text-sm text-muted-foreground">
            Real-time view — {totalPatients} patients today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Avg wait:</span>
            <span className="font-mono font-bold">{flow.avgWaitMinutes}m</span>
          </div>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Longest:</span>
            <span className="font-mono font-bold text-[var(--color-risk-medium)]">
              {flow.longestWaitMinutes}m
            </span>
          </div>
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            <RefreshCw className="h-3 w-3 mr-1" />
            LIVE
          </Badge>
        </div>
      </div>

      {/* Flow arrows */}
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Badge variant="outline" className="text-xs">Scheduled</Badge>
        <ArrowRight className="h-3 w-3" />
        <Badge variant="outline" className="text-xs border-[var(--color-flow-waiting)]/30 text-[var(--color-flow-waiting)]">Waiting</Badge>
        <ArrowRight className="h-3 w-3" />
        <Badge variant="outline" className="text-xs border-[var(--color-flow-in-consult)]/30 text-[var(--color-flow-in-consult)]">In Consultation</Badge>
        <ArrowRight className="h-3 w-3" />
        <Badge variant="outline" className="text-xs border-[var(--color-flow-done)]/30 text-[var(--color-flow-done)]">Done</Badge>
      </div>

      {/* Kanban Counts */}
      <div className="grid grid-cols-4 gap-4">
        {columns.map((col) => (
          <Card key={col.title}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <col.icon className={`h-4 w-4 ${col.color}`} />
                  <span className="text-sm font-medium">{col.title}</span>
                </div>
                <span className="text-2xl font-mono font-bold">{col.count}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Blockers */}
      {flow.blockers.length > 0 && (
        <Card className="border-[var(--color-risk-high)]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-[var(--color-risk-high)]">
              <AlertTriangle className="h-4 w-4" />
              Active Blockers ({flow.blockers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {flow.blockers.map((b, i) => (
              <div key={i} className="flex items-center justify-between rounded-md bg-[var(--color-risk-high)]/5 p-3">
                <div>
                  <p className="text-sm font-medium">{b.patientName}</p>
                  <p className="text-xs text-muted-foreground">{b.reason}</p>
                </div>
                <Badge variant="outline" className="border-[var(--color-risk-high)]/30 text-[var(--color-risk-high)] font-mono">
                  {b.minutesBlocked}m
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {totalPatients === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No check-ins today yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Patients will appear here as they check in at the practice
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
