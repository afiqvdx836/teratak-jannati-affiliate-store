"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { startTransition, useActionState, useState, useTransition } from "react";
import { ChevronLeft } from "@/components/icons";
import type { CategoryTree } from "@/lib/queries";
import { deleteProduct, lookupTikTok, saveProduct } from "../../actions";

export type ProductFormValues = {
  id?: number;
  code?: number;
  name: string;
  description: string;
  shopeeUrl: string;
  tiktokUrl: string;
  tiktokShopUrl: string;
  imageUrl: string;
  isActive: boolean;
  isFeatured: boolean;
  categoryIds: number[];
};

const input = "h-12 rounded-xl border border-line-strong bg-white px-3.5 text-[15px]";
const label = "text-sm font-bold";
const optional = <span className="font-medium text-muted">(pilihan)</span>;

export function ProductForm({ initial, tree }: { initial: ProductFormValues; tree: CategoryTree[] }) {
  const [state, action, saving] = useActionState(saveProduct, undefined);
  const [name, setName] = useState(initial.name);
  const [tiktokUrl, setTiktokUrl] = useState(initial.tiktokUrl);
  const [thumb, setThumb] = useState<string | null>(initial.id && initial.tiktokUrl ? `/thumb/${initial.code}` : null);
  const [lookupMsg, setLookupMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [looking, startLookup] = useTransition();
  const [imageMode, setImageMode] = useState<"tiktok" | "custom">(initial.imageUrl ? "custom" : "tiktok");

  function runLookup() {
    const url = tiktokUrl.trim();
    if (!url) return;
    startLookup(async () => {
      const res = await lookupTikTok(url);
      if (!res.ok) {
        setLookupMsg({ ok: false, text: res.error });
        return;
      }
      setTiktokUrl(res.info.url);
      setThumb(res.info.thumbnailUrl);
      if (!name.trim() && res.info.title) setName(res.info.title.slice(0, 120));
      setLookupMsg({
        ok: !!res.info.videoId,
        text: res.info.videoId
          ? "Video dijumpai. Semak nama produk di bawah."
          : "Link diterima tapi video ID tak dijumpai. Embed mungkin tak keluar.",
      });
    });
  }

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center gap-1 border-b border-line bg-white px-3 py-3">
        <Link href="/admin" aria-label="Kembali ke senarai produk" className="flex h-11 w-11 items-center justify-center">
          <ChevronLeft />
        </Link>
        <h1 className="flex-1 font-display text-[22px] font-semibold">{initial.id ? "Edit produk" : "Tambah produk"}</h1>
        {initial.code && <span className="rounded-full bg-chip px-2.5 py-1 text-[13px] font-bold">No. {initial.code}</span>}
      </header>

      <form
        id="product-form"
        className="flex flex-col gap-[18px] px-5 py-4"
        onSubmit={(e) => {
          // Hantar manual supaya React tak reset borang bila ada error validation
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => action(fd));
        }}
      >
        {initial.id && <input type="hidden" name="id" value={initial.id} />}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tiktokUrl" className={label}>
            Link video TikTok
          </label>
          <div className="flex gap-2">
            <input
              id="tiktokUrl"
              name="tiktokUrl"
              type="url"
              inputMode="url"
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              onBlur={() => tiktokUrl && !lookupMsg && runLookup()}
              placeholder="Paste link dari app TikTok"
              className={`${input} min-w-0 flex-1 text-sm`}
            />
            <button
              type="button"
              onClick={runLookup}
              disabled={looking || !tiktokUrl}
              className="h-12 shrink-0 rounded-xl border border-ink bg-white px-3 text-sm font-bold disabled:opacity-50"
            >
              {looking ? "…" : "Ambil"}
            </button>
          </div>
          {lookupMsg && (
            <div
              className={`flex gap-3 rounded-xl border p-2.5 ${lookupMsg.ok ? "border-[#CFE0D5] bg-[#EEF3EF]" : "border-[#E3C3BA] bg-[#FBEFEC]"}`}
            >
              {thumb && <img src={thumb} alt="" className="h-[72px] w-[54px] shrink-0 rounded-lg object-cover" />}
              <p role="status" className={`self-center text-[13px] leading-snug ${lookupMsg.ok ? "text-ok" : "text-danger"}`}>
                {lookupMsg.text}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className={label}>
            Nama produk
          </label>
          <input id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)} className={input} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="shopeeUrl" className={label}>
            Link affiliate Shopee
          </label>
          <input
            id="shopeeUrl"
            name="shopeeUrl"
            type="url"
            inputMode="url"
            defaultValue={initial.shopeeUrl}
            placeholder="https://s.shopee.com.my/..."
            className={`${input} text-sm`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tiktokShopUrl" className={label}>
            Link TikTok Shop {optional}
          </label>
          <input
            id="tiktokShopUrl"
            name="tiktokShopUrl"
            type="url"
            inputMode="url"
            defaultValue={initial.tiktokShopUrl}
            className={`${input} text-sm`}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className={`${label} pb-2`}>Gambar</legend>
          <div className="flex gap-2">
            {(
              [
                ["tiktok", "Guna thumbnail TikTok"],
                ["custom", "Link gambar sendiri"],
              ] as const
            ).map(([val, text]) => (
              <label
                key={val}
                className="flex min-h-12 flex-1 items-center gap-2 rounded-xl border border-line-strong bg-white px-3 text-sm has-checked:border-[1.5px] has-checked:border-ink has-checked:font-semibold"
              >
                <input type="radio" name="imageMode" value={val} checked={imageMode === val} onChange={() => setImageMode(val)} />
                {text}
              </label>
            ))}
          </div>
          {imageMode === "custom" && (
            <>
              <label htmlFor="imageUrl" className="sr-only">
                Link gambar
              </label>
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                defaultValue={initial.imageUrl}
                placeholder="https://..."
                className={`${input} text-sm`}
              />
            </>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className={`${label} pb-1`}>
            Kategori <span className="font-medium text-muted">(boleh pilih lebih dari satu)</span>
          </legend>
          {tree.length === 0 && (
            <p className="text-sm text-muted">
              Belum ada kategori. <Link href="/admin/kategori" className="font-semibold text-accent">Tambah dulu</Link>.
            </p>
          )}
          {tree
            .filter((t) => t.children.length > 0)
            .map((t) => (
              <div key={t.id} className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">{t.name}</span>
                <div className="flex flex-wrap gap-2">
                  {t.children.map((c) => (
                    <label
                      key={c.id}
                      className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border border-line-strong bg-white px-3 text-[13px] has-checked:border-ink has-checked:bg-ink has-checked:font-semibold has-checked:text-white"
                    >
                      <input
                        type="checkbox"
                        name="categoryIds"
                        value={c.id}
                        defaultChecked={initial.categoryIds.includes(c.id)}
                        className="accent-white"
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className={label}>
            Nota ringkas {optional}
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={initial.description}
            placeholder="Kenapa suka, saiz, tips beli…"
            className="rounded-xl border border-line-strong bg-white px-3.5 py-3 text-sm"
          />
        </div>

        <div className="flex flex-col rounded-xl border border-line bg-white">
          <label className="flex min-h-[52px] items-center justify-between border-b border-[#EFE8DE] px-3.5 text-sm font-semibold">
            Tunjuk di website
            <input type="checkbox" name="isActive" defaultChecked={initial.isActive} className="h-[22px] w-[22px] accent-ok" />
          </label>
          <label className="flex min-h-[52px] items-center justify-between px-3.5 text-sm font-semibold">
            Letak dalam “Pilihan minggu ni”
            <input type="checkbox" name="isFeatured" defaultChecked={initial.isFeatured} className="h-[22px] w-[22px] accent-ok" />
          </label>
        </div>

        {state?.error && (
          <p role="alert" className="rounded-xl bg-[#FBEFEC] px-4 py-3 text-sm font-semibold text-danger">
            {state.error}
          </p>
        )}
      </form>

      <div className="sticky bottom-[61px] mt-auto flex gap-2.5 border-t border-line bg-white px-5 py-3">
        {initial.id && (
          <form
            action={deleteProduct}
            onSubmit={(e) => {
              if (!confirm(`Padam "${initial.name}"? Tak boleh undo.`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={initial.id} />
            <button type="submit" className="h-[52px] rounded-[14px] border border-[#E3C3BA] bg-white px-4 text-sm font-bold text-danger">
              Padam
            </button>
          </form>
        )}
        <button
          type="submit"
          form="product-form"
          disabled={saving}
          className="h-[52px] flex-1 rounded-[14px] bg-accent text-base font-bold text-white disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : "Simpan produk"}
        </button>
      </div>
    </>
  );
}
