import Link from "next/link";
import { connection } from "next/server";
import { PlusIcon } from "@/components/icons";
import { getDashboardStats, getSiteSettings } from "@/lib/queries";

export default async function DashboardPage() {
  await connection();
  const [stats, settings] = await Promise.all([
    getDashboardStats(),
    getSiteSettings(),
  ]);
  const totalClicks = stats.totalClicksShopee + stats.totalClicksTiktok;

  return (
    <>
      <header className="px-5 pb-4 pt-6">
        <p className="text-xs font-semibold tracking-wider text-muted">ADMIN</p>
        <h1 className="font-display text-[26px] font-semibold">
          {settings.storeName}
        </h1>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 px-5 pb-5">
        <StatCard label="Produk" value={stats.totalProducts} />
        <StatCard label="Aktif" value={stats.activeProducts} />
        <StatCard label="Klik Shopee" value={stats.totalClicksShopee} />
        <StatCard label="Klik TikTok" value={stats.totalClicksTiktok} />
      </div>

      {totalClicks > 0 && (
        <div className="mx-5 mb-5 rounded-xl border border-line bg-white p-4">
          <p className="text-sm font-bold">Jumlah Klik</p>
          <p className="font-display text-2xl font-semibold">
            {totalClicks.toLocaleString("ms-MY")}
          </p>
        </div>
      )}

      {/* Top products */}
      {stats.topProducts.length > 0 && (
        <section className="px-5 pb-5">
          <h2 className="pb-3 text-sm font-bold">Produk Teratas</h2>
          <ul className="flex flex-col gap-2">
            {stats.topProducts.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-chip text-xs font-bold">
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold">
                    {p.name}
                  </span>
                  <span className="text-xs text-muted">
                    #{p.code} · Shopee {p.clicksShopee} · TikTok{" "}
                    {p.clicksTiktok}
                  </span>
                </div>
                <Link
                  href={`/admin/produk/${p.id}`}
                  className="text-xs font-bold text-accent hover:underline"
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Quick actions */}
      <section className="px-5 pb-5">
        <h2 className="pb-3 text-sm font-bold">Tindakan Pantas</h2>
        <div className="flex flex-col gap-2">
          <Link
            href="/admin/produk/baru"
            className="flex h-12 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold hover:border-ink"
          >
            <PlusIcon size={16} strokeWidth={2.2} /> Tambah produk baru
          </Link>
          <Link
            href="/admin/kategori"
            className="flex h-12 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold hover:border-ink"
          >
            Urus kategori
          </Link>
          <Link
            href="/admin/tetapan"
            className="flex h-12 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold hover:border-ink"
          >
            Tetapan kedai
          </Link>
          <Link
            href="/"
            target="_blank"
            className="flex h-12 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold hover:border-ink"
          >
            Lihat site
          </Link>
        </div>
      </section>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="font-display text-2xl font-semibold">
        {value.toLocaleString("ms-MY")}
      </p>
    </div>
  );
}
