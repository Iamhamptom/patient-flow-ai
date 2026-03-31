"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Bell, Copy, Filter, Info } from "lucide-react";
import { getDemoBookings, getDemoPredictions } from "@/lib/demo/seed";
import type { RiskLevel } from "@/lib/prediction/types";

const riskColors: Record<RiskLevel, string> = {
  low: "bg-[var(--color-risk-low)]/15 text-[var(--color-risk-low)] border-[var(--color-risk-low)]/30",
  medium:
    "bg-[var(--color-risk-medium)]/15 text-[var(--color-risk-medium)] border-[var(--color-risk-medium)]/30",
  high: "bg-[var(--color-risk-high)]/15 text-[var(--color-risk-high)] border-[var(--color-risk-high)]/30",
  critical:
    "bg-[var(--color-risk-critical)]/15 text-[var(--color-risk-critical)] border-[var(--color-risk-critical)]/30",
};

export default function NoShowDashboard() {
  const [filter, setFilter] = useState<string>("all");
  const predictions = getDemoPredictions();
  const bookings = getDemoBookings();

  const bookingMap = Object.fromEntries(bookings.map((b) => [b.id, b]));

  const filtered =
    filter === "all"
      ? predictions
      : predictions.filter((p) => p.riskLevel === filter);

  const sorted = [...filtered].sort((a, b) => b.riskScore - a.riskScore);

  const riskCounts = predictions.reduce(
    (acc, p) => {
      acc[p.riskLevel]++;
      return acc;
    },
    { low: 0, medium: 0, high: 0, critical: 0 } as Record<RiskLevel, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            No-Show Risk Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {predictions.length} bookings scored for{" "}
            {new Date().toLocaleDateString("en-ZA")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Send Reminders
          </Button>
          <Button size="sm">Re-Score All</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-4">
        {(["low", "medium", "high", "critical"] as RiskLevel[]).map(
          (level) => (
            <Card
              key={level}
              className="cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() =>
                setFilter(filter === level ? "all" : level)
              }
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground capitalize">
                    {level}
                  </span>
                  <Badge
                    variant="outline"
                    className={riskColors[level]}
                  >
                    {riskCounts[level]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        {filter !== "all" && (
          <Badge variant="secondary" className="text-xs">
            Showing {filtered.length} of {predictions.length}
          </Badge>
        )}
      </div>

      {/* Predictions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Risk</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Deposit</TableHead>
                <TableHead>Reminder</TableHead>
                <TableHead className="text-right">Explanation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((pred) => {
                const booking = bookingMap[pred.bookingId];
                return (
                  <TableRow key={pred.bookingId}>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono font-bold ${riskColors[pred.riskLevel]}`}
                      >
                        {pred.riskScore}%
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {booking?.patientName ?? "Unknown"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {booking?.service}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {new Date(pred.scheduledAt).toLocaleTimeString(
                        "en-ZA",
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {booking?.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {booking?.depositPaid ? (
                        <span className="text-[var(--color-risk-low)] text-xs">
                          Paid
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          No
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {booking?.reminderSentAt ? (
                        <span className="text-[var(--color-risk-low)] text-xs">
                          Sent
                        </span>
                      ) : (
                        <span className="text-[var(--color-risk-medium)] text-xs">
                          Pending
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent
                          side="left"
                          className="max-w-[250px]"
                        >
                          {pred.explanation}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
