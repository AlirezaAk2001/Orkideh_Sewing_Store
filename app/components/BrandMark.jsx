"use client";

import SiteLogo from "./SiteLogo";
import { useSiteLogo } from "./useSiteLogo";

// لوگوی اصلی سایت، همان که هدر فروشگاه نشان می‌دهد (لوگوی پیش‌فرض با انیمیشن دوختن): گرد و با لبهٔ نازک. از همان اولین رندر (حتی در HTML سرور) لوگوی پیش‌فرض نمایش
// داده می‌شود و منتظر درخواست شبکه نمی‌ماند؛ لوگوی دیگری که مدیر تنظیم کرده بعد از ذخیره‌شدن در بازدید اول، از بازدید دوم به بعد فوراً می‌آید (useSiteLogo).
// px اندازهٔ واقعی نمایش است
export default function BrandMark({ className = "h-10 w-10", px = 40 }) {
  const src = useSiteLogo();
  return <SiteLogo src={src} alt="" width={px} height={px} className={`shrink-0 rounded-full ${className} border border-gray-200 bg-white object-cover`} />;
}
