/* eslint-disable @next/next/no-img-element -- gambar datang dari TikTok CDN / URL luar */
import Link from "next/link";
import type { Product } from "@/db/schema";
import { productImage } from "@/lib/image";
import { BagIcon, PlayIcon } from "./icons";

export function ProductThumb({ product, className = "" }: { product: Product; className?: string }) {
  const img = productImage(product);
  return (
    <div className={`relative overflow-hidden rounded-[14px] bg-video ${className}`}>
      {img && (
        <img src={img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-ink">
        #{product.code}
      </span>
      {product.tiktokVideoId && (
        <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink">
          <PlayIcon />
        </span>
      )}
    </div>
  );
}

export function ProductCard({ product, subLabel }: { product: Product; subLabel?: string }) {
  return (
    <article className="flex flex-col gap-2">
      <Link href={`/p/${product.code}`} className="flex flex-col gap-2 hover:text-accent">
        <ProductThumb product={product} className="aspect-[3/4]" />
        <div className="flex flex-col gap-0.5">
          {subLabel && <span className="text-xs text-muted">{subLabel}</span>}
          <span className="text-sm font-semibold leading-snug">{product.name}</span>
        </div>
      </Link>
      {product.shopeeUrl && (
        <a
          href={`/go/${product.code}/shopee`}
          rel="nofollow sponsored noopener"
          target="_blank"
          className="mt-auto flex h-10 items-center justify-center gap-1.5 rounded-[10px] bg-shopee text-[13px] font-bold text-white hover:brightness-110"
        >
          <BagIcon size={16} /> Shopee
        </a>
      )}
    </article>
  );
}
