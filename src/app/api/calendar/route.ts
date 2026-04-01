import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/auth/guard";
import { supabaseAdmin, hoTables } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const practiceId = searchParams.get("practiceId") ?? "netcare-primary-001";

  const dow = new Date(date).getDay();
  const endHour = dow === 6 ? 13 : dow === 0 ? 0 : 17;
  if (endHour === 0) return NextResponse.json({ date, slots: [], available: 0, message: "Closed Sundays" });

  const { data: bookings } = await supabaseAdmin
    .from(hoTables.bookings)
    .select("scheduled_at")
    .eq("practice_id", practiceId)
    .gte("scheduled_at", `${date}T00:00:00`)
    .lte("scheduled_at", `${date}T23:59:59`)
    .in("status", ["pending", "confirmed"]);

  const booked = new Set((bookings || []).map((b) => new Date(b.scheduled_at).toTimeString().slice(0, 5)));

  const slots: { time: string; available: boolean }[] = [];
  for (let h = 8; h < endHour; h++) {
    for (const m of [0, 30]) {
      const t = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      slots.push({ time: t, available: !booked.has(t) });
    }
  }

  return NextResponse.json({ date, slots, available: slots.filter((s) => s.available).length, total: slots.length });
}
