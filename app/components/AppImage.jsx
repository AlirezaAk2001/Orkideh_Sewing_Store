"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * تصویر برای کل سایت (روی next/image):
 * - مسیرهای محلی (/image/...) از optimizer نکست می‌گذرند و به‌جای PNG چند مگابایتی،
 *   یک WebP کوچک متناسب با اندازهٔ نمایش می‌گیرند؛
 * - آدرس بیرونی و data/blob مثل قبل مستقیم بارگذاری می‌شوند (نیازی به تنظیم دامنه نیست)؛
 * - نام فایل بدون مسیر مثل getImagePath زیر /image/ فرض می‌شود؛
 * - اگر بارگذاری شکست بخورد و fallback داده شده باشد، fallback نشان داده می‌شود.
 * بقیهٔ propها (width/height یا fill، sizes، priority، ...) مستقیم به next/image می‌روند.
 */
const isDirect = (src) => /^(https?:)?\/\//.test(src) || src.startsWith("data:") || src.startsWith("blob:");

const resolveSrc = (src) => {
  if (!src || typeof src !== "string") return "";
  if (src.startsWith("/") || isDirect(src)) return src;
  return `/image/${src}`;
};

export default function AppImage({ src, fallback, onError, unoptimized, alt = "", ...props }) {
  const [failedSrc, setFailedSrc] = useState(null); // با عوض‌شدن src خودبه‌خود بی‌اثر می‌شود
  const current = resolveSrc(fallback && failedSrc === src ? fallback : src);
  if (!current) return null;

  return (
    <Image
      {...props}
      src={current}
      alt={alt}
      unoptimized={unoptimized || isDirect(current)}
      onError={(e) => {
        setFailedSrc(src);
        onError?.(e);
      }}
    />
  );
}
