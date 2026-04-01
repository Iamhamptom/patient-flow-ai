"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sunrise, Sun, Sunset } from "lucide-react";

const DEMO_TASKS = {
  morning: [
    "Review overnight claims rejections across clinics",
    "Check divisional revenue dashboard — MTD vs target",
    "Review Prime Cure capitation utilisation reports",
    "Flag high-value outstanding medical aid claims (>R5,000)",
  ],
  during_day: [
    "Process medical scheme tariff reconciliations",
    "Review ICD-10 rejection analytics — top 10 rejection codes",
    "Monitor occupational health contract billing accuracy",
    "Approve pharmacy stock purchase orders",
  ],
  end_of_day: [
    "Review daily collection ratios per clinic region",
    "Generate EBITDA variance report for Group reporting",
    "Check POPIA consent compliance dashboard",
  ],
};

export default function DailyTasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daily Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Morning opening, during-day ops, and end-of-day closing
        </p>
      </div>

      {[
        { title: "Morning", icon: Sunrise, tasks: DEMO_TASKS.morning, color: "text-[var(--color-flow-waiting)]" },
        { title: "During the Day", icon: Sun, tasks: DEMO_TASKS.during_day, color: "text-[var(--color-flow-in-consult)]" },
        { title: "End of Day", icon: Sunset, tasks: DEMO_TASKS.end_of_day, color: "text-[var(--color-flow-done)]" },
      ].map((section) => (
        <Card key={section.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <section.icon className={`h-4 w-4 ${section.color}`} />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {section.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-3 rounded-md p-2 hover:bg-card transition-colors">
                <div className="h-4 w-4 rounded border border-border/50 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{task}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <p className="text-[10px] text-muted-foreground/50">
        Ask FlowBot: "Get my daily tasks" or "Complete the claims review task"
      </p>
    </div>
  );
}
