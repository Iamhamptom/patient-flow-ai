"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Settings, Save } from "lucide-react";
import { DEFAULT_CONFIG } from "@/lib/prediction/types";

export default function SettingsPage() {
  const config = DEFAULT_CONFIG;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure prediction thresholds and practice settings
          </p>
        </div>
        <Button size="sm">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Risk Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              Risk Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="high-threshold">
                High Risk Threshold (%)
              </Label>
              <Input
                id="high-threshold"
                type="number"
                defaultValue={config.riskThresholdHigh}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Bookings above this score are flagged as high risk
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="medium-threshold">
                Medium Risk Threshold (%)
              </Label>
              <Input
                id="medium-threshold"
                type="number"
                defaultValue={config.riskThresholdMedium}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auto-remind">
                Auto-Remind Above (%)
              </Label>
              <Input
                id="auto-remind"
                type="number"
                defaultValue={config.autoRemindAbove}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Automatically send extra reminders above this score
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Scheduling */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              Scheduling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slot-duration">
                Default Slot Duration (minutes)
              </Label>
              <Input
                id="slot-duration"
                type="number"
                defaultValue={config.slotDurationDefault}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buffer">Buffer Between Slots (minutes)</Label>
              <Input
                id="buffer"
                type="number"
                defaultValue={config.bufferMinutes}
                className="font-mono"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Complex Cases in Morning</Label>
                <p className="text-xs text-muted-foreground">
                  Schedule complex/new patients in morning slots
                </p>
              </div>
              <Switch defaultChecked={config.morningComplexCases} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Double-Booking</Label>
                <p className="text-xs text-muted-foreground">
                  Auto-book waitlist patients in high-risk slots
                </p>
              </div>
              <Switch defaultChecked={config.enableDoubleBooking} />
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Revenue Calculation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fee">
                Average Consultation Fee (ZAR)
              </Label>
              <Input
                id="fee"
                type="number"
                defaultValue={config.avgConsultationFee}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Used to calculate at-risk and saved revenue
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>24h Reminder</Label>
              <Switch defaultChecked={config.reminder24h} />
            </div>
            <div className="flex items-center justify-between">
              <Label>2h Reminder</Label>
              <Switch defaultChecked={config.reminder2h} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Extra Reminder for High Risk</Label>
                <p className="text-xs text-muted-foreground">
                  Additional WhatsApp message for patients above threshold
                </p>
              </div>
              <Switch defaultChecked={config.extraReminderHighRisk} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
