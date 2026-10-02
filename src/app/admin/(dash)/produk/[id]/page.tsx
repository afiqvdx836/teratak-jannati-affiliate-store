import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getCategoryTree } from "@/lib/queries";
import { ProductForm } from "../product-form";

export default async function EditProductPage({ params }: PageProps<"/admin/produk/[id]">) {
  await connection();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const [p, tree] = await Promise.all([
    db.query.products.findFirst({ where: eq(products.id, id), with: { categoryLinks: true } }),
    getCategoryTree(),
  ]);
  if (!p) notFound();

  return (
    <ProductForm
      key={p.updatedAt.toISOString()}
      tree={tree}
      initial={{
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description ?? "",
        shopeeUrl: p.shopeeUrl ?? "",
        tiktokUrl: p.tiktokUrl ?? "",
        tiktokShopUrl: p.tiktokShopUrl ?? "",
        imageUrl: p.imageUrl ?? "",
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        categoryIds: p.categoryLinks.map((l) => l.categoryId),
      }}
    />
  );
}
