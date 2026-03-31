import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const demoReminders = [
  {
    id: "r-001",
    patientName: "Lerato Khumalo",
    channel: "whatsapp",
    riskScore: 78,
    status: "sent",
    sentAt: "2026-03-31T06:30:00",
    message: "Reminder: Your appointment is tomorrow at 09:30. Please confirm by replying YES.",
  },
  {
    id: "r-002",
    patientName: "Themba Ngcobo",
    channel: "whatsapp",
    riskScore: 85,
    status: "sent",
    sentAt: "2026-03-31T06:30:00",
    message: "Important: You have an appointment at 11:30. As a new patient, please arrive 15 minutes early.",
  },
  {
    id: "r-003",
    patientName: "Andile Sithole",
    channel: "sms",
    riskScore: 62,
    status: "delivered",
    sentAt: "2026-03-31T06:35:00",
    message: "Reminder: Appointment at 14:00 today. Reply CONFIRM to confirm.",
  },
];

export default function RemindersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Smart Reminders
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-triggered reminders for high-risk bookings
          </p>
        </div>
        <Button size="sm">
          <Send className="h-4 w-4 mr-2" />
          Send All Pending
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Sent Today</span>
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-mono font-bold mt-1">3</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Confirmed</span>
              <CheckCircle2 className="h-4 w-4 text-[var(--color-risk-low)]" />
            </div>
            <p className="text-2xl font-mono font-bold mt-1">1</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">No Response</span>
              <MessageSquare className="h-4 w-4 text-[var(--color-risk-medium)]" />
            </div>
            <p className="text-2xl font-mono font-bold mt-1">2</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Recent Reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {demoReminders.map((r) => (
            <div
              key={r.id}
              className="flex items-start gap-3 rounded-md border border-border p-3"
            >
              <div className="flex-shrink-0 mt-0.5">
                <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono font-bold bg-[var(--color-risk-high)]/15 text-[var(--color-risk-high)] border-[var(--color-risk-high)]/30">
                  {r.riskScore}%
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{r.patientName}</p>
                  <Badge variant="outline" className="text-xs">
                    {r.channel}
                  </Badge>
                  <Badge
                    variant={r.status === "delivered" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {r.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {r.message}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono mt-1">
                  {new Date(r.sentAt).toLocaleTimeString("en-ZA")}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
