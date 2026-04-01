/**
 * Operational tools for FlowBot — booking management, patient lookup,
 * communications pipeline, recall/referrals, daily tasks, CareOn bridge.
 *
 * These make FlowBot the daily ops hub that staff use every day.
 */
import { tool } from "ai";
import { z } from "zod";
import { supabaseAdmin, hoTables } from "@/lib/supabase";
import { sendWhatsApp, sendWhatsAppWithButtons, sendWithFallback, sendSMS, broadcastWhatsApp } from "@/lib/twilio";
import { sendEmail, appointmentConfirmationEmail } from "@/lib/resend";

export function createOpsTools() {
  return {
    // ━━━━━━━━━━━━━━━━━━━━ BOOKING MANAGEMENT ━━━━━━━━━━━━━━━━━━━━

    create_booking: tool({
      description:
        "Create a new patient booking. Use when a patient calls, walks in, or books via WhatsApp.",
      inputSchema: z.object({
        practiceId: z.string(),
        patientName: z.string(),
        patientPhone: z.string(),
        patientEmail: z.string().optional(),
        service: z.string().describe("e.g. GP Consultation, Follow-up, Blood Test"),
        scheduledAt: z.string().describe("ISO datetime e.g. 2026-04-02T09:00:00"),
        source: z.enum(["dashboard", "public", "whatsapp", "phone"]).optional(),
        leadSource: z.string().optional(),
        notes: z.string().optional(),
      }),
      execute: async ({ practiceId, patientName, patientPhone, patientEmail, service, scheduledAt, source, leadSource, notes }) => {
        const id = `pf-${Date.now().toString(36)}`;
        const { data, error } = await supabaseAdmin
          .from(hoTables.bookings)
          .insert({
            id,
            patient_name: patientName,
            patient_phone: patientPhone,
            patient_email: patientEmail ?? null,
            service,
            scheduled_at: scheduledAt,
            status: "pending",
            source: source ?? "dashboard",
            lead_source: leadSource ?? null,
            deposit_paid: false,
            notes: notes ?? null,
            practice_id: practiceId,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (error) return { error: error.message };
        return { success: true, bookingId: data.id, status: "pending" };
      },
    }),

    update_booking: tool({
      description:
        "Update a booking status — confirm, cancel, mark as no-show, or complete.",
      inputSchema: z.object({
        bookingId: z.string(),
        status: z.enum(["confirmed", "cancelled", "completed", "no_show"]),
        reason: z.string().optional().describe("Cancellation/rejection reason"),
      }),
      execute: async ({ bookingId, status, reason }) => {
        const updates: Record<string, unknown> = { status };
        if (status === "confirmed") updates.confirmed_at = new Date().toISOString();
        if (status === "cancelled" && reason) updates.rejection_reason = reason;

        const { error } = await supabaseAdmin
          .from(hoTables.bookings)
          .update(updates)
          .eq("id", bookingId);

        if (error) return { error: error.message };
        return { success: true, bookingId, status };
      },
    }),

    search_bookings: tool({
      description:
        "Search bookings by patient name, phone, date range, or status. Use for 'show me tomorrow's bookings' or 'find Thandi's appointments'.",
      inputSchema: z.object({
        practiceId: z.string(),
        patientName: z.string().optional(),
        patientPhone: z.string().optional(),
        date: z.string().optional().describe("YYYY-MM-DD"),
        status: z.string().optional(),
        limit: z.number().optional(),
      }),
      execute: async ({ practiceId, patientName, patientPhone, date, status, limit }) => {
        let query = supabaseAdmin
          .from(hoTables.bookings)
          .select("*")
          .eq("practice_id", practiceId)
          .order("scheduled_at", { ascending: true })
          .limit(limit ?? 20);

        if (patientName) query = query.ilike("patient_name", `%${patientName}%`);
        if (patientPhone) query = query.eq("patient_phone", patientPhone);
        if (date) {
          query = query.gte("scheduled_at", `${date}T00:00:00`).lte("scheduled_at", `${date}T23:59:59`);
        }
        if (status) query = query.eq("status", status);

        const { data, error } = await query;
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, bookings: data ?? [] };
      },
    }),

    // ━━━━━━━━━━━━━━━━━━━━ PATIENT MANAGEMENT ━━━━━━━━━━━━━━━━━━━━

    lookup_patient: tool({
      description:
        "Look up a patient by name, phone, or ID. Returns full profile with medical aid, allergies, medications, last visit.",
      inputSchema: z.object({
        practiceId: z.string(),
        name: z.string().optional(),
        phone: z.string().optional(),
        patientId: z.string().optional(),
      }),
      execute: async ({ practiceId, name, phone, patientId }) => {
        let query = supabaseAdmin
          .from(hoTables.patients)
          .select("*")
          .eq("practice_id", practiceId);

        if (patientId) query = query.eq("id", patientId);
        else if (phone) query = query.eq("phone", phone);
        else if (name) query = query.ilike("name", `%${name}%`);
        else return { error: "Provide name, phone, or patientId" };

        const { data, error } = await query.limit(5);
        if (error) return { error: error.message };

        // Enrich with allergies and medications for each patient
        const patients = [];
        for (const p of data ?? []) {
          const { data: allergies } = await supabaseAdmin
            .from(hoTables.allergies)
            .select("*")
            .eq("patient_id", p.id);
          const { data: meds } = await supabaseAdmin
            .from(hoTables.medications)
            .select("*")
            .eq("patient_id", p.id);

          patients.push({
            ...p,
            allergies: allergies ?? [],
            medications: meds ?? [],
          });
        }

        return { count: patients.length, patients };
      },
    }),

    get_patient_history: tool({
      description:
        "Get a patient's full booking history, medical records, and vitals. Use for 'what's Sipho's history?' or before making scheduling decisions.",
      inputSchema: z.object({
        practiceId: z.string(),
        patientPhone: z.string(),
      }),
      execute: async ({ practiceId, patientPhone }) => {
        const { data: bookings } = await supabaseAdmin
          .from(hoTables.bookings)
          .select("id, service, scheduled_at, status, source")
          .eq("practice_id", practiceId)
          .eq("patient_phone", patientPhone)
          .order("scheduled_at", { ascending: false })
          .limit(20);

        const noShows = bookings?.filter((b) => b.status === "no_show").length ?? 0;
        const total = bookings?.length ?? 0;

        return {
          totalBookings: total,
          noShows,
          noShowRate: total > 0 ? `${Math.round((noShows / total) * 100)}%` : "N/A",
          recentBookings: bookings ?? [],
        };
      },
    }),

    // ━━━━━━━━━━━━━━━━━━━━ COMMUNICATIONS PIPELINE ━━━━━━━━━━━━━━━━━━━━

    send_whatsapp: tool({
      description:
        "Send a WhatsApp message to a patient via Twilio. Use for reminders, confirmations, follow-ups, recall outreach, or any patient communication.",
      inputSchema: z.object({
        practiceId: z.string(),
        to: z.string().describe("Patient phone number with country code e.g. +27821234567"),
        message: z.string().describe("Message text (max 1600 chars for WhatsApp)"),
        patientName: z.string(),
      }),
      execute: async ({ practiceId, to, message, patientName }) => {
        try {
          const result = await sendWhatsApp(to, message);
          // Log to notifications table
          await supabaseAdmin.from(hoTables.notifications).insert({
            type: "whatsapp",
            recipient: to,
            patient_name: patientName,
            subject: "WhatsApp message",
            message,
            status: "sent",
            template: "custom",
            practice_id: practiceId,
            sent_at: new Date().toISOString(),
          });
          return { sent: true, channel: "whatsapp", sid: result.sid, to };
        } catch (err) {
          return { error: err instanceof Error ? err.message : "WhatsApp send failed" };
        }
      },
    }),

    send_sms: tool({
      description: "Send an SMS to a patient. Use as fallback when WhatsApp fails or for simple alerts.",
      inputSchema: z.object({
        practiceId: z.string(),
        to: z.string().describe("Phone number with country code"),
        message: z.string(),
        patientName: z.string(),
      }),
      execute: async ({ practiceId, to, message, patientName }) => {
        try {
          const result = await sendSMS(to, message);
          await supabaseAdmin.from(hoTables.notifications).insert({
            type: "sms",
            recipient: to,
            patient_name: patientName,
            subject: "SMS",
            message,
            status: "sent",
            template: "custom",
            practice_id: practiceId,
            sent_at: new Date().toISOString(),
          });
          return { sent: true, channel: "sms", sid: result.sid, to };
        } catch (err) {
          return { error: err instanceof Error ? err.message : "SMS send failed" };
        }
      },
    }),

    send_message_with_fallback: tool({
      description:
        "Send a message via WhatsApp first, falling back to SMS if WhatsApp fails. Best option for critical communications (reminders, confirmations).",
      inputSchema: z.object({
        practiceId: z.string(),
        to: z.string(),
        message: z.string(),
        patientName: z.string(),
      }),
      execute: async ({ practiceId, to, message, patientName }) => {
        try {
          const result = await sendWithFallback(to, message);
          await supabaseAdmin.from(hoTables.notifications).insert({
            type: result.channel,
            recipient: to,
            patient_name: patientName,
            subject: `${result.channel} message`,
            message,
            status: "sent",
            template: "custom",
            practice_id: practiceId,
            sent_at: new Date().toISOString(),
          });
          return { sent: true, channel: result.channel, sid: result.sid, to };
        } catch (err) {
          return { error: err instanceof Error ? err.message : "Both channels failed" };
        }
      },
    }),

    broadcast_whatsapp: tool({
      description:
        "Broadcast a WhatsApp message to multiple patients. Use for bulk recalls, campaign messages, or practice announcements. Max 50 recipients per call.",
      inputSchema: z.object({
        practiceId: z.string(),
        recipients: z.array(z.string()).describe("Array of phone numbers"),
        message: z.string(),
      }),
      execute: async ({ practiceId, recipients, message }) => {
        if (recipients.length > 50) {
          return { error: "Max 50 recipients per broadcast" };
        }
        const results = await broadcastWhatsApp(recipients, message);
        const sent = results.filter((r) => r.sid).length;
        const failed = results.filter((r) => r.error).length;
        return { sent, failed, total: recipients.length, results };
      },
    }),

    send_email: tool({
      description:
        "Send an email to a patient via Resend. Use for appointment confirmations, invoices, follow-up reports, or formal communications.",
      inputSchema: z.object({
        practiceId: z.string(),
        to: z.string().describe("Patient email address"),
        subject: z.string(),
        html: z.string().describe("HTML email body"),
        patientName: z.string(),
      }),
      execute: async ({ practiceId, to, subject, html, patientName }) => {
        try {
          const result = await sendEmail({ to, subject, html });
          await supabaseAdmin.from(hoTables.notifications).insert({
            type: "email",
            recipient: to,
            patient_name: patientName,
            subject,
            message: subject,
            status: "sent",
            template: "custom",
            practice_id: practiceId,
            sent_at: new Date().toISOString(),
          });
          return { sent: true, channel: "email", to, ...result };
        } catch (err) {
          return { error: err instanceof Error ? err.message : "Email send failed" };
        }
      },
    }),

    get_notification_history: tool({
      description:
        "Get recent notifications sent to patients — reminders, follow-ups, recall messages. Use to check what was already sent.",
      inputSchema: z.object({
        practiceId: z.string(),
        patientName: z.string().optional(),
        type: z.string().optional(),
        limit: z.number().optional(),
      }),
      execute: async ({ practiceId, patientName, type, limit }) => {
        let query = supabaseAdmin
          .from(hoTables.notifications)
          .select("*")
          .eq("practice_id", practiceId)
          .order("sent_at", { ascending: false })
          .limit(limit ?? 20);

        if (patientName) query = query.ilike("patient_name", `%${patientName}%`);
        if (type) query = query.eq("type", type);

        const { data, error } = await query;
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, notifications: data ?? [] };
      },
    }),

    // ━━━━━━━━━━━━━━━━━━━━ RECALL & FOLLOW-UP ━━━━━━━━━━━━━━━━━━━━

    get_recall_list: tool({
      description:
        "Get patients due for recall — follow-ups, chronic checkups, vaccinations. Use for 'who needs to come back this week?'",
      inputSchema: z.object({
        practiceId: z.string(),
        overdue: z.boolean().optional().describe("Only show overdue items"),
      }),
      execute: async ({ practiceId, overdue }) => {
        let query = supabaseAdmin
          .from(hoTables.recallItems)
          .select("*")
          .eq("practice_id", practiceId)
          .eq("contacted", false)
          .order("due_date", { ascending: true });

        if (overdue) query = query.lte("due_date", new Date().toISOString());

        const { data, error } = await query.limit(30);
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, recalls: data ?? [] };
      },
    }),

    mark_recall_contacted: tool({
      description: "Mark a recall item as contacted after reaching out to the patient.",
      inputSchema: z.object({
        recallId: z.string(),
      }),
      execute: async ({ recallId }) => {
        const { error } = await supabaseAdmin
          .from(hoTables.recallItems)
          .update({ contacted: true })
          .eq("id", recallId);

        if (error) return { error: error.message };
        return { success: true, recallId };
      },
    }),

    // ━━━━━━━━━━━━━━━━━━━━ REFERRALS ━━━━━━━━━━━━━━━━━━━━━━━━━━

    get_referrals: tool({
      description:
        "Get GP referrals — pending, accepted, booked, completed. Use for 'what referrals are waiting?' or 'show me this week's referrals'.",
      inputSchema: z.object({
        practiceId: z.string(),
        status: z.string().optional().describe("pending, accepted, booked, completed, declined"),
      }),
      execute: async ({ practiceId, status }) => {
        let query = supabaseAdmin
          .from(hoTables.referrals)
          .select("*")
          .eq("practice_id", practiceId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (status) query = query.eq("status", status);

        const { data, error } = await query;
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, referrals: data ?? [] };
      },
    }),

    update_referral: tool({
      description: "Update a referral status and optionally send feedback to the referring doctor.",
      inputSchema: z.object({
        referralId: z.string(),
        status: z.enum(["accepted", "booked", "completed", "declined"]),
        feedbackNote: z.string().optional(),
      }),
      execute: async ({ referralId, status, feedbackNote }) => {
        const updates: Record<string, unknown> = { status };
        if (feedbackNote) {
          updates.feedback_note = feedbackNote;
          updates.feedback_sent = true;
          updates.feedback_sent_at = new Date().toISOString();
        }

        const { error } = await supabaseAdmin
          .from(hoTables.referrals)
          .update(updates)
          .eq("id", referralId);

        if (error) return { error: error.message };
        return { success: true, referralId, status };
      },
    }),

    // ━━━━━━━━━━━━━━━━━━━━ DAILY TASKS ━━━━━━━━━━━━━━━━━━━━━━━━━━

    get_daily_tasks: tool({
      description:
        "Get today's practice tasks — morning opening, during-day tasks, end-of-day closing. Use for 'what do I need to do today?'",
      inputSchema: z.object({
        practiceId: z.string(),
        category: z.string().optional().describe("morning, during_day, end_of_day"),
      }),
      execute: async ({ practiceId, category }) => {
        const today = new Date().toISOString().split("T")[0];
        let query = supabaseAdmin
          .from(hoTables.dailyTasks)
          .select("*")
          .eq("practice_id", practiceId)
          .order("sort_order", { ascending: true });

        if (category) query = query.eq("category", category);

        const { data, error } = await query;
        if (error) return { error: error.message };

        const completed = data?.filter((t) => t.completed).length ?? 0;
        const total = data?.length ?? 0;

        return {
          total,
          completed,
          progress: total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%",
          tasks: data ?? [],
        };
      },
    }),

    complete_task: tool({
      description: "Mark a daily task as completed.",
      inputSchema: z.object({
        taskId: z.string(),
        completedBy: z.string().optional(),
      }),
      execute: async ({ taskId, completedBy }) => {
        const { error } = await supabaseAdmin
          .from(hoTables.dailyTasks)
          .update({
            completed: true,
            completed_by: completedBy ?? "flowbot",
            completed_at: new Date().toISOString(),
          })
          .eq("id", taskId);

        if (error) return { error: error.message };
        return { success: true, taskId };
      },
    }),

    // ━━━━━━━━━━━━━━━━━━━━ CAREON BRIDGE (Hospital EMR) ━━━━━━━━━━━━━━━━━━━━

    get_bridge_messages: tool({
      description:
        "Get CareOn bridge messages — HL7v2 ADT/ORU/ORM messages from Netcare hospitals. Shows admissions, discharges, lab results, and clinical alerts.",
      inputSchema: z.object({
        facility: z.string().optional().describe("Hospital name filter"),
        messageType: z.string().optional().describe("ADT, ORU, ORM, DFT, SIU, MDM"),
        limit: z.number().optional(),
      }),
      execute: async ({ facility, messageType, limit }) => {
        let query = supabaseAdmin
          .from(hoTables.bridgeMessages)
          .select("*")
          .order("received_at", { ascending: false })
          .limit(limit ?? 20);

        if (facility) query = query.ilike("facility", `%${facility}%`);
        if (messageType) query = query.eq("message_type", messageType);

        const { data, error } = await query;
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, messages: data ?? [] };
      },
    }),

    get_bridge_advisories: tool({
      description:
        "Get AI advisories from the CareOn bridge — clinical alerts, coding suggestions, rejection predictions generated from hospital HL7 feeds.",
      inputSchema: z.object({
        limit: z.number().optional(),
      }),
      execute: async ({ limit }) => {
        const { data, error } = await supabaseAdmin
          .from(hoTables.bridgeAdvisories)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit ?? 10);

        if (error) return { error: error.message };
        return { count: data?.length ?? 0, advisories: data ?? [] };
      },
    }),

    // ━━━━━━━━━━━━━━━━━━━━ CHECK-IN MANAGEMENT ━━━━━━━━━━━━━━━━━━━━

    check_in_patient: tool({
      description:
        "Check in a patient who has arrived at the practice. Creates a check-in record with 'waiting' status.",
      inputSchema: z.object({
        practiceId: z.string(),
        patientName: z.string(),
        notes: z.string().optional(),
      }),
      execute: async ({ practiceId, patientName, notes }) => {
        const id = `ci-${Date.now().toString(36)}`;
        const { data, error } = await supabaseAdmin
          .from(hoTables.checkIns)
          .insert({
            id,
            patient_name: patientName,
            status: "waiting",
            arrived_at: new Date().toISOString(),
            notes: notes ?? null,
            practice_id: practiceId,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (error) return { error: error.message };
        return { success: true, checkInId: data.id, status: "waiting" };
      },
    }),

    update_check_in: tool({
      description:
        "Update a check-in status — move patient to 'in_consultation', 'checked_out', or 'no_show'.",
      inputSchema: z.object({
        checkInId: z.string(),
        status: z.enum(["in_consultation", "checked_out", "no_show"]),
      }),
      execute: async ({ checkInId, status }) => {
        const updates: Record<string, unknown> = { status };
        if (status === "in_consultation") updates.seen_at = new Date().toISOString();
        if (status === "checked_out") updates.left_at = new Date().toISOString();

        const { error } = await supabaseAdmin
          .from(hoTables.checkIns)
          .update(updates)
          .eq("id", checkInId);

        if (error) return { error: error.message };
        return { success: true, checkInId, status };
      },
    }),

    // ━━━━━━━━━━━━━━━━━━━━ MORNING BRIEFING ━━━━━━━━━━━━━━━━━━━━

    morning_briefing: tool({
      description:
        "Generate a comprehensive morning briefing — today's bookings, predicted no-shows, recall items due, pending referrals, daily tasks, and any CareOn alerts. Use at start of day.",
      inputSchema: z.object({
        practiceId: z.string(),
      }),
      execute: async ({ practiceId }) => {
        const today = new Date().toISOString().split("T")[0];

        // Bookings
        const { data: bookings } = await supabaseAdmin
          .from(hoTables.bookings)
          .select("id, patient_name, service, scheduled_at, status, deposit_paid")
          .eq("practice_id", practiceId)
          .gte("scheduled_at", `${today}T00:00:00`)
          .lte("scheduled_at", `${today}T23:59:59`)
          .order("scheduled_at", { ascending: true });

        // Recalls due
        const { data: recalls } = await supabaseAdmin
          .from(hoTables.recallItems)
          .select("patient_name, reason, due_date, phone")
          .eq("practice_id", practiceId)
          .eq("contacted", false)
          .lte("due_date", new Date().toISOString())
          .limit(10);

        // Pending referrals
        const { data: referrals } = await supabaseAdmin
          .from(hoTables.referrals)
          .select("patient_name, referring_doctor, reason, urgency, status")
          .eq("practice_id", practiceId)
          .in("status", ["pending", "accepted"])
          .limit(10);

        // Daily tasks
        const { data: tasks } = await supabaseAdmin
          .from(hoTables.dailyTasks)
          .select("title, category, completed")
          .eq("practice_id", practiceId);

        // Bridge alerts
        const { data: alerts } = await supabaseAdmin
          .from(hoTables.bridgeAdvisories)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        return {
          date: today,
          bookings: {
            total: bookings?.length ?? 0,
            confirmed: bookings?.filter((b) => b.status === "confirmed").length ?? 0,
            pending: bookings?.filter((b) => b.status === "pending").length ?? 0,
            list: bookings ?? [],
          },
          recalls: { overdue: recalls?.length ?? 0, items: recalls ?? [] },
          referrals: { pending: referrals?.length ?? 0, items: referrals ?? [] },
          tasks: {
            total: tasks?.length ?? 0,
            completed: tasks?.filter((t) => t.completed).length ?? 0,
            items: tasks ?? [],
          },
          bridgeAlerts: alerts?.length ?? 0,
        };
      },
    }),
  };
}
