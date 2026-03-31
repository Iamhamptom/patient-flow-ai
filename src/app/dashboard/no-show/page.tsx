"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Bell, Filter, Info, Loader2, Sparkles } from "lucide-react";
import { usePredictions, PRACTICE_ID_DEFAULT } from "@/lib/hooks/use-practice-data";
import type { RiskLevel } from "@/lib/prediction/types";

const riskColors: Record<RiskLevel, string> = {
  low: "bg-[var(--color-risk-low)]/15 text-[var(--color-risk-low)] border-[var(--color-risk-low)]/30",
  medium: "bg-[var(--color-risk-medium)]/15 text-[var(--color-risk-medium)] border-[var(--color-risk-medium)]/30",
  high: "bg-[var(--color-risk-high)]/15 text-[var(--color-risk-high)] border-[var(--color-risk-high)]/30",
  critical: "bg-[var(--color-risk-critical)]/15 text-[var(--color-risk-critical)] border-[var(--color-risk-critical)]/30",
};

export default function NoShowDashboard() {
  const [filter, setFilter] = useState<string>("all");
  const [scoring, setScoring] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const { data, loading, error } = usePredictions(today);

  const predictions = data?.predictions ?? [];
  const filtered = filter === "all" ? predictions : predictions.filter((p) => p.risk_level === filter);
  const sorted = [...filtered].sort((a, b) => Number(b.risk_score) - Number(a.risk_score));

  const riskCounts = predictions.reduce(
    (acc, p) => { acc[p.risk_level as RiskLevel]++; return acc; },
    { low: 0, medium: 0, high: 0, critical: 0 } as Record<RiskLevel, number>
  );

  async function handleBatchScore() {
    setScoring(true);
    try {
      await fetch("/api/predictions/batch", { method: "POST", body: JSON.stringify({ practiceId: PRACTICE_ID_DEFAULT, date: today }) });
      window.location.reload();
    } finally {
      setScoring(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">No-Show Risk Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${predictions.length} bookings scored for ${today}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Bell className="h-4 w-4 mr-2" />Send Reminders
          </Button>
          <Button size="sm" onClick={handleBatchScore} disabled={scoring}>
            {scoring ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Score All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-4">
        {(["low", "medium", "high", "critical"] as RiskLevel[]).map((level) => (
          <Card
            key={level}
            className="cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => setFilter(filter === level ? "all" : level)}
          >
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground capitalize">{level}</span>
                {loading ? <Skeleton className="h-5 w-8" /> : (
                  <Badge variant="outline" className={riskColors[level]}>{riskCounts[level]}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter by risk" /></SelectTrigger>
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                {predictions.length === 0 ? "No predictions yet — click \"Score All\" to batch score today's bookings" : "No bookings match this filter"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Risk</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Explanation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((pred) => (
                  <TableRow key={pred.booking_id}>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono font-bold ${riskColors[pred.risk_level as RiskLevel]}`}>
                        {Number(pred.risk_score).toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell className="font-medium font-mono text-sm">{pred.booking_id}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {new Date(pred.scheduled_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{pred.model_version}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[280px]">{pred.explanation}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
