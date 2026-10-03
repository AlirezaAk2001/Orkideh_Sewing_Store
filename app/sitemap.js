import prisma from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";

// محصول و دسته از دیتابیس می‌آیند و آدرس سایت از env؛ پس نباید هنگام build ثابت شود
export const dynamic = "force-dynamic";

export default async function sitemap() {
  const [categories, products] = await Promise.all([
    // دسته‌ای که محصول ندارد صفحهٔ خالی است و در نقشه نمی‌آید
    prisma.category.findMany({
      where: { Product: { some: {} } },
      select: { slug: true },
      orderBy: { id: "asc" },
    }),
    // محصول بدون slug آدرسی ندارد
    prisma.product.findMany({
      where: { slug: { not: null } },
      select: { slug: true, updated_at: true },
      orderBy: { id: "asc" },
    }),
  ]);

  return [
    { url: absoluteUrl("/") },
    { url: absoluteUrl("/products") },
    { url: absoluteUrl("/about") },
    ...categories.map((category) => ({
      url: absoluteUrl(`/categories/${encodeURIComponent(category.slug)}`),
    })),
    ...products
      .filter((product) => product.slug)
      .map((product) => ({
        url: absoluteUrl(`/products/${encodeURIComponent(product.slug)}`),
        lastModified: product.updated_at,
      })),
  ];
}
