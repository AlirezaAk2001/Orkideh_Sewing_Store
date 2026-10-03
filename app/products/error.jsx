"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";

// خطای سرور هنگام خواندن محصولات (مثلاً قطعی دیتابیس) برای /products و /products/[slug].
// پاسخ برای ربات‌ها همچنان خطای 500 است؛ بازدیدکننده پیام فارسی و دکمهٔ تلاش مجدد می‌بیند.
export default function ProductsError({ reset }) {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <p className="text-red-500 mb-4">خطا در دریافت محصولات. لطفاً چند لحظهٔ دیگر دوباره تلاش کنید.</p>
      <button
        onClick={() =>
          // خطا سمت سرور بوده؛ باید داده از نو از سرور گرفته شود، نه فقط کامپوننت دوباره رسم شود
          startTransition(() => {
            router.refresh();
            reset();
          })
        }
        className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition cursor-pointer"
      >
        تلاش مجدد
      </button>
    </div>
  );
}
