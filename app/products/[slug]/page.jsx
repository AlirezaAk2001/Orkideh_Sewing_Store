import ProductDetails from "@/app/components/ProductDetails";
import prisma from "@/lib/prisma";
import { toLatinSlug, safeDecode } from "@/lib/slug";
import { pageMetadata, productDescription } from "@/lib/seo";

// صفحه خودش داده را سمت مرورگر می‌گیرد (ProductDetails)؛ این‌جا فقط عنوان، توضیح و تصویر پیش‌نمایش لینک برای ربات‌ها ساخته می‌شود.
// جست‌وجوی slug همان قاعدهٔ /api/admin/products/by-slug است.
export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const latinSlug = toLatinSlug(safeDecode(slug));
    const product = latinSlug
      ? await prisma.product.findFirst({
          where: { slug: latinSlug },
          select: {
            name: true,
            slug: true,
            image: true,
            additionalFeatures: true,
            Category: { select: { name: true } },
          },
        })
      : null;

    if (!product) {
      return { title: "محصول یافت نشد", robots: { index: false, follow: false } };
    }

    return pageMetadata({
      title: product.name,
      description: productDescription(product),
      path: `/products/${encodeURIComponent(product.slug)}`,
      image: product.image,
      imageAlt: product.name,
    });
  } catch (error) {
    // خطای دیتابیس نباید صفحه را از کار بیندازد؛ عنوان پیش‌فرض سایت می‌ماند
    console.error("خطا در ساخت متادیتای محصول:", error);
    return {};
  }
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  return <ProductDetails slug={safeDecode(slug)} />;
}
