"use client";

import ErrorRetry from "@/app/components/ErrorRetry";

// خطای سرور هنگام خواندن محصولات (مثلاً قطعی دیتابیس) برای /products و /products/[slug]
export default function ProductsError({ reset }) {
  return <ErrorRetry message="خطا در دریافت محصولات. لطفاً چند لحظهٔ دیگر دوباره تلاش کنید." reset={reset} />;
}
