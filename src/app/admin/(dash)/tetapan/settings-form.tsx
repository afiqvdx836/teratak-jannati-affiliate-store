"use client";

import { useState, useActionState } from "react";
import type { SiteSettings } from "@/db/schema";
import { saveSettings, uploadImage } from "../../actions";

const input =
  "h-12 rounded-xl border border-line-strong bg-white px-3.5 text-[15px]";
const label = "flex flex-col gap-1.5 text-sm font-bold";
const section = "flex flex-col gap-4 px-5 pb-6";
const sectionTitle = "font-display text-lg font-semibold pt-2";

const FONT_BODY_OPTIONS = [
  { value: "plus-jakarta-sans", label: "Plus Jakarta Sans" },
  { value: "inter", label: "Inter" },
  { value: "dm-sans", label: "DM Sans" },
];

const FONT_DISPLAY_OPTIONS = [
  { value: "fraunces", label: "Fraunces" },
  { value: "dm-serif-display", label: "DM Serif Display" },
  { value: "plus-jakarta-sans", label: "Plus Jakarta Sans" },
];

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState(saveSettings, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      {state?.error && (
        <p
          role="alert"
          className="mx-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-danger"
        >
          {state.error}
        </p>
      )}

      {/* Identiti Kedai */}
      <div className={section}>
        <h2 className={sectionTitle}>Identiti Kedai</h2>
        <label className={label}>
          Nama kedai
          <input
            name="storeName"
            type="text"
            defaultValue={settings.storeName}
            required
            className={input}
          />
        </label>
        <label className={label}>
          Tagline
          <input
            name="tagline"
            type="text"
            defaultValue={settings.tagline}
            className={input}
          />
        </label>
        <label className={label}>
          Tentang (About)
          <textarea
            name="aboutContent"
            defaultValue={settings.aboutContent ?? ""}
            rows={4}
            className="rounded-xl border border-line-strong bg-white px-3.5 py-3 text-[15px]"
          />
        </label>
      </div>

      <hr className="border-line" />

      {/* Logo & Favicon */}
      <div className={section}>
        <h2 className={sectionTitle}>Logo & Favicon</h2>
        <ImageUpload
          type="logo"
          currentUrl={settings.logoUrl}
          label="Logo kedai"
        />
        <ImageUpload
          type="favicon"
          currentUrl={settings.faviconUrl}
          label="Favicon"
        />
      </div>

      <hr className="border-line" />

      {/* Penjenamaan */}
      <div className={section}>
        <h2 className={sectionTitle}>Penjenamaan</h2>
        <label className={label}>
          Warna aksen
          <div className="flex items-center gap-3">
            <input
              name="accentColor"
              type="color"
              defaultValue={settings.accentColor}
              className="h-10 w-14 cursor-pointer rounded-lg border border-line-strong"
            />
            <input
              type="text"
              defaultValue={settings.accentColor}
              className={`${input} flex-1`}
              onChange={(e) => {
                const colorInput = e.target
                  .previousElementSibling as HTMLInputElement;
                if (/^#[0-9a-fA-F]{6}$/.test(e.target.value))
                  colorInput.value = e.target.value;
              }}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                const nameInput = target
                  .closest("div")
                  ?.querySelector("[name=accentColor]") as HTMLInputElement;
                if (/^#[0-9a-fA-F]{6}$/.test(target.value) && nameInput)
                  nameInput.value = target.value;
              }}
            />
          </div>
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-bold">Skema latar belakang</legend>
          <div className="flex gap-2 pt-1">
            {(["cream", "white", "dark"] as const).map((scheme) => (
              <label
                key={scheme}
                className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-line-strong p-3 has-[:checked]:border-accent has-[:checked]:bg-chip"
              >
                <div
                  className="h-8 w-full rounded-lg border border-line"
                  style={{
                    background:
                      scheme === "cream"
                        ? "#f6f1ea"
                        : scheme === "white"
                          ? "#ffffff"
                          : "#1f1b16",
                  }}
                />
                <input
                  type="radio"
                  name="bgScheme"
                  value={scheme}
                  defaultChecked={settings.bgScheme === scheme}
                  className="sr-only"
                />
                <span className="text-xs font-semibold capitalize">
                  {scheme}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className={label}>
          Font badan
          <select
            name="fontBody"
            defaultValue={settings.fontBody}
            className={input}
          >
            {FONT_BODY_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        <label className={label}>
          Font tajuk
          <select
            name="fontDisplay"
            defaultValue={settings.fontDisplay}
            className={input}
          >
            {FONT_DISPLAY_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <hr className="border-line" />

      {/* Pautan Sosial */}
      <div className={section}>
        <h2 className={sectionTitle}>Pautan Sosial</h2>
        <label className={label}>
          TikTok
          <input
            name="socialTiktok"
            type="url"
            defaultValue={settings.socialTiktok ?? ""}
            placeholder="https://tiktok.com/@..."
            className={input}
          />
        </label>
        <label className={label}>
          Shopee
          <input
            name="socialShopee"
            type="url"
            defaultValue={settings.socialShopee ?? ""}
            placeholder="https://shopee.com.my/..."
            className={input}
          />
        </label>
        <label className={label}>
          Instagram
          <input
            name="socialInstagram"
            type="url"
            defaultValue={settings.socialInstagram ?? ""}
            placeholder="https://instagram.com/..."
            className={input}
          />
        </label>
      </div>

      <hr className="border-line" />

      {/* Domain & Email */}
      <div className={section}>
        <h2 className={sectionTitle}>Domain & Email</h2>
        <label className={label}>
          Domain kustom
          <input
            name="customDomain"
            type="text"
            defaultValue={settings.customDomain ?? ""}
            placeholder="kedai.contoh.com"
            className={input}
          />
        </label>
        <label className={label}>
          Email pemilik
          <input
            name="ownerEmail"
            type="email"
            defaultValue={settings.ownerEmail ?? ""}
            placeholder="anda@contoh.com"
            className={input}
          />
        </label>
      </div>

      <div className="sticky bottom-[60px] border-t border-line bg-paper px-5 py-4">
        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-xl bg-ink font-bold text-white disabled:opacity-60"
        >
          {pending ? "Menyimpan…" : "Simpan Tetapan"}
        </button>
      </div>
    </form>
  );
}

function ImageUpload({
  type,
  currentUrl,
  label: labelText,
}: {
  type: "logo" | "favicon";
  currentUrl: string | null;
  label: string;
}) {
  const [preview, setPreview] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.set("file", file);
    fd.set("type", type);
    const result = await uploadImage(fd);
    setUploading(false);

    if (result.error) {
      setError(result.error);
      setPreview(currentUrl);
    } else if (result.url) {
      setPreview(result.url);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-bold">{labelText}</span>
      <div className="flex items-center gap-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            className="h-14 w-14 rounded-lg border border-line object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-line-strong bg-white text-xs text-muted">
            {type === "logo" ? "Logo" : "Ico"}
          </div>
        )}
        <label className="cursor-pointer rounded-lg border border-line-strong bg-white px-3 py-2 text-sm font-semibold hover:border-ink">
          {uploading ? "Memuat naik…" : "Pilih fail"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleChange}
            className="sr-only"
          />
        </label>
      </div>
      {error && <p className="text-xs font-semibold text-danger">{error}</p>}
      <p className="text-xs text-muted">PNG, JPG, WebP atau SVG. Maks 2MB.</p>
    </div>
  );
}
