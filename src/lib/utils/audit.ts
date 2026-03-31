import { supabaseAdmin, tables } from "@/lib/supabase";
import { isDemoMode } from "@/lib/auth/guard";

interface AuditEntry {
  practiceId: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Log an action to the POPIA audit trail.
 * Skips in demo mode to avoid DB writes.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  if (isDemoMode()) return;

  await supabaseAdmin.from(tables.auditLog).insert({
    practice_id: entry.practiceId,
    user_id: entry.userId ?? null,
    action: entry.action,
    resource_type: entry.resourceType,
    resource_id: entry.resourceId ?? null,
    details: entry.details ?? null,
    ip_address: entry.ipAddress ?? null,
  });
}
