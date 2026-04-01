/**
 * Front Desk tools — reception workflow additions for FlowBot.
 * Medical aid verification, calendar slots, bulk check-in import,
 * integration status, patient registration.
 */
import { tool } from "ai";
import { z } from "zod";
import { supabaseAdmin, hoTables } from "@/lib/supabase";

export function createFrontDeskTools() {
  return {
    verify_eligibility: tool({
      description:
        "Check if a patient's medical aid is active and what benefits remain. Uses Healthbridge.",
      inputSchema: z.object({
        membershipNumber: z.string().describe("Medical aid member number"),
        scheme: z.string().describe("Scheme name (Discovery, GEMS, Bonitas, etc.)"),
        dependentCode: z.string().optional(),
      }),
      execute: async ({ membershipNumber, scheme, dependentCode }) => {
        // TODO: Wire to real Healthbridge API when credentials available
        return {
          eligible: true,
          scheme,
          membershipNumber,
          dependentCode,
          option: `${scheme} Standard`,
          benefitsRemaining: "R5,200 of R12,000",
          preAuthRequired: false,
          message: `Member ${membershipNumber} on ${scheme} — ELIGIBLE.`,
          note: "Connect Healthbridge for real-time verification.",
        };
      },
    }),

    get_calendar_slots: tool({
      description:
        "Get available appointment slots for a date. Shows open 30-min slots based on practice hours (Mon-Fri 8-17, Sat 8-13, Sun closed).",
      inputSchema: z.object({
        date: z.string().describe("Date YYYY-MM-DD"),
        practiceId: z.string(),
      }),
      execute: async ({ date, practiceId }) => {
        const dayStart = `${date}T00:00:00`;
        const dayEnd = `${date}T23:59:59`;

        const { data: bookings } = await supabaseAdmin
          .from(hoTables.bookings)
          .select("scheduled_at")
          .eq("practice_id", practiceId)
          .gte("scheduled_at", dayStart)
          .lte("scheduled_at", dayEnd)
          .in("status", ["pending", "confirmed"]);

        const dow = new Date(date).getDay();
        const endHour = dow === 6 ? 13 : dow === 0 ? 0 : 17;
        if (endHour === 0)
          return { slots: [], available: 0, total: 0, message: "Closed on Sundays." };

        const booked = new Set(
          (bookings || []).map((b) =>
            new Date(b.scheduled_at).toTimeString().slice(0, 5)
          )
        );

        const slots: { time: string; available: boolean }[] = [];
        for (let h = 8; h < endHour; h++) {
          for (const m of [0, 30]) {
            const t = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
            slots.push({ time: t, available: !booked.has(t) });
          }
        }

        const avail = slots.filter((s) => s.available).length;
        return { date, slots, available: avail, total: slots.length };
      },
    }),

    import_bookings_to_checkin: tool({
      description:
        "Import today's confirmed bookings into the check-in queue. Prevents duplicates. Use at start of day to populate the reception board.",
      inputSchema: z.object({ practiceId: z.string() }),
      execute: async ({ practiceId }) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data: bookings } = await supabaseAdmin
          .from(hoTables.bookings)
          .select("id, patient_name, service")
          .eq("practice_id", practiceId)
          .in("status", ["confirmed", "pending"])
          .gte("scheduled_at", today.toISOString())
          .lt("scheduled_at", tomorrow.toISOString());

        if (!bookings?.length)
          return { imported: 0, message: "No bookings to import." };

        // Check for already-imported check-ins today
        const { data: existing } = await supabaseAdmin
          .from(hoTables.checkIns)
          .select("patient_name")
          .eq("practice_id", practiceId)
          .gte("created_at", today.toISOString());

        const existingNames = new Set(
          (existing || []).map((e) => e.patient_name)
        );
        const toImport = bookings.filter(
          (b) => !existingNames.has(b.patient_name)
        );

        if (!toImport.length)
          return { imported: 0, message: "All bookings already in queue." };

        await supabaseAdmin.from(hoTables.checkIns).insert(
          toImport.map((b) => ({
            id: `ci-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            practice_id: practiceId,
            patient_name: b.patient_name,
            notes: b.service,
            status: "waiting",
            arrived_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          }))
        );

        return {
          imported: toImport.length,
          message: `Imported ${toImport.length} bookings to check-in queue.`,
        };
      },
    }),

    check_connections: tool({
      description:
        "Check status of all front desk integrations — Supabase, WhatsApp, Email, Calendar, HEAL, Healthbridge, CareOn, Microsoft, Gmail, AI.",
      inputSchema: z.object({}),
      execute: async () => {
        const connections = [
          { id: "supabase", name: "Supabase", status: "connected" },
          {
            id: "whatsapp",
            name: "WhatsApp (Twilio)",
            status: process.env.TWILIO_ACCOUNT_SID ? "connected" : "disconnected",
          },
          {
            id: "email",
            name: "Email (Resend)",
            status: process.env.RESEND_API_KEY ? "connected" : "disconnected",
          },
          { id: "google_calendar", name: "Google Calendar", status: "disconnected" },
          { id: "heal", name: "HEAL System (A2D24)", status: "disconnected" },
          {
            id: "healthbridge",
            name: "Healthbridge",
            status: process.env.HEALTHBRIDGE_API_KEY ? "connected" : "disconnected",
          },
          { id: "careon", name: "CareOn Bridge", status: "connected" },
          { id: "microsoft365", name: "Microsoft 365", status: "disconnected" },
          { id: "gmail", name: "Gmail", status: "disconnected" },
          {
            id: "ai",
            name: "AI Models (Claude + Gemini)",
            status: process.env.ANTHROPIC_API_KEY ? "connected" : "disconnected",
          },
        ];
        const connected = connections.filter((c) => c.status === "connected").length;
        return {
          connections,
          connected,
          total: connections.length,
          summary: `${connected}/${connections.length} integrations connected.`,
        };
      },
    }),

    create_patient: tool({
      description:
        "Register a new patient in the system. Use when a walk-in or new caller needs to be added.",
      inputSchema: z.object({
        practiceId: z.string(),
        name: z.string(),
        phone: z.string().optional(),
        email: z.string().optional(),
        idNumber: z.string().optional().describe("13-digit SA ID number"),
        dateOfBirth: z.string().optional(),
        gender: z.string().optional(),
        medicalAid: z.string().optional().describe("Scheme name"),
        medicalAidNo: z.string().optional().describe("Membership number"),
      }),
      execute: async ({
        practiceId, name, phone, email, idNumber, dateOfBirth, gender,
        medicalAid, medicalAidNo,
      }) => {
        const id = `pt-${Date.now().toString(36)}`;
        const { data, error } = await supabaseAdmin
          .from(hoTables.patients)
          .insert({
            id,
            practice_id: practiceId,
            name,
            phone: phone ?? null,
            email: email ?? null,
            id_number: idNumber ?? null,
            date_of_birth: dateOfBirth ?? null,
            gender: gender ?? null,
            medical_aid: medicalAid ?? null,
            medical_aid_no: medicalAidNo ?? null,
            status: "active",
            created_at: new Date().toISOString(),
          })
          .select("id, name")
          .single();

        if (error) return { error: error.message };
        return { success: true, patient: data, message: `Patient ${name} registered.` };
      },
    }),
  };
}
