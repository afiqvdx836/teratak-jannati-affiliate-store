import { connection } from "next/server";
import { getCategoryTree } from "@/lib/queries";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  await connection();
  const tree = await getCategoryTree();
  return (
    <ProductForm
      tree={tree}
      initial={{
        name: "",
        description: "",
        shopeeUrl: "",
        tiktokUrl: "",
        tiktokShopUrl: "",
        imageUrl: "",
        isActive: true,
        isFeatured: false,
        categoryIds: [],
      }}
    />
  );
}
