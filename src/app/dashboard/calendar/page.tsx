"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";

interface Slot {
  time: string;
  available: boolean;
}

export default function CalendarPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [date] = useState(new Date().toISOString().split("T")[0]);
  const [available, setAvailable] = useState(0);

  useEffect(() => {
    fetch(`/api/calendar?date=${date}&practiceId=netcare-primary-001`)
      .then((r) => r.json())
      .then((d) => {
        setSlots(d.slots ?? []);
        setAvailable(d.available ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${available} slots available for ${date}`}
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono">{date}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Available Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Closed today</p>
          ) : (
            <div className="grid grid-cols-6 gap-2">
              {slots.map((slot) => (
                <div
                  key={slot.time}
                  className={`text-center rounded-md border px-2 py-2 text-xs font-mono ${
                    slot.available
                      ? "border-border/50 text-foreground hover:bg-card cursor-pointer"
                      : "border-border/20 text-muted-foreground/30 line-through"
                  }`}
                >
                  {slot.time}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-[10px] text-muted-foreground/50">
        Ask FlowBot: "What slots are available tomorrow?" or "Book 10:30 for Thandi"
      </p>
    </div>
  );
}
