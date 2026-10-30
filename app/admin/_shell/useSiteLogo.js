import { useEffect, useState } from "react";
import { LOGO } from "@/lib/siteLogo";

const FALLBACK = LOGO;
let cached = null; // آدرس لوگو بعد از اولین دریافت؛ همهٔ جاهای پنل (منو، نوار بالا، صفحهٔ بررسی دسترسی) یک درخواست را به اشتراک می‌گذارند
let pending = null;

function loadLogo() {
  pending ??= fetch("/api/background")
    .then((res) => res.json())
    .then((data) => data?.data || FALLBACK)
    .catch(() => FALLBACK)
    .then((url) => (cached = url));
  return pending;
}

// لوگوی اصلی سایت از همان منبعی که هدر فروشگاه می‌خواند (تنظیم background_image، پیش‌فرض /image/orkideh-logo.svg). تا رسیدن آدرس null است
export function useSiteLogo() {
  const [src, setSrc] = useState(cached);
  useEffect(() => {
    if (cached) return;
    let alive = true;
    loadLogo().then((url) => alive && setSrc(url));
    return () => {
      alive = false;
    };
  }, []);
  return src;
}
