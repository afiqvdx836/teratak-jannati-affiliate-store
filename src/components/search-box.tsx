import { SearchIcon } from "./icons";

export function SearchBox({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/cari" method="get" className="flex flex-col gap-3 rounded-[20px] bg-ink p-[18px] text-cream">
      <label htmlFor="q" className="font-display text-xl font-medium leading-tight">
        Nampak nombor dalam video? Cari kat sini.
      </label>
      <div className="flex gap-2">
        <input
          id="q"
          name="q"
          type="search"
          inputMode="search"
          defaultValue={defaultValue}
          placeholder="Contoh: 128 atau rak sinki"
          className="h-12 min-w-0 flex-1 rounded-xl bg-white px-3.5 text-[15px] text-ink placeholder:text-muted"
        />
        <button
          type="submit"
          aria-label="Cari"
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white hover:brightness-110"
        >
          <SearchIcon strokeWidth={2.2} />
        </button>
      </div>
    </form>
  );
}
