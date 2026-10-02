import { connection } from "next/server";
import { getSiteSettings } from "@/lib/queries";
import { SettingsForm } from "./settings-form";

export default async function TetapanPage({
  searchParams,
}: PageProps<"/admin">) {
  await connection();
  const sp = await searchParams;
  const saved = sp.saved === "1";
  const settings = await getSiteSettings();

  return (
    <>
      <header className="px-5 pb-4 pt-6">
        <p className="text-xs font-semibold tracking-wider text-muted">ADMIN</p>
        <h1 className="font-display text-[26px] font-semibold">Tetapan</h1>
      </header>

      {saved && (
        <p
          role="status"
          className="mx-4 mb-3 rounded-xl bg-ok-bg px-4 py-3 text-sm font-semibold text-ok"
        >
          Tetapan disimpan.
        </p>
      )}

      <SettingsForm settings={settings} />
    </>
  );
}
