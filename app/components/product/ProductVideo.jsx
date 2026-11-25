"use client";

import VideoPlayer from "../VideoPlayer";

// ویدیوی کوتاه محصول (بخش «ویدیوی محصول» صفحهٔ محصول؛ کادر .pd-video در product.css).
// همان پخش‌کنندهٔ سفارشی پنل ادمین (components/VideoPlayer.jsx): دکمهٔ بزرگ پخش، نوار شیشه‌ای، سرعت، تمام‌صفحه و پخش دوباره.
// تا کاربر پخش را نزده فقط تصویر اصلی محصول (همان نسخهٔ بهینهٔ next/image) به‌عنوان پوستر دیده می‌شود و هیچ بایتی از خود ویدیو (تا ۳۰ مگابایت) دانلود نمی‌شود (poster → preload="none")؛
// با کلیک روی دکمهٔ پخش (که خودش اجازهٔ پخش را می‌دهد) ویدیو بار می‌شود و پخش شروع می‌شود. کادر همیشه ۱۶:۹ است و ویدیوی عمودی هم داخلش کامل (contain) دیده می‌شود.
export default function ProductVideo({ src, poster, name }) {
  return (
    <div className="pd-video">
      <VideoPlayer src={src} poster={poster} label={`ویدیوی ${name}`} className="h-full w-full" />
    </div>
  );
}
