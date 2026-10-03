import { getSiteUrl } from "@/lib/seo";

// آدرس سایت از env خوانده می‌شود، پس این فایل باید در هر درخواست اجرا شود و هنگام build ثابت نشود
export const dynamic = "force-dynamic";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /api عمداً بسته نمی‌شود: صفحه‌های محصول و دسته هنوز داده را از همان API می‌گیرند و ربات گوگل برای دیدن محتوا باید آن را بخواند.
        // بقیهٔ صفحه‌های خصوصی با هدر noindex (next.config.mjs) از نتایج حذف می‌شوند؛ بستن آن‌ها اینجا مانع دیدن همان هدر می‌شد.
        disallow: ["/admin"],
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
