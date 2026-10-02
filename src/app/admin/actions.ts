"use server";

import {
  and,
  asc,
  count,
  eq,
  inArray,
  isNotNull,
  isNull,
  ne,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { randomBytes } from "node:crypto";
import {
  categories,
  magicLinkTokens,
  productCategories,
  products,
  siteSettings,
} from "@/db/schema";
import {
  checkPassword,
  endSession,
  requireAdmin,
  startSession,
} from "@/lib/auth";
import { slugify } from "@/lib/slug";
import {
  extractTikTokVideoId,
  fetchTikTokInfo,
  type TikTokInfo,
} from "@/lib/tiktok";

export type FormState = { error?: string } | undefined;

function refreshPublic() {
  revalidatePath("/", "layout");
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) return { error: "Password salah." };
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

// ─── TikTok ──────────────────────────────────────────────────────────────────

export async function lookupTikTok(
  url: string,
): Promise<{ ok: true; info: TikTokInfo } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    return { ok: true, info: await fetchTikTokInfo(url) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Gagal ambil info TikTok",
    };
  }
}

// ─── Produk ──────────────────────────────────────────────────────────────────

const optionalUrl = (
  hostCheck?: (h: string) => boolean,
  msg = "Link tak sah",
) =>
  z
    .string()
    .trim()
    .transform((v) => v || null)
    .refine((v) => {
      if (v === null) return true;
      try {
        const u = new URL(v);
        if (u.protocol !== "https:" && u.protocol !== "http:") return false;
        return hostCheck ? hostCheck(u.hostname) : true;
      } catch {
        return false;
      }
    }, msg);

const isShopee = (h: string) => /(^|\.)shopee\.com\.my$|(^|\.)shp\.ee$/.test(h);
const isTikTok = (h: string) => /(^|\.)tiktok\.com$/.test(h);

const productSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(2, "Nama produk terlalu pendek").max(200),
  description: z
    .string()
    .trim()
    .max(2000)
    .transform((v) => v || null),
  shopeeUrl: optionalUrl(
    isShopee,
    "Link Shopee mesti dari shopee.com.my atau s.shopee.com.my",
  ),
  tiktokUrl: optionalUrl(isTikTok, "Link TikTok tak sah"),
  tiktokShopUrl: optionalUrl(undefined, "Link TikTok Shop tak sah"),
  imageUrl: optionalUrl(undefined, "Link gambar tak sah"),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  categoryIds: z.array(z.coerce.number().int().positive()),
});

export async function saveProduct(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = productSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    shopeeUrl: formData.get("shopeeUrl") ?? "",
    tiktokUrl: formData.get("tiktokUrl") ?? "",
    tiktokShopUrl: formData.get("tiktokShopUrl") ?? "",
    imageUrl:
      formData.get("imageMode") === "custom"
        ? (formData.get("imageUrl") ?? "")
        : "",
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    categoryIds: formData.getAll("categoryIds"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Data tak sah" };
  const { id, categoryIds, ...data } = parsed.data;

  if (!data.shopeeUrl && !data.tiktokShopUrl)
    return { error: "Isi sekurang-kurangnya link Shopee atau TikTok Shop." };
  if (categoryIds.length === 0)
    return { error: "Pilih sekurang-kurangnya satu subkategori." };

  // Produk hanya boleh dilink ke subkategori (bukan kategori utama)
  const valid = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(inArray(categories.id, categoryIds), isNotNull(categories.parentId)),
    );
  if (valid.length !== new Set(categoryIds).size)
    return { error: "Ada kategori yang tak sah. Refresh page dan cuba lagi." };

  const values = {
    ...data,
    tiktokVideoId: data.tiktokUrl ? extractTikTokVideoId(data.tiktokUrl) : null,
  };

  await db.transaction(async (tx) => {
    let productId = id;
    if (productId) {
      const updated = await tx
        .update(products)
        .set(values)
        .where(eq(products.id, productId))
        .returning({ id: products.id });
      if (updated.length === 0) throw new Error("Produk tak dijumpai");
      await tx
        .delete(productCategories)
        .where(eq(productCategories.productId, productId));
    } else {
      const [row] = await tx
        .insert(products)
        .values(values)
        .returning({ id: products.id });
      productId = row.id;
    }
    await tx.insert(productCategories).values(
      [...new Set(categoryIds)].map((categoryId) => ({
        productId: productId!,
        categoryId,
      })),
    );
  });

  refreshPublic();
  redirect(`/admin/produk?saved=${encodeURIComponent(data.name)}`);
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (Number.isInteger(id))
    await db.delete(products).where(eq(products.id, id));
  refreshPublic();
  redirect("/admin/produk");
}

