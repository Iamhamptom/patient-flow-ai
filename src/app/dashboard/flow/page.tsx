"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Stethoscope,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { getDemoFlowSnapshot } from "@/lib/demo/seed";

interface FlowColumn {
  title: string;
  icon: React.ElementType;
  count: number;
  color: string;
  dotColor: string;
  patients: { name: string; time: string; detail?: string }[];
}

export default function FlowBoard() {
  const flow = getDemoFlowSnapshot();

  const columns: FlowColumn[] = [
    {
      title: "Waiting",
      icon: Clock,
      count: flow.waitingCount,
      color: "text-[var(--color-flow-waiting)]",
      dotColor: "bg-[var(--color-flow-waiting)]",
      patients: [
        { name: "Thandi Mokoena", time: "12m", detail: "General Consultation" },
        { name: "Bongani Mthembu", time: "8m", detail: "Chronic Med Review" },
        { name: "Nomvula Mabaso", time: "3m", detail: "Follow-up" },
      ],
    },
    {
      title: "In Consultation",
      icon: Stethoscope,
      count: flow.inConsultationCount,
      color: "text-[var(--color-flow-in-consult)]",
      dotColor: "bg-[var(--color-flow-in-consult)]",
      patients: [
        {
          name: "Sipho Ndlovu",
          time: "18m",
          detail: "With Dr. Nkosi",
        },
        {
          name: "Nokuthula Zulu",
          time: "25m",
          detail: "With Dr. van der Merwe",
        },
      ],
    },
    {
      title: "Done Today",
      icon: CheckCircle2,
      count: flow.checkedOutCount,
      color: "text-[var(--color-flow-done)]",
      dotColor: "bg-[var(--color-flow-done)]",
      patients: [
        { name: "Zanele Dlamini", time: "09:45", detail: "Checked out" },
        { name: "Palesa Molefe", time: "10:15", detail: "Checked out" },
        { name: "Lerato Khumalo", time: "10:50", detail: "Checked out" },
        { name: "Andile Sithole", time: "11:20", detail: "Checked out" },
      ],
    },
    {
      title: "No-Show",
      icon: XCircle,
      count: flow.noShowCount,
      color: "text-[var(--color-flow-no-show)]",
      dotColor: "bg-[var(--color-flow-no-show)]",
      patients: [
        { name: "Themba Ngcobo", time: "11:30", detail: "Never arrived" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Patient Flow Board
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time view — auto-refreshes every 30s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Avg wait:</span>
            <span className="font-mono font-bold">
              {flow.avgWaitMinutes}m
            </span>
          </div>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Longest:</span>
            <span className="font-mono font-bold text-[var(--color-risk-medium)]">
              {flow.longestWaitMinutes}m
            </span>
          </div>
        </div>
      </div>

      {/* Flow arrows header */}
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Badge variant="outline" className="text-xs">
          Scheduled
        </Badge>
        <ArrowRight className="h-3 w-3" />
        <Badge variant="outline" className="text-xs border-[var(--color-flow-waiting)]/30 text-[var(--color-flow-waiting)]">
          Waiting
        </Badge>
        <ArrowRight className="h-3 w-3" />
        <Badge variant="outline" className="text-xs border-[var(--color-flow-in-consult)]/30 text-[var(--color-flow-in-consult)]">
          In Consultation
        </Badge>
        <ArrowRight className="h-3 w-3" />
        <Badge variant="outline" className="text-xs border-[var(--color-flow-done)]/30 text-[var(--color-flow-done)]">
          Done
        </Badge>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4">
        {columns.map((col) => (
          <div key={col.title} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <col.icon className={`h-4 w-4 ${col.color}`} />
                <span className="text-sm font-medium">{col.title}</span>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {col.count}
              </Badge>
            </div>
            <div className="space-y-2">
              {col.patients.map((patient, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${col.dotColor}`}
                        />
                        <span className="text-sm font-medium">
                          {patient.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">
                        {patient.time}
                      </span>
                    </div>
                    {patient.detail && (
                      <p className="text-xs text-muted-foreground mt-1 ml-4">
                        {patient.detail}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {col.patients.length === 0 && (
                <div className="rounded-md border border-dashed border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    No patients
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Blockers */}
      {flow.blockers.length > 0 && (
        <Card className="border-[var(--color-risk-high)]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-[var(--color-risk-high)]">
              <AlertTriangle className="h-4 w-4" />
              Active Blockers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {flow.blockers.map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md bg-[var(--color-risk-high)]/5 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{b.patientName}</p>
                  <p className="text-xs text-muted-foreground">{b.reason}</p>
                </div>
                <Badge
                  variant="outline"
                  className="border-[var(--color-risk-high)]/30 text-[var(--color-risk-high)] font-mono"
                >
                  {b.minutesBlocked}m blocked
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
