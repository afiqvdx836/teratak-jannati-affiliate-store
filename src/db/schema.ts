import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

/**
 * Kategori & subkategori dalam satu table.
 * parentId = null  → kategori utama (Dapur, Bilik Tidur…)
 * parentId = <id>  → subkategori (Kabinet Sinki…)
 * UI hadkan kepada 2 level sahaja.
 */
export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    parentId: integer("parent_id").references(
      (): AnyPgColumn => categories.id,
      {
        onDelete: "restrict",
      },
    ),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("categories_parent_idx").on(t.parentId)],
);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    /** Nombor yang disebut dalam video ("cari no. 128"). Auto-increment. */
    code: serial("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    shopeeUrl: text("shopee_url"),
    tiktokUrl: text("tiktok_url"),
    tiktokVideoId: text("tiktok_video_id"),
    tiktokShopUrl: text("tiktok_shop_url"),
    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    clicksShopee: integer("clicks_shopee").notNull().default(0),
    clicksTiktok: integer("clicks_tiktok").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("products_active_idx").on(t.isActive, t.isFeatured)],
);

/** Many-to-many: satu produk boleh masuk banyak subkategori. */
export const productCategories = pgTable(
  "product_categories",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.categoryId] }),
    index("product_categories_category_idx").on(t.categoryId),
  ],
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "parent_child",
  }),
  children: many(categories, { relationName: "parent_child" }),
  productLinks: many(productCategories),
}));

export const productsRelations = relations(products, ({ many }) => ({
  categoryLinks: many(productCategories),
}));

export const productCategoriesRelations = relations(
  productCategories,
  ({ one }) => ({
    product: one(products, {
      fields: [productCategories.productId],
      references: [products.id],
    }),
    category: one(categories, {
      fields: [productCategories.categoryId],
      references: [categories.id],
    }),
  }),
);

/**
 * Tetapan kedai — satu baris sahaja (id = 1).
 * Simpan branding, pautan sosial, domain, dan email pemilik.
 */
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull().default("[Nama Brand]"),
  tagline: text("tagline")
    .notNull()
    .default("Semua link produk dari video TikTok kami"),
  aboutContent: text("about_content"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  accentColor: text("accent_color").notNull().default("#b5482a"),
  bgScheme: text("bg_scheme").notNull().default("cream"),
  fontBody: text("font_body").notNull().default("plus-jakarta-sans"),
  fontDisplay: text("font_display").notNull().default("fraunces"),
  socialTiktok: text("social_tiktok"),
  socialShopee: text("social_shopee"),
  socialInstagram: text("social_instagram"),
  customDomain: text("custom_domain"),
  ownerEmail: text("owner_email"),
  ...timestamps,
});

/**
 * Token magic link untuk login tanpa password.
 */
export const magicLinkTokens = pgTable("magic_link_tokens", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  ...timestamps,
});

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
