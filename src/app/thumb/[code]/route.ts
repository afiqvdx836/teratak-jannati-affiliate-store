import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";

/**
 * Thumbnail TikTok yang sentiasa fresh.
 * URL thumbnail dari TikTok ada tarikh luput, jadi kita ambil semula dari oEmbed
 * (di-cache 6 jam) dan redirect ke situ.
 */
export async function GET(request: Request, ctx: RouteContext<"/thumb/[code]">) {
  const code = Number((await ctx.params).code);
  const fallback = new URL("/placeholder.svg", request.url);
  if (!Number.isInteger(code)) return NextResponse.redirect(fallback);

  const p = await db.query.products.findFirst({
    where: eq(products.code, code),
    columns: { tiktokUrl: true },
  });
  if (!p?.tiktokUrl) return NextResponse.redirect(fallback);

  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(p.tiktokUrl)}`, {
      next: { revalidate: 60 * 60 * 6 },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = (await res.json()) as { thumbnail_url?: string };
      if (data.thumbnail_url) {
        return NextResponse.redirect(data.thumbnail_url, {
          status: 302,
          headers: { "cache-control": "public, max-age=3600, s-maxage=21600" },
        });
      }
    }
  } catch {
    // jatuh ke placeholder
  }
  return NextResponse.redirect(fallback);
}
