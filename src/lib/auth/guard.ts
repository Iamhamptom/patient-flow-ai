import { NextRequest, NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Guard API routes — checks for CRON_SECRET on cron routes,
 * or basic session/key auth on other routes.
 */
export function guardCronRoute(req: NextRequest): NextResponse | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * Rate limiter — simple in-memory token bucket.
 * For production, replace with Upstash Redis rate limiting.
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  ip: string,
  maxRequests = 30,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

/**
 * Extract client IP from request.
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Check if running in demo mode.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}
