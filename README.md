# Affiliate Storefront

Website "link in bio" untuk produk affiliate Shopee/TikTok. Followers cari produk ikut nombor dalam video, admin (wife) urus kategori, subkategori dan produk dari phone.

**Stack:** Next.js 16 (App Router) · Drizzle ORM · PostgreSQL · Tailwind v4 · auth password tunggal (JWT cookie)

## Setup local

```bash
cp .env.example .env          # isi DATABASE_URL, ADMIN_PASSWORD, AUTH_SECRET
npm install
npm run db:migrate            # buat table
npm run db:seed               # kategori permulaan (Dapur, Bilik Tidur, …)
npm run dev
```

- Public: http://localhost:3000
- Admin: http://localhost:3000/admin (login guna `ADMIN_PASSWORD`)

Jana `AUTH_SECRET`: `openssl rand -base64 32`

## Deploy (Vercel + Neon, free tier)

1. Buat database di [neon.tech](https://neon.tech), copy connection string (pooled).
2. Push repo ke GitHub → import dalam Vercel.
3. Set env vars `DATABASE_URL`, `ADMIN_PASSWORD`, `AUTH_SECRET` dalam Vercel.
4. Dari local, jalankan `npm run db:migrate` dan `npm run db:seed` dengan `DATABASE_URL` Neon.
5. Sambung custom domain dalam Vercel → letak link dalam bio TikTok.

## Struktur

```
src/
  db/schema.ts            categories (parent_id), products, product_categories (many-to-many)
  db/seed.ts              kategori permulaan
  lib/queries.ts          query public
  lib/tiktok.ts           extract video ID, resolve link pendek, oEmbed
  lib/auth.ts             login/session
  proxy.ts                lindungi /admin/*
  app/(public)/           /, /kategori/[slug]?sub=, /p/[code], /cari?q=
  app/go/[code]/[target]  kira klik → redirect ke Shopee / TikTok / TikTok Shop
  app/thumb/[code]        thumbnail TikTok yang sentiasa fresh
  app/admin/              login, produk (senarai + borang), kategori
```

## Nota reka bentuk

- **Nombor produk (`code`)** auto-increment dan jadi URL (`/p/128`). Taip nombor tepat di carian → terus ke produk.
- **Produk ↔ subkategori many-to-many.** Produk hanya boleh dilink ke subkategori, bukan kategori utama.
- **Padam dilindungi:** kategori yang masih ada subkategori, atau subkategori yang masih ada produk, tak boleh dipadam.
- **Slug kekal bila rename** supaya link yang dah dikongsi tak rosak.
- **Thumbnail TikTok expire**, jadi gambar lalu `/thumb/[code]` yang ambil URL baru dari oEmbed (cache 6 jam). Boleh override dengan link gambar sendiri.
- **Klik dikira** melalui `/go/[code]/shopee|tiktok|tiktokshop` (lajur `clicks_shopee`, `clicks_tiktok`).
- Link affiliate guna `rel="nofollow sponsored"`, dan footer ada disclosure.

## Idea seterusnya

- Upload gambar (Vercel Blob / Cloudflare R2)
- Drag-to-reorder (sekarang guna butang naik/turun)
- Analytics klik ikut minggu, bulk import CSV, PWA untuk admin
