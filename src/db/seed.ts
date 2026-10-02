/**
 * Isi kategori & subkategori permulaan.  Jalankan: npm run db:seed
 * Selamat dijalankan berulang kali (skip slug yang dah wujud).
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { categories } from "./schema";
import { slugify } from "../lib/slug";

const SEED: Record<string, string[]> = {
  Dapur: ["Kabinet Sinki", "Kabinet Dapur Gas", "Rak & Organizer", "Peralatan Masak"],
  "Bilik Tidur": ["Katil", "Lampu", "Almari"],
  "Bilik Air": ["Rak", "Storage", "Aksesori"],
  "Ruang Tamu": ["Sofa", "Rak TV", "Deko"],
  Dobi: ["Ampaian", "Bakul", "Rak"],
};

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client);

  let order = 0;
  for (const [parentName, subs] of Object.entries(SEED)) {
    const parentSlug = slugify(parentName);
    const [parent] = await db
      .insert(categories)
      .values({ name: parentName, slug: parentSlug, sortOrder: order++ })
      .onConflictDoUpdate({ target: categories.slug, set: { name: parentName } })
      .returning();

    let subOrder = 0;
    for (const sub of subs) {
      await db
        .insert(categories)
        .values({
          name: sub,
          slug: `${parentSlug}-${slugify(sub)}`,
          parentId: parent.id,
          sortOrder: subOrder++,
        })
        .onConflictDoNothing({ target: categories.slug });
    }
  }

  console.log("Seed siap.");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
