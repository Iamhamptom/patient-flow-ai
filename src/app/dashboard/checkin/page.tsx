"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Clock, Stethoscope, CheckCircle2, XCircle, UserCheck } from "lucide-react";
import { useFlowBoard } from "@/lib/hooks/use-practice-data";

export default function CheckInPage() {
  const { data: flow, loading } = useFlowBoard();

  const columns = [
    { title: "Waiting", count: flow?.waitingCount ?? 0, icon: Clock, color: "text-[var(--color-flow-waiting)]" },
    { title: "In Consultation", count: flow?.inConsultationCount ?? 0, icon: Stethoscope, color: "text-[var(--color-flow-in-consult)]" },
    { title: "Done", count: flow?.checkedOutCount ?? 0, icon: CheckCircle2, color: "text-[var(--color-flow-done)]" },
    { title: "No-Show", count: flow?.noShowCount ?? 0, icon: XCircle, color: "text-[var(--color-flow-no-show)]" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Check-In</h1>
          <p className="text-sm text-muted-foreground">
            Reception view — manage patient flow through the practice
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <UserCheck className="h-3.5 w-3.5" />
          Quick Check-In
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
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
      )}

      {flow?.blockers && flow.blockers.length > 0 && (
        <Card className="border-[var(--color-risk-high)]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-risk-high)]">Blockers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {flow.blockers.map((b, i) => (
              <div key={i} className="flex items-center justify-between rounded-md bg-[var(--color-risk-high)]/5 p-3">
                <div>
                  <p className="text-sm font-medium">{b.patientName}</p>
                  <p className="text-xs text-muted-foreground">{b.reason}</p>
                </div>
                <Badge variant="outline" className="font-mono text-xs">{b.minutesBlocked}m</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">FlowBot Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-2">
            {[
              "Check in Thandi Mkhize",
              "Move Sipho to in consultation",
              "Check out Nokuthula",
              "Import today's bookings to check-in",
              "Who's been waiting longest?",
              "Mark Themba as no-show",
            ].map((cmd) => (
              <div key={cmd} className="text-xs font-mono text-muted-foreground border border-border/30 rounded-md px-3 py-2">
                {cmd}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
