"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Bot, Heart, Mail, MessageSquare, Repeat, Send, Users,
} from "lucide-react";
import { usePracticeData } from "@/lib/hooks/use-practice-data";

export default function EngagementHub() {
  const { data, loading } = usePracticeData<{
    activeSequences: number;
    totalCampaigns: number;
    unreadEmails: number;
    activeEnrollments: number;
    pendingRecalls: number;
  }>("/api/engagement/analytics");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patient Engagement</h1>
          <p className="text-sm text-muted-foreground">
            Automated sequences, campaigns, recalls, and communications
          </p>
        </div>
        <Link href="/dashboard/chat">
          <Button size="sm" className="gap-1.5">
            <Bot className="h-3.5 w-3.5" />
            Ask FlowBot
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Active Sequences", value: data?.activeSequences, icon: Repeat },
          { label: "Enrollments", value: data?.activeEnrollments, icon: Users },
          { label: "Campaigns", value: data?.totalCampaigns, icon: Send },
          { label: "Unread Emails", value: data?.unreadEmails, icon: Mail },
          { label: "Pending Recalls", value: data?.pendingRecalls, icon: Heart },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
                <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              {loading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-xl font-mono font-bold">{kpi.value ?? 0}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Sequences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Automated patient journeys — post-surgery follow-up, chronic care
              reminders, medication adherence.
            </p>
            <p className="text-xs text-muted-foreground">
              Ask FlowBot: <span className="font-mono">"Create a post-surgery follow-up sequence"</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Send className="h-4 w-4" />
              Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Bulk outreach — vaccination drives, screening reminders, practice
              announcements. POPIA consent checked automatically.
            </p>
            <p className="text-xs text-muted-foreground">
              Ask FlowBot: <span className="font-mono">"Send a flu vaccination campaign to all patients"</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Chronic Care
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Identify patients with chronic conditions overdue for follow-up.
              Revenue recovery from missed appointments.
            </p>
            <p className="text-xs text-muted-foreground">
              Ask FlowBot: <span className="font-mono">"Show me chronic care gaps"</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* What FlowBot Can Do */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            FlowBot Engagement Commands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-2">
            {[
              "Create a post-surgery follow-up sequence with 3 WhatsApp messages",
              "Enroll Thandi Mkhize in the chronic care reminder sequence",
              "Show me all overdue patient recalls",
              "Send a vaccination campaign to patients without flu shots",
              "Check the email inbox for unread messages",
              "Get the engagement dashboard metrics",
              "What are the chronic care gaps for this practice?",
              "Show me population health demographics",
            ].map((cmd) => (
              <div
                key={cmd}
                className="text-xs font-mono text-muted-foreground border border-border/30 rounded-md px-3 py-2"
              >
                {cmd}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
