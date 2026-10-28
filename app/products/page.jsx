import { redirect } from "next/navigation";
import ProductListing from "@/app/components/ProductListing";
import { listCategories } from "@/lib/categories";
import { toPersianDigits } from "@/lib/format";
import { countProductsByCategory, queryProductList } from "@/lib/products";
import { buildListUrl, parseListParams } from "@/lib/productQuery";
import { pageMetadata } from "@/lib/seo";

const PATH = "/products";

// فقط شمارهٔ صفحه آدرس و عنوان مستقل می‌گیرد؛ مرتب‌سازی و فیلتر نمای دیگری از همان فهرست‌اند و canonical به صفحهٔ بدون آن‌هاست
export async function generateMetadata({ searchParams }) {
  const { page } = parseListParams(await searchParams);
  return pageMetadata({
    title: page > 1 ? `همه محصولات - صفحهٔ ${toPersianDigits(page)}` : "همه محصولات",
    description: "فهرست همهٔ محصولات فروشگاه چرخ خیاطی ارکیده: چرخ خیاطی و لوازم جانبی؛ مشاهدهٔ قیمت و خرید آنلاین",
    path: buildListUrl(PATH, { page }),
  });
}

// قیمت و موجودی در هر درخواست تازه از دیتابیس خوانده می‌شود، نه هنگام build
export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }) {
  const params = parseListParams(await searchParams);
  const [result, categories, counts] = await Promise.all([queryProductList(params), listCategories(), countProductsByCategory()]);

  // شمارهٔ صفحه از آخرین صفحه بیشتر است (مثلاً لینک قدیمی بعد از حذف محصول): به آخرین صفحه می‌رویم
  if (result.outOfRange) redirect(buildListUrl(PATH, params, { page: result.pageCount }));

  return (
    <ProductListing
      title="همه محصولات"
      basePath={PATH}
      categories={categories.filter((c) => counts[c.id]).map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: counts[c.id] }))}
      params={params}
      result={result}
      emptyMessage="محصولی یافت نشد."
    />
  );
}
