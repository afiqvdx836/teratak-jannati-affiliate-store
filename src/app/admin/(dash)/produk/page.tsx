/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { connection } from "next/server";
import { and, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { PencilIcon, PlusIcon } from "@/components/icons";
import { db } from "@/db";
import { productCategories, products } from "@/db/schema";
import { productImage } from "@/lib/image";
import { getCategoryTree } from "@/lib/queries";

export default async function AdminProductsPage({
  searchParams,
}: PageProps<"/admin">) {
  await connection();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const cat = typeof sp.cat === "string" ? Number(sp.cat) : NaN;
  const status =
    sp.status === "active" || sp.status === "hidden" ? sp.status : "all";
  const saved = typeof sp.saved === "string" ? sp.saved : null;

  const tree = await getCategoryTree();

  const where: SQL[] = [];
  if (q) {
    const term = q.replace(/^#/, "");
    where.push(
      /^\d+$/.test(term)
        ? or(
            eq(products.code, Number(term)),
            ilike(products.name, `%${term}%`),
          )!
        : ilike(products.name, `%${term.replace(/[%_\\]/g, "\\$&")}%`),
    );
  }
  if (status !== "all") where.push(eq(products.isActive, status === "active"));
  if (Number.isInteger(cat)) {
    const parent = tree.find((t) => t.id === cat);
    const ids = parent ? parent.children.map((c) => c.id) : [cat];
    if (ids.length) {
      where.push(
        inArray(
          products.id,
          db
            .selectDistinct({ id: productCategories.productId })
            .from(productCategories)
            .where(inArray(productCategories.categoryId, ids)),
        ),
      );
    }
  }

  const list = await db.query.products.findMany({
    where: where.length ? and(...where) : undefined,
    orderBy: [desc(products.createdAt)],
    limit: 200,
    with: {
      categoryLinks: {
        with: { category: { with: { parent: { columns: { name: true } } } } },
      },
    },
  });

  const select =
    "h-10 rounded-[10px] border border-line-strong bg-white px-2 text-sm text-ink";

  return (
    <>
      <header className="flex items-center justify-between px-5 pb-4 pt-6">
        <div>
          <p className="text-xs font-semibold tracking-wider text-muted">
            ADMIN
          </p>
          <h1 className="font-display text-[26px] font-semibold">Produk</h1>
        </div>
        <Link
          href="/admin/produk/baru"
          className="flex h-11 items-center gap-1.5 rounded-xl bg-ink px-4 text-sm font-bold text-white"
        >
          <PlusIcon size={18} strokeWidth={2.2} /> Produk
        </Link>
      </header>

      {saved && (
        <p
          role="status"
          className="mx-4 mb-3 rounded-xl bg-ok-bg px-4 py-3 text-sm font-semibold text-ok"
        >
          Disimpan: {saved}
        </p>
      )}

      <form method="get" className="flex flex-col gap-2.5 px-5 pb-3">
        <label htmlFor="admin-q" className="sr-only">
          Cari produk
        </label>
        <input
          id="admin-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Cari nama atau no. produk"
          className="h-[46px] rounded-xl border border-line-strong bg-white px-3.5 text-[15px]"
        />
        <div className="flex items-end gap-2">
          <label className="flex flex-1 flex-col gap-1 text-xs text-muted">
            Kategori
            <select
              name="cat"
              defaultValue={Number.isInteger(cat) ? String(cat) : ""}
              className={select}
            >
              <option value="">Semua</option>
              {tree.map((t) => (
                <optgroup key={t.id} label={t.name}>
                  <option value={t.id}>Semua dalam {t.name}</option>
                  {t.children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs text-muted">
            Status
            <select name="status" defaultValue={status} className={select}>
              <option value="all">Semua</option>
              <option value="active">Aktif</option>
              <option value="hidden">Tersembunyi</option>
            </select>
          </label>
          <button
            type="submit"
            className="h-10 rounded-[10px] bg-ink px-4 text-sm font-bold text-white"
          >
            Tapis
          </button>
        </div>
      </form>

      {list.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted">
          Tiada produk. Tekan &quot;+ Produk&quot; untuk mula.
        </p>
      ) : (
        <ul className="flex flex-col gap-2 px-4">
          {list.map((p) => {
            const img = productImage(p);
            const labels = p.categoryLinks.map(
              (l) => `${l.category.parent?.name ?? ""} › ${l.category.name}`,
            );
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-[14px] border border-line bg-white p-2.5"
              >
                <div className="relative h-[72px] w-14 shrink-0 overflow-hidden rounded-[10px] bg-video">
                  {img && (
                    <img
                      src={img}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-muted">
                      #{p.code}
                    </span>
                    {p.isActive ? (
                      <span className="rounded-full bg-ok-bg px-2 py-0.5 text-[11px] font-bold text-ok">
                        Aktif
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#EDE7DF] px-2 py-0.5 text-[11px] font-bold text-[#5A4F45]">
                        Tersembunyi
                      </span>
                    )}
                    {p.isFeatured && (
                      <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-bold">
                        Pilihan
                      </span>
                    )}
                  </div>
                  <span className="truncate text-sm font-semibold">
                    {p.name}
                  </span>
                  <span className="truncate text-xs text-muted">
                    {labels[0] ?? "Tiada kategori"}
                    {labels.length > 1 ? `  +${labels.length - 1}` : ""}
                  </span>
                  <span className="text-[11px] text-muted">
                    Klik: Shopee {p.clicksShopee} · TikTok {p.clicksTiktok}
                  </span>
                </div>
                <Link
                  href={`/admin/produk/${p.id}`}
                  aria-label={`Edit ${p.name}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-[#4A423A] hover:bg-chip"
                >
                  <PencilIcon size={18} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
