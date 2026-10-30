// «حالت نمونهٔ داشبورد» (آمار ساختگی برای دیدن شکل نمودارها) فقط در توسعه (next dev) فعال است.
// در نسخهٔ production خاموش می‌ماند، مگر اینکه عمداً NEXT_PUBLIC_DASHBOARD_DEMO=1 هنگام build تنظیم شود (برای آزمایش).
// هم صفحه و هم API از همین تابع می‌پرسند؛ مقدار هنگام build داخل کد جایگزین می‌شود.
export const demoAllowed = () => process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DASHBOARD_DEMO === "1";
