"use client";

import SiteLogo from "@/app/components/SiteLogo";
import { useSiteLogo } from "./useSiteLogo";

// لوگوی اصلی سایت، همان که هدر فروشگاه نشان می‌دهد (لوگوی پیش‌فرض با انیمیشن دوختن): گرد و با لبهٔ نازک. تا رسیدن آدرس لوگو دایرهٔ
// خاکستریِ ضربان‌دار جایش می‌ماند (لوگوی دیگری که مدیر تنظیم کرده برای لحظه‌ای با لوگوی پیش‌فرض عوض نمی‌شود). px اندازهٔ واقعی نمایش است
export default function BrandMark({ className = "h-10 w-10", px = 40 }) {
  const src = useSiteLogo();
  const base = `shrink-0 rounded-full ${className}`;
  if (!src) return <span aria-hidden="true" className={`${base} animate-pulse bg-gray-200`} />;
  return <SiteLogo src={src} alt="" width={px} height={px} className={`${base} border border-gray-200 bg-white object-cover`} />;
}
