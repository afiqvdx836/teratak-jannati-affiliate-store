import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";

/** /go/128/shopee → kira klik, lepas tu redirect ke link affiliate. */
export async function GET(request: Request, ctx: RouteContext<"/go/[code]/[target]">) {
  const { code: codeParam, target } = await ctx.params;
  const code = Number(codeParam);
  const home = new URL("/", request.url);
  if (!Number.isInteger(code)) return NextResponse.redirect(home);

  const p = await db.query.products.findFirst({
    where: and(eq(products.code, code), eq(products.isActive, true)),
    columns: { id: true, shopeeUrl: true, tiktokUrl: true, tiktokShopUrl: true },
  });
  if (!p) return NextResponse.redirect(home);

  let dest: string | null = null;
  if (target === "shopee") {
    dest = p.shopeeUrl;
    if (dest) await db.update(products).set({ clicksShopee: sql`${products.clicksShopee} + 1` }).where(eq(products.id, p.id));
  } else if (target === "tiktok" || target === "tiktokshop") {
    dest = target === "tiktok" ? p.tiktokUrl : p.tiktokShopUrl;
    if (dest) await db.update(products).set({ clicksTiktok: sql`${products.clicksTiktok} + 1` }).where(eq(products.id, p.id));
  }

  if (!dest) return NextResponse.redirect(new URL(`/p/${code}`, request.url));
  return NextResponse.redirect(dest, { status: 302, headers: { "cache-control": "no-store" } });
}