export async function toggleProductActive(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const next = formData.get("next") === "true";
  if (Number.isInteger(id))
    await db
      .update(products)
      .set({ isActive: next })
      .where(eq(products.id, id));
  refreshPublic();
  revalidatePath("/admin/produk");
}

// ─── Kategori ────────────────────────────────────────────────────────────────

function backToCategories(params?: Record<string, string>): never {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  redirect(`/admin/kategori${qs}`);
}

async function uniqueSlug(base: string) {
  let slug = base || "kategori";
  for (let i = 2; ; i++) {
    const exists = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
      columns: { id: true },
    });
    if (!exists) return slug;
    slug = `${base}-${i}`;
  }
}

const nameSchema = z.string().trim().min(1, "Nama tak boleh kosong").max(80);

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const name = nameSchema.safeParse(formData.get("name") ?? "");
  if (!name.success) backToCategories({ error: name.error.issues[0].message });

  const parentId = formData.get("parentId")
    ? Number(formData.get("parentId"))
    : null;
  let base = slugify(name.data);
  if (parentId) {
    const parent = await db.query.categories.findFirst({
      where: and(eq(categories.id, parentId), isNull(categories.parentId)),
    });
    if (!parent) backToCategories({ error: "Kategori induk tak dijumpai" });
    base = `${parent.slug}-${base}`;
  }

  const [{ n }] = await db
    .select({ n: count() })
    .from(categories)
    .where(
      parentId
        ? eq(categories.parentId, parentId)
        : isNull(categories.parentId),
    );

  await db.insert(categories).values({
    name: name.data,
    slug: await uniqueSlug(base),
    parentId,
    sortOrder: n,
  });
  refreshPublic();
  backToCategories(parentId ? { open: String(parentId) } : undefined);
}

export async function updateCategory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = nameSchema.safeParse(formData.get("name") ?? "");
  if (!name.success) backToCategories({ error: name.error.issues[0].message });
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;
  // Slug tak diubah bila rename supaya link lama yang dah dikongsi tak rosak.
  const [row] = await db
    .update(categories)
    .set({
      name: name.data,
      isActive: formData.get("isActive") === "on",
      ...(formData.has("imageUrl") ? { imageUrl } : {}),
    })
    .where(eq(categories.id, id))
    .returning({ parentId: categories.parentId });
  refreshPublic();
  backToCategories({ open: String(row?.parentId ?? id) });
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const cat = await db.query.categories.findFirst({
    where: eq(categories.id, id),
  });
  if (!cat) backToCategories();

  const [{ subs }] = await db
    .select({ subs: count() })
    .from(categories)
    .where(eq(categories.parentId, id));
  if (subs > 0)
    backToCategories({
      error: `"${cat.name}" masih ada ${subs} subkategori. Padam atau pindah dulu.`,
    });

  const [{ items }] = await db
    .select({ items: count() })
    .from(productCategories)
    .where(eq(productCategories.categoryId, id));
  if (items > 0)
    backToCategories({
      error: `"${cat.name}" masih ada ${items} produk. Buang produk dari subkategori ni dulu.`,
    });

  await db.delete(categories).where(eq(categories.id, id));
  refreshPublic();
  backToCategories(cat.parentId ? { open: String(cat.parentId) } : undefined);
}

/** Naik / turun satu kedudukan dalam kumpulan yang sama. */
export async function moveCategory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const dir = formData.get("dir") === "up" ? -1 : 1;
  const cat = await db.query.categories.findFirst({
    where: eq(categories.id, id),
  });
  if (!cat) backToCategories();

  const siblings = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      cat.parentId
        ? eq(categories.parentId, cat.parentId)
        : isNull(categories.parentId),
    )
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  const order = siblings.map((s) => s.id);
  const i = order.indexOf(id);
  const j = i + dir;
  if (j >= 0 && j < order.length) {
    [order[i], order[j]] = [order[j], order[i]];
    await db.transaction(async (tx) => {
      for (const [idx, catId] of order.entries()) {
        await tx
          .update(categories)
          .set({ sortOrder: idx })
          .where(and(eq(categories.id, catId), ne(categories.sortOrder, idx)));
      }
    });
    refreshPublic();
  }
  backToCategories(cat.parentId ? { open: String(cat.parentId) } : undefined);
}

