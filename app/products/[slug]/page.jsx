import { notFound } from "next/navigation";
import ProductDetails from "@/app/components/ProductDetails";
import { getProductBySlug } from "@/lib/products";
import { pageMetadata, productDescription } from "@/lib/seo";

// قیمت و موجودی در هر درخواست تازه از دیتابیس خوانده می‌شود، نه هنگام build
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);

    // محصول نبود: خود صفحه notFound() می‌دهد (وضعیت 404 و noindex را نکست می‌گذارد)
    if (!product) return {};

    return pageMetadata({
      title: product.name,
      description: productDescription(product),
      path: `/products/${encodeURIComponent(product.slug)}`,
      image: product.image,
      imageAlt: product.name,
    });
  } catch (error) {
    // خطای دیتابیس نباید متادیتا را از کار بیندازد؛ عنوان پیش‌فرض سایت می‌ماند (خود صفحه در این حالت خطای سرور می‌دهد)
    console.error("خطا در ساخت متادیتای محصول:", error);
    return {};
  }
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // key: با رفتن از یک محصول به محصول دیگر، وضعیت صفحه (تعداد، منوهای باز) از نو شروع می‌شود
  return <ProductDetails key={product.id} product={product} />;
}
