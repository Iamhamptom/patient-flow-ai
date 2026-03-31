import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Clock, TrendingUp } from "lucide-react";
import { getDemoDoctorPatterns } from "@/lib/demo/seed";

export default function DoctorsPage() {
  const patterns = getDemoDoctorPatterns();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Doctor Profiles</h1>
        <p className="text-sm text-muted-foreground">
          Consultation patterns and scheduling insights per doctor
        </p>
      </div>

      {patterns.map((doc) => (
        <Card key={doc.doctorName}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                {doc.doctorName}
              </CardTitle>
              <Badge variant="secondary" className="font-mono">
                {doc.sampleSize} sessions analyzed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Avg Duration", value: `${doc.avgDuration}m`, icon: Clock },
                { label: "Median", value: `${doc.medianDuration}m`, icon: Clock },
                { label: "75th Percentile", value: `${doc.p75Duration}m`, icon: TrendingUp },
                { label: "95th Percentile", value: `${doc.p95Duration}m`, icon: TrendingUp },
                { label: "Std Deviation", value: `${doc.stdDeviation}m`, icon: TrendingUp },
              ].map((stat) => (
                <div key={stat.label} className="rounded-md bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-mono font-bold mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Recommended slot duration:{" "}
                <span className="font-mono font-bold text-primary">
                  {Math.ceil(doc.p75Duration / 5) * 5}m
                </span>{" "}
                (based on P75 — covers 75% of consultations)
              </p>
              <p className="text-xs text-muted-foreground">
                Buffer suggestion:{" "}
                <span className="font-mono font-bold text-[var(--color-risk-medium)]">
                  {Math.round(doc.p95Duration - doc.p75Duration)}m
                </span>{" "}
                every 3rd slot (for overruns)
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
