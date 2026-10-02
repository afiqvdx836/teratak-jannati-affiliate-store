import Link from "next/link";
import { getSiteSettings } from "@/lib/queries";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettings();
  const socials = [
    { label: "TikTok", url: settings.socialTiktok },
    { label: "Shopee", url: settings.socialShopee },
    { label: "Instagram", url: settings.socialInstagram },
  ].filter((s) => s.url);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col">
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="mt-10 border-t border-line px-5 py-6">
        {socials.length > 0 && (
          <nav className="flex gap-4 pb-4 text-[13px] font-semibold">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-ink"
              >
                {s.label}
              </a>
            ))}
          </nav>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] leading-relaxed text-muted">
          <span>
            Sebahagian link di laman ini ialah link affiliate. Kami mungkin
            dapat komisen kecil tanpa kos tambahan kepada anda.
          </span>
          {settings.aboutContent && (
            <Link href="/tentang" className="font-semibold hover:text-ink">
              Tentang kami
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
