"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "../actions";

const base =
  "flex min-h-[60px] items-center justify-center text-[13px] font-semibold";

export function AdminNav() {
  const path = usePathname();
  const on = (prefix: string, exact = false) =>
    exact ? path === prefix : path.startsWith(prefix);
  const cls = (active: boolean) =>
    `${base} ${active ? "border-t-[3px] border-accent font-bold text-accent" : "text-muted hover:text-ink"}`;

  return (
    <nav
      aria-label="Menu admin"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-white"
    >
      <div className="mx-auto grid max-w-2xl grid-cols-5">
        <Link
          href="/admin"
          aria-current={on("/admin", true) ? "page" : undefined}
          className={cls(on("/admin", true))}
        >
          Utama
        </Link>
        <Link
          href="/admin/produk"
          aria-current={on("/admin/produk") ? "page" : undefined}
          className={cls(on("/admin/produk"))}
        >
          Produk
        </Link>
        <Link
          href="/admin/kategori"
          aria-current={on("/admin/kategori") ? "page" : undefined}
          className={cls(on("/admin/kategori"))}
        >
          Kategori
        </Link>
        <Link
          href="/admin/tetapan"
          aria-current={on("/admin/tetapan") ? "page" : undefined}
          className={cls(on("/admin/tetapan"))}
        >
          Tetapan
        </Link>
        <form action={logout} className="contents">
          <button type="submit" className={cls(false)}>
            Keluar
          </button>
        </form>
      </div>
    </nav>
  );
}
