import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const sessionCookie = req.cookies.get("better-auth.session_token");

  if (!sessionCookie && req.nextUrl.pathname.startsWith("/chat")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*"],
};
