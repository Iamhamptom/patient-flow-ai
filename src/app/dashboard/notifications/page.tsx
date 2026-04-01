"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageSquare, Mail, Phone } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Delivery history — WhatsApp, SMS, and email
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">WhatsApp</span>
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xl font-mono font-bold">0</p>
            <p className="text-[10px] text-muted-foreground">Sent today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Email</span>
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xl font-mono font-bold">0</p>
            <p className="text-[10px] text-muted-foreground">Sent today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">SMS</span>
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xl font-mono font-bold">0</p>
            <p className="text-[10px] text-muted-foreground">Sent today</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No notifications sent yet. Connect Twilio for WhatsApp/SMS and Resend for email.
          </p>
          <p className="text-[10px] text-muted-foreground/50 text-center">
            Ask FlowBot: "Send a reminder to all unconfirmed bookings" or "Check notification history"
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
