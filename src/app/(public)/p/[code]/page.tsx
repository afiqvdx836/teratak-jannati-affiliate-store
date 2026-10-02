/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BagIcon, ChevronLeft, ExternalIcon } from "@/components/icons";
import { productImage } from "@/lib/image";
import { getProductByCode } from "@/lib/queries";

async function load(codeParam: string) {
  const code = Number(codeParam);
  if (!Number.isInteger(code) || code <= 0) return null;
  return getProductByCode(code);
}

export async function generateMetadata({ params }: PageProps<"/p/[code]">): Promise<Metadata> {
  const p = await load((await params).code);
  return p ? { title: `#${p.code} ${p.name}` } : { title: "Produk" };
}

export default async function ProductPage({ params }: PageProps<"/p/[code]">) {
  await connection();
  const p = await load((await params).code);
  if (!p) notFound();

  const cats = p.categoryLinks
    .map((l) => l.category)
    .filter((c) => c.isActive && c.parent)
    .map((c) => ({ label: `${c.parent!.name} › ${c.name}`, href: `/kategori/${c.parent!.slug}?sub=${c.slug}` }));
  const back = cats[0];
  const img = productImage(p);

  return (
    <article className="mx-auto flex w-full max-w-md flex-col">
      <nav aria-label="Breadcrumb" className="flex min-h-11 items-center gap-1.5 px-5 pt-5 text-[13px] text-muted">
        <Link href={back?.href ?? "/"} className="flex items-center gap-1 font-semibold hover:text-ink">
          <ChevronLeft size={18} /> {back ? back.label.split(" › ")[0] : "Laman utama"}
        </Link>
        {back && (
          <>
            <span aria-hidden="true">/</span>
            <span>{back.label.split(" › ")[1]}</span>
          </>
        )}
      </nav>

      <header className="flex flex-col gap-2 px-5 pb-4 pt-2">
        <span className="self-start rounded-full bg-ink px-2.5 py-1 text-[13px] font-bold text-white">No. {p.code}</span>
        <h1 className="font-display text-[28px] font-semibold leading-tight">{p.name}</h1>
      </header>

      <div className="px-5">
        {p.tiktokVideoId ? (
          <div className="overflow-hidden rounded-[18px] bg-black">
            <iframe
              src={`https://www.tiktok.com/player/v1/${p.tiktokVideoId}?music_info=0&description=0&rel=0`}
              title={`Video TikTok: ${p.name}`}
              allow="encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              className="aspect-[9/16] w-full border-0"
            />
          </div>
        ) : img ? (
          <img src={img} alt={p.name} className="aspect-square w-full rounded-[18px] object-cover" />
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5 px-5 pt-4">
        {p.shopeeUrl && (
          <a
            href={`/go/${p.code}/shopee`}
            rel="nofollow sponsored noopener"
            target="_blank"
            className="flex h-[54px] items-center justify-center gap-2 rounded-[14px] bg-shopee text-base font-bold text-white hover:brightness-110"
          >
            <BagIcon /> Beli di Shopee
          </a>
        )}
        {p.tiktokShopUrl && (
          <a
            href={`/go/${p.code}/tiktokshop`}
            rel="nofollow sponsored noopener"
            target="_blank"
            className="flex h-[50px] items-center justify-center gap-2 rounded-[14px] bg-ink text-[15px] font-bold text-white hover:brightness-125"
          >
            <BagIcon size={18} /> Beli di TikTok Shop
          </a>
        )}
        {p.tiktokUrl && (
          <a
            href={`/go/${p.code}/tiktok`}
            rel="noopener"
            target="_blank"
            className="flex h-[50px] items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-ink bg-white text-[15px] font-bold hover:bg-chip"
          >
            <ExternalIcon size={18} /> Tengok di TikTok
          </a>
        )}
      </div>

      {p.description && (
        <section className="mx-5 mt-5 flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-4">
          <h2 className="text-sm font-bold">Nota kami</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-[#4A423A]">{p.description}</p>
        </section>
      )}

      {cats.length > 0 && (
        <section className="flex flex-col gap-2.5 px-5 pt-5">
          <h2 className="text-sm font-bold">Ada dalam</h2>
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <Link key={c.href} href={c.href} className="flex h-9 items-center rounded-full bg-chip px-3.5 text-[13px] font-semibold hover:bg-line">
                {c.label}
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