// ─── Tetapan Kedai ──────────────────────────────────────────────────────────

const hexColor = /^#[0-9a-fA-F]{6}$/;

const settingsSchema = z.object({
  storeName: z.string().trim().min(1, "Nama kedai tak boleh kosong").max(100),
  tagline: z.string().trim().max(200).default(""),
  aboutContent: z
    .string()
    .trim()
    .max(5000)
    .transform((v) => v || null),
  accentColor: z
    .string()
    .trim()
    .regex(hexColor, "Warna hex tak sah (cth: #b5482a)"),
  bgScheme: z.enum(["cream", "white", "dark"]),
  fontBody: z.string().trim().max(50),
  fontDisplay: z.string().trim().max(50),
  socialTiktok: z
    .string()
    .trim()
    .max(300)
    .transform((v) => v || null),
  socialShopee: z
    .string()
    .trim()
    .max(300)
    .transform((v) => v || null),
  socialInstagram: z
    .string()
    .trim()
    .max(300)
    .transform((v) => v || null),
  customDomain: z
    .string()
    .trim()
    .max(200)
    .transform((v) => v || null),
  ownerEmail: z
    .string()
    .trim()
    .max(200)
    .transform((v) => v || null),
});

export async function saveSettings(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = settingsSchema.safeParse({
    storeName: formData.get("storeName") ?? "",
    tagline: formData.get("tagline") ?? "",
    aboutContent: formData.get("aboutContent") ?? "",
    accentColor: formData.get("accentColor") ?? "#b5482a",
    bgScheme: formData.get("bgScheme") ?? "cream",
    fontBody: formData.get("fontBody") ?? "plus-jakarta-sans",
    fontDisplay: formData.get("fontDisplay") ?? "fraunces",
    socialTiktok: formData.get("socialTiktok") ?? "",
    socialShopee: formData.get("socialShopee") ?? "",
    socialInstagram: formData.get("socialInstagram") ?? "",
    customDomain: formData.get("customDomain") ?? "",
    ownerEmail: formData.get("ownerEmail") ?? "",
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Data tak sah" };

  const existing = await db.query.siteSettings.findFirst({
    where: eq(siteSettings.id, 1),
  });
  if (existing) {
    await db
      .update(siteSettings)
      .set(parsed.data)
      .where(eq(siteSettings.id, 1));
  } else {
    await db.insert(siteSettings).values(parsed.data);
  }

  refreshPublic();
  revalidatePath("/admin/tetapan");
  redirect("/admin/tetapan?saved=1");
}

// ─── Upload Logo/Favicon ────────────────────────────────────────────────────

export async function uploadImage(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string; // "logo" | "favicon"
  if (!file || file.size === 0) return { error: "Tiada fail dipilih" };

  try {
    const { uploadFile } = await import("@/lib/storage");
    const ext = file.name.split(".").pop() ?? "png";
    const key = `brand/${type}-${Date.now()}.${ext}`;
    const url = await uploadFile(file, key);

    const field = type === "favicon" ? "faviconUrl" : "logoUrl";
    const existing = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.id, 1),
    });
    if (existing) {
      await db
        .update(siteSettings)
        .set({ [field]: url })
        .where(eq(siteSettings.id, 1));
    } else {
      await db.insert(siteSettings).values({ [field]: url });
    }

    refreshPublic();
    revalidatePath("/admin/tetapan");
    return { url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal muat naik" };
  }
}

// ─── Magic Link Auth ────────────────────────────────────────────────────────

export async function requestMagicLink(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "Sila masukkan email." };

  const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase();
  if (!ownerEmail) return { error: "OWNER_EMAIL belum dikonfigurasi." };
  // Elak timing-based enumeration — selalu return mesej yang sama
  if (email !== ownerEmail) {
    return { error: "sent" };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minit

  await db.insert(magicLinkTokens).values({ email, token, expiresAt });

  const { headers } = await import("next/headers");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const baseUrl = `${proto}://${host}`;

  try {
    const { sendMagicLink } = await import("@/lib/email");
    await sendMagicLink(email, token, baseUrl);
  } catch {
    return { error: "Gagal hantar email. Cuba lagi." };
  }

  return { error: "sent" };
}
