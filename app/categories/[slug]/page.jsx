import { notFound, redirect } from "next/navigation";
import ProductListing from "@/app/components/ProductListing";
import { getCategoryBySlug, listCategories } from "@/lib/categories";
import { toPersianDigits } from "@/lib/format";
import { countProductsByCategory, queryProductList } from "@/lib/products";
import { buildListUrl, parseListParams } from "@/lib/productQuery";
import { SITE_NAME, pageMetadata } from "@/lib/seo";

// محصولات هر دسته در هر درخواست تازه از دیتابیس خوانده می‌شوند، نه هنگام build
export const dynamic = "force-dynamic";

// مثل /products: فقط شمارهٔ صفحه آدرس و عنوان مستقل می‌گیرد، مرتب‌سازی و فیلتر به صفحهٔ بدون آن‌ها canonical می‌شوند
export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  try {
    const category = await getCategoryBySlug(slug);

    // دسته نبود: خود صفحه notFound() می‌دهد (وضعیت 404 و noindex را نکست می‌گذارد)
    if (!category) return {};

    const { page } = parseListParams(await searchParams);
    const title = `محصولات دستهٔ ${category.name}`;
    return pageMetadata({
      title: page > 1 ? `${title} - صفحهٔ ${toPersianDigits(page)}` : title,
      description: `مشاهده و خرید آنلاین محصولات دستهٔ ${category.name} از ${SITE_NAME}`,
      path: buildListUrl(`/categories/${encodeURIComponent(category.slug)}`, { page }),
      image: category.image,
      imageAlt: category.name,
    });
  } catch (error) {
    // خطای دیتابیس نباید متادیتا را از کار بیندازد؛ عنوان پیش‌فرض سایت می‌ماند (خود صفحه در این حالت خطای سرور می‌دهد)
    console.error("خطا در ساخت متادیتای دسته‌بندی:", error);
    return {};
  }
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const query = parseListParams(await searchParams);
  const path = `/categories/${encodeURIComponent(category.slug)}`;
  const [result, categories, counts] = await Promise.all([
    queryProductList(query, { categoryId: category.id }),
    listCategories(),
    countProductsByCategory(),
  ]);

  // شمارهٔ صفحه از آخرین صفحه بیشتر است: به آخرین صفحه می‌رویم
  if (result.outOfRange) redirect(buildListUrl(path, query, { page: result.pageCount }));

  return (
    <ProductListing
      key={category.id}
      title="محصولات دسته: "
      accent={category.name}
      category={{ slug: category.slug, name: category.name }}
      basePath={path}
      // دستهٔ خالی هم اگر خودِ همین صفحه است در نوار می‌ماند
      categories={categories.filter((c) => counts[c.id] || c.id === category.id).map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: counts[c.id] ?? 0 }))}
      params={query}
      result={result}
      emptyMessage="هیچ محصولی در این دسته‌بندی یافت نشد."
    />
  );
}
