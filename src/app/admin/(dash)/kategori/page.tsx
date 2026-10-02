import { connection } from "next/server";
import { ChevronDown, ChevronUp, PlusIcon, TrashIcon } from "@/components/icons";
import { getCategoryTree, type CategoryTree } from "@/lib/queries";
import { createCategory, deleteCategory, moveCategory, updateCategory } from "../../actions";
import { ConfirmSubmit } from "../confirm-submit";

const iconBtn = "flex h-11 w-11 items-center justify-center rounded-[10px] hover:bg-chip disabled:opacity-30";
const smallInput = "h-11 min-w-0 flex-1 rounded-[10px] border border-line-strong bg-white px-3 text-[15px]";

function MoveButtons({ id, first, last }: { id: number; first: boolean; last: boolean }) {
  return (
    <form action={moveCategory} className="flex">
      <input type="hidden" name="id" value={id} />
      <button name="dir" value="up" disabled={first} aria-label="Naik" className={`${iconBtn} w-9 text-muted`}>
        <ChevronUp size={18} />
      </button>
      <button name="dir" value="down" disabled={last} aria-label="Turun" className={`${iconBtn} w-9 text-muted`}>
        <ChevronDown size={18} />
      </button>
    </form>
  );
}

function DeleteButton({ id, name }: { id: number; name: string }) {
  return (
    <form action={deleteCategory}>
      <input type="hidden" name="id" value={id} />
      <ConfirmSubmit message={`Padam "${name}"?`} label={`Padam ${name}`} className={`${iconBtn} text-danger`}>
        <TrashIcon size={18} />
      </ConfirmSubmit>
    </form>
  );
}

/** Edit nama / status dalam <details> supaya tak perlu page lain. */
function EditRow({ id, name, isActive, imageUrl }: { id: number; name: string; isActive: boolean; imageUrl?: string | null }) {
  return (
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center px-2 text-[13px] font-semibold text-accent">Edit</summary>
      <form action={updateCategory} className="flex flex-col gap-2 pb-3 pl-2 pr-1">
        <input type="hidden" name="id" value={id} />
        <label className="flex flex-col gap-1 text-xs text-muted">
          Nama
          <input name="name" defaultValue={name} required className={smallInput} />
        </label>
        {imageUrl !== undefined && (
          <label className="flex flex-col gap-1 text-xs text-muted">
            Link gambar (pilihan)
            <input name="imageUrl" type="url" defaultValue={imageUrl ?? ""} className={smallInput} />
          </label>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={isActive} className="h-5 w-5 accent-ok" /> Tunjuk di website
        </label>
        <button type="submit" className="h-11 rounded-[10px] bg-ink text-sm font-bold text-white">
          Simpan
        </button>
      </form>
    </details>
  );
}

function CategoryCard({ cat, index, total, open }: { cat: CategoryTree; index: number; total: number; open: boolean }) {
  return (
    <details open={open} className="group/cat overflow-hidden rounded-2xl border border-line bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-1 py-1.5 pl-3 pr-1 [&::-webkit-details-marker]:hidden">
        <span className="flex min-h-11 flex-1 items-center gap-2">
          <ChevronDown size={18} className="-rotate-90 transition-transform group-open/cat:rotate-0" />
          <span className="text-base font-bold">{cat.name}</span>
          <span className="text-xs text-muted">{cat.children.length} sub</span>
          {!cat.isActive && <span className="rounded-full bg-[#EDE7DF] px-2 py-0.5 text-[11px] font-bold">Tersembunyi</span>}
        </span>
      </summary>

      <div className="flex items-center justify-end gap-1 border-y border-[#EFE8DE] bg-paper px-1">
        <MoveButtons id={cat.id} first={index === 0} last={index === total - 1} />
        <div className="flex-1">
          <EditRow id={cat.id} name={cat.name} isActive={cat.isActive} imageUrl={cat.imageUrl} />
        </div>
        <DeleteButton id={cat.id} name={cat.name} />
      </div>

      <ul>
        {cat.children.map((s, i) => (
          <li key={s.id} className="border-b border-[#F3EDE5] pl-4 pr-1">
            <div className="flex items-center gap-1">
              <span className="flex-1 text-[15px]">
                {s.name}
                {!s.isActive && <span className="ml-2 text-[11px] font-bold text-muted">(tersembunyi)</span>}
              </span>
              <span className="text-xs text-muted">{s.productCount} produk</span>
              <MoveButtons id={s.id} first={i === 0} last={i === cat.children.length - 1} />
              <DeleteButton id={s.id} name={s.name} />
            </div>
            <EditRow id={s.id} name={s.name} isActive={s.isActive} />
          </li>
        ))}
      </ul>

      <form action={createCategory} className="flex gap-2 bg-paper p-3">
        <input type="hidden" name="parentId" value={cat.id} />
        <label className="sr-only" htmlFor={`new-sub-${cat.id}`}>
          Subkategori baru dalam {cat.name}
        </label>
        <input id={`new-sub-${cat.id}`} name="name" required placeholder="Subkategori baru" className={smallInput} />
        <button type="submit" className="flex h-11 items-center gap-1 rounded-[10px] px-3 text-sm font-semibold text-accent hover:bg-chip">
          <PlusIcon size={16} strokeWidth={2.2} /> Tambah
        </button>
      </form>
    </details>
  );
}

export default async function AdminCategoriesPage({ searchParams }: PageProps<"/admin/kategori">) {
  await connection();
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const openId = typeof sp.open === "string" ? Number(sp.open) : null;
  const tree = await getCategoryTree();

  return (
    <>
      <header className="border-b border-line px-5 pb-4 pt-6">
        <p className="text-xs font-semibold tracking-wider text-muted">ADMIN</p>
        <h1 className="font-display text-[26px] font-semibold">Kategori</h1>
      </header>

      {error && (
        <p role="alert" className="mx-4 mt-3 rounded-xl bg-[#FBEFEC] px-4 py-3 text-sm font-semibold text-danger">
          {error}
        </p>
      )}

      <form action={createCategory} className="flex gap-2 px-4 pt-4">
        <label className="sr-only" htmlFor="new-cat">
          Kategori baru
        </label>
        <input id="new-cat" name="name" required placeholder="Kategori baru, cth: Dapur" className={smallInput} />
        <button type="submit" className="flex h-11 items-center gap-1.5 rounded-xl bg-ink px-4 text-sm font-bold text-white">
          <PlusIcon size={18} strokeWidth={2.2} /> Kategori
        </button>
      </form>

      <div className="flex flex-col gap-2.5 px-4 py-4">
        {tree.map((c, i) => (
          <CategoryCard key={c.id} cat={c} index={i} total={tree.length} open={openId === c.id} />
        ))}
        {tree.length === 0 && <p className="py-8 text-center text-sm text-muted">Belum ada kategori.</p>}
      </div>
    </>
  );
}
