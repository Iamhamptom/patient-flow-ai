"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, UserPlus, Zap } from "lucide-react";

const demoWaitlist = [
  {
    id: "wl-001",
    patientName: "Mpho Radebe",
    patientPhone: "+27821234099",
    preferredService: "General Consultation",
    preferredTimes: ["morning"],
    urgency: "semi-urgent",
    status: "waiting",
    createdAt: "2026-03-31T07:00:00",
  },
  {
    id: "wl-002",
    patientName: "Kagiso Mahlangu",
    patientPhone: "+27821234098",
    preferredService: "Blood Test",
    preferredTimes: ["afternoon"],
    urgency: "routine",
    status: "waiting",
    createdAt: "2026-03-30T14:00:00",
  },
  {
    id: "wl-003",
    patientName: "Dineo Moloi",
    patientPhone: "+27821234097",
    preferredService: "Follow-up",
    preferredTimes: ["morning", "afternoon"],
    urgency: "routine",
    status: "offered",
    createdAt: "2026-03-29T09:00:00",
  },
];

const urgencyColors: Record<string, string> = {
  routine: "bg-secondary text-secondary-foreground",
  "semi-urgent": "bg-[var(--color-risk-medium)]/15 text-[var(--color-risk-medium)]",
  urgent: "bg-[var(--color-risk-high)]/15 text-[var(--color-risk-high)]",
};

export default function WaitlistPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Waitlist</h1>
          <p className="text-sm text-muted-foreground">
            {demoWaitlist.length} patients waiting for slots
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Auto-Match
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Preferred Times</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoWaitlist.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{w.patientName}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {w.patientPhone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {w.preferredService}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {w.preferredTimes.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs capitalize">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${urgencyColors[w.urgency]}`}>
                      {w.urgency}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={w.status === "offered" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {w.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {new Date(w.createdAt).toLocaleDateString("en-ZA")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <UserPlus className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
