import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ChevronLeft } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { SearchBox } from "@/components/search-box";
import { searchProducts } from "@/lib/queries";

export const metadata: Metadata = { title: "Cari" };

export default async function SearchPage({ searchParams }: PageProps<"/cari">) {
  await connection();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const results = query ? await searchProducts(query) : [];

  // Taip nombor tepat → terus ke produk
  const asCode = query.replace(/^#/, "");
  if (/^\d+$/.test(asCode)) {
    const exact = results.find((p) => p.code === Number(asCode));
    if (exact) redirect(`/p/${exact.code}`);
  }

  return (
    <div className="flex flex-col gap-5 px-5 pt-5">
      <Link href="/" className="flex min-h-11 items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ChevronLeft size={18} /> Laman utama
      </Link>
      <SearchBox defaultValue={query} />
      {query && (
        <p className="text-[13px] text-muted">
          {results.length} hasil untuk “{query}”
        </p>
      )}
      <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
        {results.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
