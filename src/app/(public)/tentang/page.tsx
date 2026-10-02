import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSiteSettings } from "@/lib/queries";

export const metadata: Metadata = { title: "Tentang Kami" };

export default async function TentangPage() {
  const settings = await getSiteSettings();
  if (!settings.aboutContent) redirect("/");

  return (
    <article className="px-5 pb-8 pt-7">
      <h1 className="font-display text-[26px] font-semibold">
        Tentang {settings.storeName}
      </h1>
      <div className="prose mt-4 max-w-none whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
        {settings.aboutContent}
      </div>
    </article>
  );
}
