import { and, eq, isNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { magicLinkTokens } from "@/db/schema";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

const MAX_AGE = 60 * 60 * 24 * 30; // 30 hari

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return redirectWithError(request, "Token tak sah.");

  const row = await db.query.magicLinkTokens.findFirst({
    where: and(
      eq(magicLinkTokens.token, token),
      isNull(magicLinkTokens.usedAt),
    ),
  });

  if (!row)
    return redirectWithError(request, "Token tak sah atau sudah digunakan.");
  if (row.expiresAt < new Date())
    return redirectWithError(request, "Token sudah tamat tempoh.");

  // Mark as used
  await db
    .update(magicLinkTokens)
    .set({ usedAt: new Date() })
    .where(eq(magicLinkTokens.id, row.id));

  const sessionToken = await createSessionToken();
  const response = NextResponse.redirect(new URL("/admin", request.url));
  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return response;
}

function redirectWithError(request: NextRequest, error: string) {
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}
