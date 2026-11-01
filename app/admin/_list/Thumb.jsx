"use client";

import { ImageIcon } from "lucide-react";
import AppImage from "@/app/components/AppImage";

// تصویر کوچک ردیف: قاب گرد با حلقهٔ نازک. زیر تصویر یک آیکون ثابت است؛ اگر تصویر نبود یا بارگذاری نشد (فایل پاک‌شده) آیکون دیده می‌شود
// و جای خالی یا آیکون شکسته نمی‌ماند. اندازه با className (مثلاً h-11 w-11) تعیین می‌شود و sizes باید با آن بخواند
export default function Thumb({ src, alt = "", className = "h-11 w-11", sizes = "64px" }) {
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/5 ${className}`}>
      <ImageIcon className="h-5 w-5 text-gray-300" aria-hidden="true" />
      {src ? (
        <AppImage
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </span>
  );
}
