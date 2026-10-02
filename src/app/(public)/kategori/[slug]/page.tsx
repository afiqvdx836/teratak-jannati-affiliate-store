import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ChevronLeft } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { db } from "@/db";
import { productCategories } from "@/db/schema";
import { getCategoryBySlug, getProductsInCategories } from "@/lib/queries";
import { inArray } from "drizzle-orm";

export async function generateMetadata({ params }: PageProps<"/kategori/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  return { title: cat?.name ?? "Kategori" };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/kategori/[slug]">) {
  await connection();
  const { slug } = await params;
  const { sub } = await searchParams;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();

  const activeSub = typeof sub === "string" ? cat.children.find((c) => c.slug === sub) : undefined;
  const filterIds = activeSub ? [activeSub.id] : cat.children.map((c) => c.id);
  const items = await getProductsInCategories(filterIds);

  // Label subkategori pada setiap kad (subkategori pertama yang padan dalam kategori ni)
  const links = items.length
    ? await db
        .select()
        .from(productCategories)
        .where(inArray(productCategories.productId, items.map((p) => p.id)))
    : [];
  const subName = new Map(cat.children.map((c) => [c.id, c.name]));
  const labelFor = (productId: number) =>
    links.filter((l) => l.productId === productId && subName.has(l.categoryId)).map((l) => subName.get(l.categoryId))[0];

  const chip = "flex h-10 shrink-0 items-center rounded-full border px-4 text-sm";
  return (
    <>
      <header className="flex flex-col gap-3 px-5 pb-2 pt-5">
        <Link href="/" className="flex min-h-11 items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
          <ChevronLeft size={18} /> Semua kategori
        </Link>
        <h1 className="font-display text-[34px] font-semibold leading-none">{cat.name}</h1>
      </header>

      <nav aria-label="Subkategori" className="flex gap-2 overflow-x-auto px-5 py-2">
        <Link
          href={`/kategori/${cat.slug}`}
          aria-current={!activeSub ? "page" : undefined}
          className={`${chip} ${!activeSub ? "border-ink bg-ink font-semibold text-white" : "border-line-strong bg-white"}`}
        >
          Semua
        </Link>
        {cat.children.map((s) => {
          const on = activeSub?.id === s.id;
          return (
            <Link
              key={s.id}
              href={`/kategori/${cat.slug}?sub=${s.slug}`}
              aria-current={on ? "page" : undefined}
              className={`${chip} ${on ? "border-ink bg-ink font-semibold text-white" : "border-line-strong bg-white"}`}
            >
              {s.name}
            </Link>
          );
        })}
      </nav>

      <p className="px-5 py-3 text-[13px] text-muted">
        {items.length} produk{activeSub ? ` dalam ${activeSub.name}` : ""}
      </p>

      {items.length === 0 ? (
        <p className="px-5 text-sm text-muted">Belum ada produk di sini.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 px-5 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} subLabel={activeSub ? undefined : labelFor(p.id)} />
          ))}
        </div>
      )}
    </>
  );
}
