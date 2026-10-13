import { getSiteUrl } from "@/lib/seo";

// آدرس سایت از env خوانده می‌شود، پس این فایل باید در هر درخواست اجرا شود و هنگام build ثابت نشود
export const dynamic = "force-dynamic";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /api عمداً بسته نمی‌شود: نظرات کاربران هنوز سمت مرورگر از همان API بارگذاری می‌شوند و ربات گوگل برای دیدنشان باید آن را بخواند
        // (بقیهٔ صفحه‌های عمومی داده را در همان HTML دارند؛ با سرور-رندر شدن نظرات می‌شود /api را هم بست).
        // بقیهٔ صفحه‌های خصوصی با هدر noindex (next.config.mjs) از نتایج حذف می‌شوند؛ بستن آن‌ها اینجا مانع دیدن همان هدر می‌شد.
        disallow: ["/admin"],
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
