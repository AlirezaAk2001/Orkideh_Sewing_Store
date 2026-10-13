"use client";

import ErrorRetry from "@/app/components/ErrorRetry";

// خطای سرور هنگام خواندن یک دسته‌بندی و محصولاتش (مثلاً قطعی دیتابیس) برای /categories/[slug]
export default function CategoryError({ reset }) {
  return <ErrorRetry message="خطا در دریافت اطلاعات دسته‌بندی. لطفاً چند لحظهٔ دیگر دوباره تلاش کنید." reset={reset} />;
}
