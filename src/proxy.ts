import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — no auth required
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/agent") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Dashboard and API routes require session cookie
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/")) {
    const session = req.cookies.get("pf_session");
    if (!session?.value) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
