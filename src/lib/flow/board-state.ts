import { supabaseAdmin, hoTables } from "@/lib/supabase";
import type { FlowSnapshot, FlowBlocker } from "@/lib/prediction/types";

interface CheckInRow {
  id: string;
  patientName: string;
  patientId: string | null;
  status: string;
  arrivedAt: string;
  seenAt: string | null;
  leftAt: string | null;
  notes: string | null;
  practiceId: string;
}

/**
 * Build real-time flow board state from ho_check_ins table.
 * Returns counts, wait times, and blocker alerts.
 */
export async function getFlowBoardState(
  practiceId: string
): Promise<FlowSnapshot> {
  const today = new Date().toISOString().split("T")[0];
  const startOfDay = `${today}T00:00:00`;

  const { data, error } = await supabaseAdmin
    .from(hoTables.checkIns)
    .select("*")
    .eq("practiceId", practiceId)
    .gte("arrivedAt", startOfDay)
    .order("arrivedAt", { ascending: true });

  if (error) throw new Error(`Failed to fetch check-ins: ${error.message}`);
  const checkIns = (data as CheckInRow[]) ?? [];

  const now = Date.now();
  const waiting = checkIns.filter((c) => c.status === "waiting");
  const inConsultation = checkIns.filter(
    (c) => c.status === "in_consultation"
  );
  const checkedOut = checkIns.filter((c) => c.status === "checked_out");
  const noShows = checkIns.filter((c) => c.status === "no_show");

  const waitMinutes = waiting.map(
    (c) => (now - new Date(c.arrivedAt).getTime()) / 60000
  );
  const avgWait =
    waitMinutes.length > 0
      ? waitMinutes.reduce((a, b) => a + b, 0) / waitMinutes.length
      : 0;
  const longestWait =
    waitMinutes.length > 0 ? Math.max(...waitMinutes) : 0;

  // Detect blockers: patients in consultation for too long (>45 min)
  // or waiting for >30 min
  const blockers: FlowBlocker[] = [];

  for (const c of inConsultation) {
    if (!c.seenAt) continue;
    const consultMinutes = (now - new Date(c.seenAt).getTime()) / 60000;
    if (consultMinutes > 45) {
      blockers.push({
        patientName: c.patientName,
        reason: `In consultation for ${Math.round(consultMinutes)} minutes (overrun)`,
        minutesBlocked: Math.round(consultMinutes - 45),
      });
    }
  }

  for (const c of waiting) {
    const waitMin = (now - new Date(c.arrivedAt).getTime()) / 60000;
    if (waitMin > 30) {
      blockers.push({
        patientName: c.patientName,
        reason: `Waiting for ${Math.round(waitMin)} minutes`,
        minutesBlocked: Math.round(waitMin),
      });
    }
  }

  return {
    practiceId,
    waitingCount: waiting.length,
    inConsultationCount: inConsultation.length,
    checkedOutCount: checkedOut.length,
    noShowCount: noShows.length,
    avgWaitMinutes: Math.round(avgWait * 10) / 10,
    longestWaitMinutes: Math.round(longestWait * 10) / 10,
    blockers,
  };
}

/**
 * Get check-ins grouped by status for the Kanban board.
 */
export async function getCheckInsByStatus(practiceId: string) {
  const today = new Date().toISOString().split("T")[0];
  const startOfDay = `${today}T00:00:00`;

  const { data, error } = await supabaseAdmin
    .from(hoTables.checkIns)
    .select("*")
    .eq("practiceId", practiceId)
    .gte("arrivedAt", startOfDay)
    .order("arrivedAt", { ascending: true });

  if (error) throw new Error(`Failed to fetch check-ins: ${error.message}`);
  const checkIns = (data as CheckInRow[]) ?? [];

  return {
    waiting: checkIns.filter((c) => c.status === "waiting"),
    inConsultation: checkIns.filter((c) => c.status === "in_consultation"),
    checkedOut: checkIns.filter((c) => c.status === "checked_out"),
    noShow: checkIns.filter((c) => c.status === "no_show"),
  };
}
