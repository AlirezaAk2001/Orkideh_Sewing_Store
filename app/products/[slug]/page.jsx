import { notFound } from "next/navigation";
import ProductDetails from "@/app/components/ProductDetails";
import JsonLd from "@/app/components/JsonLd";
import { getProductBySlug } from "@/lib/products";
import { listApprovedComments } from "@/lib/comments";
import { pageMetadata, productDescription, productJsonLd } from "@/lib/seo";

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

  // نظرهای تأییدشده: هم برای نمایش اول صفحه (بدون چشمک بارگذاری) هم برای JSON-LD (امتیاز و نظرها در نتایج گوگل)
  const comments = await listApprovedComments(product.id);

  return (
    <>
      <JsonLd data={productJsonLd(product, comments)} />
      {/* key: با رفتن از یک محصول به محصول دیگر، وضعیت صفحه (تعداد، منوهای باز) از نو شروع می‌شود */}
      <ProductDetails key={product.id} product={product} initialComments={comments} />
    </>
  );
}
