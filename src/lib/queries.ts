import "server-only";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
  sum,
  count,
} from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  productCategories,
  products,
  siteSettings,
  type Product,
  type SiteSettings,
} from "@/db/schema";

export type CategoryTree = {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  children: {
    id: number;
    name: string;
    slug: string;
    sortOrder: number;
    isActive: boolean;
    productCount: number;
  }[];
};

/** Semua kategori + subkategori (dengan bilangan produk), tersusun. */
export async function getCategoryTree(
  opts: { activeOnly?: boolean } = {},
): Promise<CategoryTree[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      parentId: categories.parentId,
      imageUrl: categories.imageUrl,
      isActive: categories.isActive,
      sortOrder: categories.sortOrder,
      productCount: sql<number>`(select count(*)::int from ${productCategories} pc where pc.category_id = ${categories.id})`,
    })
    .from(categories)
    .where(opts.activeOnly ? eq(categories.isActive, true) : undefined)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  const parents = rows.filter((r) => r.parentId === null);
  return parents.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    imageUrl: p.imageUrl,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
    children: rows
      .filter((c) => c.parentId === p.id)
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        sortOrder: c.sortOrder,
        isActive: c.isActive,
        productCount: c.productCount,
      })),
  }));
}

export async function getCategoryBySlug(slug: string) {
  return db.query.categories.findFirst({
    where: and(
      eq(categories.slug, slug),
      isNull(categories.parentId),
      eq(categories.isActive, true),
    ),
    with: {
      children: {
        where: eq(categories.isActive, true),
        orderBy: [asc(categories.sortOrder), asc(categories.name)],
      },
    },
  });
}

/** Produk aktif dalam senarai subkategori (tanpa duplikat). */
export async function getProductsInCategories(
  categoryIds: number[],
): Promise<Product[]> {
  if (categoryIds.length === 0) return [];
  const ids = db
    .selectDistinct({ id: productCategories.productId })
    .from(productCategories)
    .where(inArray(productCategories.categoryId, categoryIds));
  return db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), inArray(products.id, ids)))
    .orderBy(asc(products.sortOrder), desc(products.createdAt));
}

export async function getFeaturedProducts(limit = 10) {
  return db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
    .orderBy(asc(products.sortOrder), desc(products.createdAt))
    .limit(limit);
}

export async function getProductByCode(code: number) {
  return db.query.products.findFirst({
    where: and(eq(products.code, code), eq(products.isActive, true)),
    with: { categoryLinks: { with: { category: { with: { parent: true } } } } },
  });
}

export async function searchProducts(
  q: string,
  opts: { includeInactive?: boolean } = {},
) {
  const term = q.trim().replace(/^#/, "");
  const conds = [];
  if (/^\d+$/.test(term)) conds.push(eq(products.code, Number(term)));
  if (term)
    conds.push(ilike(products.name, `%${term.replace(/[%_\\]/g, "\\$&")}%`));
  return db
    .select()
    .from(products)
    .where(
      and(
        opts.includeInactive ? undefined : eq(products.isActive, true),
        conds.length ? or(...conds) : undefined,
      ),
    )
    .orderBy(desc(products.createdAt))
    .limit(60);
}

/** Ambil tetapan kedai (auto-seed baris 1 kalau belum ada). */
export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await db.query.siteSettings.findFirst({
    where: eq(siteSettings.id, 1),
  });
  if (row) return row;
  const [seeded] = await db.insert(siteSettings).values({}).returning();
  return seeded;
}

/** Statistik ringkas untuk dashboard admin. */
export async function getDashboardStats() {
  const [[totals], topProducts] = await Promise.all([
    db
      .select({
        totalProducts: count(),
        activeProducts: count(sql`case when ${products.isActive} then 1 end`),
        totalClicksShopee: sum(products.clicksShopee),
        totalClicksTiktok: sum(products.clicksTiktok),
      })
      .from(products),
    db
      .select()
      .from(products)
      .orderBy(desc(sql`${products.clicksShopee} + ${products.clicksTiktok}`))
      .limit(5),
  ]);
  return {
    totalProducts: totals.totalProducts,
    activeProducts: totals.activeProducts,
    totalClicksShopee: Number(totals.totalClicksShopee ?? 0),
    totalClicksTiktok: Number(totals.totalClicksTiktok ?? 0),
    topProducts,
  };
}
