import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("pf_session");
  if (!cookie?.value) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const session = JSON.parse(cookie.value);
    return NextResponse.json({ authenticated: true, user: session });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
