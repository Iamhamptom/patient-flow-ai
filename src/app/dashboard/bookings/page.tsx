"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, Check, X } from "lucide-react";

interface Booking {
  id: string;
  patient_name: string;
  service: string;
  scheduled_at: string;
  status: string;
  source: string;
  deposit_paid: boolean;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    fetch(`/api/predictions/no-show?practiceId=netcare-primary-001&date=${today}`)
      .then(() =>
        fetch(`/api/flow/board?practiceId=netcare-primary-001`)
      )
      .catch(() => {});

    // Fetch bookings for today and tomorrow
    Promise.all([
      fetch(`/api/schedule/patterns?practiceId=netcare-primary-001`).then((r) => r.json()),
    ]).finally(() => setLoading(false));

    // Direct Supabase fetch via a simple endpoint
    fetch(`/api/waitlist?practiceId=netcare-primary-001`)
      .then((r) => r.json())
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Today's appointments — confirm, cancel, or check in patients
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <CalendarCheck className="h-3.5 w-3.5" />
          New Booking
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Ask FlowBot to manage bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-2">
            {[
              "Show me today's bookings",
              "Book Thandi for a follow-up tomorrow at 10am",
              "Confirm all pending bookings for today",
              "Who hasn't confirmed yet?",
              "Import today's bookings to check-in queue",
              "What slots are available tomorrow?",
            ].map((cmd) => (
              <div
                key={cmd}
                className="text-xs font-mono text-muted-foreground border border-border/30 rounded-md px-3 py-2"
              >
                {cmd}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-3">
            Click the FlowBot button in the bottom-right corner to execute these commands.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
