"use client";

import { useEffect, useId, useRef } from "react";
import AppImage from "./AppImage";
import { logoArt } from "@/lib/logoArt";
import { LOGO, LOGO_PNG, SEW_DURATION_MS, SEW_EVERY_MS, SEW_FIRST_MS } from "@/lib/siteLogo";

// لوگوی پیش‌فرض (ماشین دوخت) به‌صورت SVG درون صفحه کشیده می‌شود تا هر چند ثانیه سوزنش شروع به دوختن کند. انیمیشن فقط در همان ۱٫۸ ثانیهٔ دوختن
// اجرا می‌شود (با گذاشتن data-sewing روی لوگو؛ استایلش در globals.css است) و بین دو دوخت هیچ انیمیشنی نیست، پس پردازنده‌ای مصرف نمی‌شود؛
// با «کاهش حرکت» سیستم هم اصلاً شروع نمی‌شود. شناسه‌های گرادیان و فیلتر برای هر لوگو جداست تا چند لوگو در یک صفحه به هم نخورند
function AnimatedLogo({ className = "", alt = "", ref, priority, fallback, sizes, unoptimized, ...props }) {
  const prefix = `lg${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const own = useRef(null);

  useEffect(() => {
    const el = own.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let next, stop;
    const sew = () => {
      el.setAttribute("data-sewing", "");
      stop = setTimeout(() => el.removeAttribute("data-sewing"), SEW_DURATION_MS + 120);
      next = setTimeout(sew, SEW_EVERY_MS);
    };
    next = setTimeout(sew, SEW_FIRST_MS);
    return () => {
      clearTimeout(next);
      clearTimeout(stop);
    };
  }, []);

  return (
    <svg
      {...props}
      ref={(node) => {
        own.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      viewBox="0 0 256 256"
      className={`logo-art ${className}`}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      dangerouslySetInnerHTML={{ __html: logoArt(prefix) }}
    />
  );
}

// src لوگوی پیش‌فرض باشد: نسخهٔ انیمیشن‌دار؛ هر لوگوی دیگری (مثلاً تصویری که مدیر در تنظیمات گذاشته) مثل قبل با AppImage
export default function SiteLogo({ src = LOGO, ...props }) {
  if (src === LOGO) return <AnimatedLogo {...props} />;
  return <AppImage src={src} fallback={LOGO_PNG} {...props} />;
}
