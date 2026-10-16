import { notFound } from "next/navigation";
import CategoryProducts from "@/app/components/CategoryProducts";
import { getCategoryBySlug } from "@/lib/categories";
import { getRatingSummaries } from "@/lib/comments";
import { SITE_NAME, pageMetadata } from "@/lib/seo";

// محصولات هر دسته در هر درخواست تازه از دیتابیس خوانده می‌شوند، نه هنگام build
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const category = await getCategoryBySlug(slug);

    // دسته نبود: خود صفحه notFound() می‌دهد (وضعیت 404 و noindex را نکست می‌گذارد)
    if (!category) return {};

    return pageMetadata({
      title: `محصولات دستهٔ ${category.name}`,
      description: `مشاهده و خرید آنلاین محصولات دستهٔ ${category.name} از ${SITE_NAME}`,
      path: `/categories/${encodeURIComponent(category.slug)}`,
      image: category.image,
      imageAlt: category.name,
    });
  } catch (error) {
    // خطای دیتابیس نباید متادیتا را از کار بیندازد؛ عنوان پیش‌فرض سایت می‌ماند (خود صفحه در این حالت خطای سرور می‌دهد)
    console.error("خطا در ساخت متادیتای دسته‌بندی:", error);
    return {};
  }
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  // کارت محصول نام و slug دسته، و میانگین امتیاز/تعداد رای را از خود محصول می‌خواند
  const ratings = await getRatingSummaries(category.Product.map((product) => product.id));
  const products = category.Product.map((product) => ({
    ...product,
    Category: { name: category.name, slug: category.slug },
    averageRating: ratings[product.id]?.averageRating ?? 0,
    totalVotes: ratings[product.id]?.totalVotes ?? 0,
  }));

  return <CategoryProducts key={category.id} name={category.name} products={products} />;
}
