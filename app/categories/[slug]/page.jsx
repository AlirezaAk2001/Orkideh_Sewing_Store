import CategoryProducts from "@/app/components/CategoryProducts";
import prisma from "@/lib/prisma";
import { safeDecode } from "@/lib/slug";
import { SITE_NAME, pageMetadata } from "@/lib/seo";

// صفحه خودش داده را سمت مرورگر می‌گیرد (CategoryProducts)؛ این‌جا فقط عنوان و پیش‌نمایش لینک برای ربات‌ها ساخته می‌شود
export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const category = await prisma.category.findUnique({
      where: { slug: safeDecode(slug) },
      select: { name: true, slug: true, image: true },
    });

    if (!category) {
      return { title: "دسته‌بندی یافت نشد", robots: { index: false, follow: false } };
    }

    return pageMetadata({
      title: `محصولات دستهٔ ${category.name}`,
      description: `مشاهده و خرید آنلاین محصولات دستهٔ ${category.name} از ${SITE_NAME}`,
      path: `/categories/${encodeURIComponent(category.slug)}`,
      image: category.image,
      imageAlt: category.name,
    });
  } catch (error) {
    // خطای دیتابیس نباید صفحه را از کار بیندازد؛ عنوان پیش‌فرض سایت می‌ماند
    console.error("خطا در ساخت متادیتای دسته‌بندی:", error);
    return {};
  }
}

export default function CategoryPage() {
  return <CategoryProducts />;
}
