"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CalendarClock, Clock, Sparkles, User } from "lucide-react";
import { getDemoDoctorPatterns, getDemoBookings } from "@/lib/demo/seed";

export default function SchedulePage() {
  const patterns = getDemoDoctorPatterns();
  const bookings = getDemoBookings();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Schedule Optimizer
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-optimized scheduling based on doctor consultation patterns
          </p>
        </div>
        <Button size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          Optimize Today
        </Button>
      </div>

      {/* Doctor Pattern Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {patterns.map((doc) => (
          <Card key={doc.doctorName}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  {doc.doctorName}
                </CardTitle>
                <Badge variant="secondary" className="text-xs font-mono">
                  {doc.sampleSize} consultations
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Duration Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="text-lg font-mono font-bold">
                    {doc.avgDuration}m
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Median</p>
                  <p className="text-lg font-mono font-bold">
                    {doc.medianDuration}m
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">P75</p>
                  <p className="text-lg font-mono font-bold">
                    {doc.p75Duration}m
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">P95</p>
                  <p className="text-lg font-mono font-bold text-[var(--color-risk-medium)]">
                    {doc.p95Duration}m
                  </p>
                </div>
              </div>

              <Separator />

              {/* Time of Day */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Morning:</span>
                  <span className="text-sm font-mono font-medium">
                    {doc.morningAvg ?? "N/A"}m
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Afternoon:</span>
                  <span className="text-sm font-mono font-medium">
                    {doc.afternoonAvg ?? "N/A"}m
                  </span>
                </div>
              </div>

              {/* Day of Week */}
              <div className="flex gap-1">
                {Object.entries(doc.dayPatterns).map(([day, avg]) => (
                  <div
                    key={day}
                    className="flex-1 rounded-md bg-secondary p-2 text-center"
                  >
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {day.slice(0, 3)}
                    </p>
                    <p className="text-xs font-mono font-bold">
                      {Math.round(avg)}m
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {bookings.map((b) => {
              const time = new Date(b.scheduledAt).toLocaleTimeString(
                "en-ZA",
                { hour: "2-digit", minute: "2-digit" }
              );
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-accent/50 transition-colors"
                >
                  <span className="text-sm font-mono w-14 text-muted-foreground">
                    {time}
                  </span>
                  <div className="h-6 w-0.5 rounded-full bg-primary/30" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{b.patientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.service}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {b.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
