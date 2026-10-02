import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "admin_session";

/** Lindungi semua /admin kecuali /admin/login. Server action tetap semak sendiri (requireAdmin). */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login" || pathname === "/admin/login/verify")
    return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let ok = false;
  if (token && process.env.AUTH_SECRET) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.AUTH_SECRET),
      );
      ok = payload.role === "admin";
    } catch {
      ok = false;
    }
  }
  if (!ok) return NextResponse.redirect(new URL("/admin/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
