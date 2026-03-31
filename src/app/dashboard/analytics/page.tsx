import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, CheckCircle2, Target, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Model accuracy and prediction performance
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Model Accuracy
            </CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">78.5%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Predictions Made
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">1,247</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              No-Shows Prevented
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-[var(--color-risk-low)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">34</div>
            <p className="text-xs text-muted-foreground">
              Via reminders + waitlist fills
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue Saved
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-[var(--color-risk-low)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">R20,400</div>
            <p className="text-xs text-muted-foreground">
              34 slots x R600 avg
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Confusion Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Prediction Accuracy — Confusion Matrix (Demo)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-px bg-border rounded-md overflow-hidden max-w-md">
            <div className="bg-background p-3" />
            <div className="bg-background p-3 text-center">
              <p className="text-xs font-medium text-muted-foreground">
                Predicted Show
              </p>
            </div>
            <div className="bg-background p-3 text-center">
              <p className="text-xs font-medium text-muted-foreground">
                Predicted No-Show
              </p>
            </div>
            <div className="bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Actually Showed
              </p>
            </div>
            <div className="bg-[var(--color-risk-low)]/10 p-3 text-center">
              <p className="text-lg font-mono font-bold text-[var(--color-risk-low)]">
                842
              </p>
              <p className="text-[10px] text-muted-foreground">True Negative</p>
            </div>
            <div className="bg-[var(--color-risk-medium)]/10 p-3 text-center">
              <p className="text-lg font-mono font-bold text-[var(--color-risk-medium)]">
                67
              </p>
              <p className="text-[10px] text-muted-foreground">
                False Positive
              </p>
            </div>
            <div className="bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Actually No-Show
              </p>
            </div>
            <div className="bg-[var(--color-risk-high)]/10 p-3 text-center">
              <p className="text-lg font-mono font-bold text-[var(--color-risk-high)]">
                41
              </p>
              <p className="text-[10px] text-muted-foreground">
                False Negative
              </p>
            </div>
            <div className="bg-[var(--color-risk-low)]/10 p-3 text-center">
              <p className="text-lg font-mono font-bold text-[var(--color-risk-low)]">
                297
              </p>
              <p className="text-[10px] text-muted-foreground">
                True Positive
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Performance by Risk Level
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { level: "Low (<35)", accuracy: 92, color: "var(--color-risk-low)" },
              { level: "Medium (35-60)", accuracy: 74, color: "var(--color-risk-medium)" },
              { level: "High (60-80)", accuracy: 81, color: "var(--color-risk-high)" },
              { level: "Critical (>80)", accuracy: 88, color: "var(--color-risk-critical)" },
            ].map((row) => (
              <div key={row.level} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-28">
                  {row.level}
                </span>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${row.accuracy}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
                <span className="text-xs font-mono w-10 text-right">
                  {row.accuracy}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Weekly Trend (Demo)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {[65, 72, 78, 74, 81, 79, 78].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-sm bg-primary/20"
                    style={{ height: `${val}%` }}
                  >
                    <div
                      className="w-full rounded-t-sm bg-primary"
                      style={{ height: `${(val / 100) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {["M", "T", "W", "T", "F", "S", "S"][i]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
