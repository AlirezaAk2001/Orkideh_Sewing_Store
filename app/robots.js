import { getSiteUrl } from "@/lib/seo";

// آدرس سایت از env خوانده می‌شود، پس این فایل باید در هر درخواست اجرا شود و هنگام build ثابت نشود
export const dynamic = "force-dynamic";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /api: همهٔ صفحه‌های عمومی (محصول، دسته، خانه، نظرها) حالا داده را در همان HTML اول دارند؛
        // زیر /api فقط عملیات ورود/سبد/پرداخت و درخواست‌های پس از کنش کاربر (مثل ثبت نظر) هستند، نه محتوایی که ربات لازم داشته باشد
        // بقیهٔ صفحه‌های خصوصی با هدر noindex (next.config.mjs) از نتایج حذف می‌شوند؛ بستن آن‌ها اینجا مانع دیدن همان هدر می‌شد.
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
