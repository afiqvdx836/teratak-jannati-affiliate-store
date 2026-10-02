/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { connection } from "next/server";
import { ProductThumb } from "@/components/product-card";
import { SearchBox } from "@/components/search-box";
import {
  getCategoryTree,
  getFeaturedProducts,
  getSiteSettings,
} from "@/lib/queries";

const TINTS = [
  "#EADCCB",
  "#DCE3D8",
  "#D8E1E4",
  "#E7D9D9",
  "#E4E0CF",
  "#E1DAE6",
];

export default async function HomePage() {
  await connection();
  const [tree, featured, settings] = await Promise.all([
    getCategoryTree({ activeOnly: true }),
    getFeaturedProducts(),
    getSiteSettings(),
  ]);

  return (
    <>
      <header className="flex items-center gap-3 px-5 pb-5 pt-7">
        {settings.logoUrl ? (
          <img
            src={settings.logoUrl}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E4D5C3] text-[11px] text-muted">
            Logo
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl font-semibold leading-tight">
            {settings.storeName}
          </h1>
          <p className="text-[13px] text-muted">{settings.tagline}</p>
        </div>
      </header>

      <div className="px-5">
        <SearchBox />
      </div>

      <section className="flex flex-col gap-3.5 px-5 pt-7">
        <h2 className="font-display text-[22px] font-semibold">Kategori</h2>
        {tree.length === 0 ? (
          <p className="text-sm text-muted">Belum ada kategori.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tree.map((c, i) => (
              <Link
                key={c.id}
                href={`/kategori/${c.slug}`}
                className="flex flex-col gap-2.5 rounded-2xl border border-line bg-white p-3 hover:border-ink"
              >
                <div
                  className="relative h-[84px] overflow-hidden rounded-[10px]"
                  style={{ background: TINTS[i % TINTS.length] }}
                >
                  {c.imageUrl && (
                    <img
                      src={c.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-bold">{c.name}</span>
                  <span className="text-xs leading-snug text-muted">
                    {c.children
                      .map((s) => s.name)
                      .slice(0, 3)
                      .join(" · ")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {featured.length > 0 && (
        <section className="flex flex-col gap-3.5 pt-7">
          <h2 className="px-5 font-display text-[22px] font-semibold">
            Pilihan minggu ni
          </h2>
          <div className="flex snap-x gap-3 overflow-x-auto px-5 pb-2">
            {featured.map((p) => (
              <Link
                key={p.id}
                href={`/p/${p.code}`}
                className="flex w-[150px] shrink-0 snap-start flex-col gap-2 hover:text-accent"
              >
                <ProductThumb product={p} className="h-[200px]" />
                <span className="text-[13px] font-semibold leading-snug">
                  {p.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
