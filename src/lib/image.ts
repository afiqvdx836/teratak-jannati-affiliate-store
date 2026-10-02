import type { Product } from "@/db/schema";

/**
 * Gambar produk: gambar manual kalau ada, kalau tak guna thumbnail TikTok.
 * Thumbnail TikTok expire selepas beberapa hari, jadi kita lalu /thumb/[code]
 * yang ambil URL fresh dari oEmbed setiap kali cache tamat.
 */
export function productImage(p: Pick<Product, "imageUrl" | "tiktokUrl" | "code">): string | null {
  if (p.imageUrl) return p.imageUrl;
  if (p.tiktokUrl) return `/thumb/${p.code}`;
  return null;
}
