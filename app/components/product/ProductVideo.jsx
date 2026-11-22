"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import AppImage from "../AppImage";

// ویدیوی کوتاه محصول (بخش «ویدیوی محصول» صفحهٔ محصول؛ استایل .pd-video در product.css).
// تا کاربر پخش را نزده فقط تصویر اصلی محصول (همان نسخهٔ بهینهٔ next/image) با دکمهٔ پخش دیده می‌شود و هیچ بایتی از خود ویدیو (تا ۳۰ مگابایت) دانلود نمی‌شود؛
// با کلیک، همان کادر با ویدیو و کنترل‌های خود مرورگر عوض می‌شود و پخش شروع می‌شود (کلیک خودش اجازهٔ پخش خودکار را می‌دهد).
// کادر همیشه ۱۶:۹ است و ویدیوی عمودی هم داخلش کامل (contain) دیده می‌شود.
export default function ProductVideo({ src, poster, name }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="pd-video">
      {playing ? (
        <video src={src} controls autoPlay playsInline aria-label={`ویدیوی ${name}`}>
          مرورگر شما پخش ویدیو را پشتیبانی نمی‌کند.
        </video>
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={`پخش ویدیوی ${name}`} className="pd-video-cover btn-flat">
          {poster && <AppImage src={poster} alt="" fill sizes="(max-width: 768px) 100vw, 880px" className="object-cover" />}
          <span className="pd-video-play" aria-hidden="true">
            <Play />
          </span>
          <span className="pd-video-label" aria-hidden="true">
            پخش ویدیو
          </span>
        </button>
      )}
    </div>
  );
}
