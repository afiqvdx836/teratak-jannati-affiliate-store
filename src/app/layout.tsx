import type { Metadata, Viewport } from "next";
// Font self-hosted (tak perlu fetch Google Fonts masa build)
import "@fontsource-variable/fraunces";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { getSiteSettings } from "@/lib/queries";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: { default: s.storeName, template: `%s · ${s.storeName}` },
    description: s.tagline,
    ...(s.faviconUrl && { icons: { icon: s.faviconUrl } }),
  };
}

export const viewport: Viewport = { themeColor: "#f6f1ea" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const s = await getSiteSettings();

  return (
    <html lang="ms" className="h-full antialiased" data-scheme={s.bgScheme}>
      <body
        className="min-h-full font-sans"
        style={{ "--color-accent": s.accentColor } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}
