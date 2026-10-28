"use client";

import { useEffect, useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import AppImage from "./AppImage";

// نمای تمام‌صفحهٔ تصویرهای محصول با بزرگ‌نمایی. کلیک روی تصویر (یا دکمهٔ ذره‌بین) بین «جاشده در صفحه» و ۲٫۵ برابر عوض می‌کند و
// نقطهٔ کلیک‌شده وسط می‌ماند؛ در حالت بزرگ‌شده با اسکرول یا کشیدن (لمسی) می‌شود هر جا را دید. Escape و کلیک روی پس‌زمینه می‌بندند
// (فوکوس‌دان، قفل اسکرول صفحه و aria-modal را MUI Dialog می‌دهد). تصویر فقط وقتی باز است بارگذاری می‌شود.
// با چند تصویر: دکمه‌های قبلی/بعدی، کلیدهای جهت‌دار، کشیدن انگشت و ردیف کوچک‌نماها. جهت صفحه راست‌به‌چپ است: «بعدی» سمت چپ است،
// کلید ← بعدی می‌رود و کشیدن انگشت به راست هم (مثل اسلایدرهای فارسی).
const ZOOM = 2.5;
const SWIPE_MIN = 50; // حداقل جابه‌جایی افقی انگشت (پیکسل)

const fa = (n) => Number(n).toLocaleString("fa-IR");

export default function ImageLightbox({ open, onClose, images, index = 0, onIndexChange, alt }) {
  const [zoomed, setZoomed] = useState(false);
  const box = useRef(null);
  const focus = useRef({ x: 0.5, y: 0.5 });
  const touch = useRef(null);

  const count = images.length;
  const many = count > 1;
  const current = Math.min(Math.max(index, 0), Math.max(count - 1, 0));
  const src = images[current];

  // بعد از بزرگ یا کوچک شدن، نقطهٔ انتخاب‌شده را وسط می‌آوریم (کانتینر عمداً ltr است: scrollLeft در rtl منفی می‌شود)
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.scrollLeft = focus.current.x * el.scrollWidth - el.clientWidth / 2;
    el.scrollTop = focus.current.y * el.scrollHeight - el.clientHeight / 2;
  }, [zoomed]);

  const go = (step) => {
    if (!many) return;
    focus.current = { x: 0.5, y: 0.5 };
    setZoomed(false);
    onIndexChange?.((current + step + count) % count);
  };

  const select = (target) => {
    if (target === current) return;
    focus.current = { x: 0.5, y: 0.5 };
    setZoomed(false);
    onIndexChange?.(target);
  };

  const toggle = (event) => {
    // کلیک با صفحه‌کلید مختصات ندارد (detail = 0): از وسط بزرگ می‌شود
    if (event && event.detail > 0) {
      const rect = event.currentTarget.getBoundingClientRect();
      focus.current = { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
    } else {
      focus.current = { x: 0.5, y: 0.5 };
    }
    setZoomed((z) => !z);
  };

  // کلید جهت‌دار فقط وقتی تصویر جاشده است؛ در حالت بزرگ‌شده همین کلیدها کانتینر را اسکرول می‌کنند
  const onKeyDown = (event) => {
    if (!many || zoomed) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(-1);
    }
  };

  const onTouchStart = (event) => {
    const point = event.touches[0];
    touch.current = event.touches.length === 1 ? { x: point.clientX, y: point.clientY } : null;
  };
  const onTouchEnd = (event) => {
    const start = touch.current;
    touch.current = null;
    if (!start || zoomed || !many) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;
    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx > 0 ? 1 : -1);
  };

  const iconButton =
    "grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";
  const arrowButton =
    "absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      onKeyDown={onKeyDown}
      TransitionProps={{ onExited: () => setZoomed(false) }}
      // نام دیالوگ همان عنوان بالای تصویر است (MUI خودش aria-labelledby را به عنوانی که وجود ندارد وصل می‌کرد) و aria-modal را صریح می‌گوییم
      aria-labelledby="image-lightbox-title"
      PaperProps={{ sx: { bgcolor: "rgb(17 24 39 / 0.97)" }, "aria-modal": "true" }}
    >
      <div className="flex h-full flex-col" dir="rtl">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <button type="button" onClick={onClose} aria-label="بستن" className={iconButton}>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="flex min-w-0 flex-1 flex-col items-center">
            <p id="image-lightbox-title" className="max-w-full truncate text-sm text-white/80">
              {alt}
            </p>
            {many && (
              <p className="text-xs text-white/60" aria-live="polite">
                تصویر {fa(current + 1)} از {fa(count)}
              </p>
            )}
          </div>
          <button type="button" onClick={() => toggle()} aria-pressed={zoomed} aria-label={zoomed ? "کوچک‌نمایی" : "بزرگ‌نمایی"} className={iconButton}>
            {zoomed ? <ZoomOut className="h-5 w-5" aria-hidden="true" /> : <ZoomIn className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          {/* touch-action: بدون این، کشیدن افقی روی لمسی (مثلاً کروم) به‌جای تعویض عکس «برگشت به صفحهٔ قبل» می‌شد؛ با بزرگ‌نمایی باید همه‌سو اسکرول شود. overscroll-contain هم نمی‌گذارد لبهٔ اسکرول به ناوبری تاریخچه برسد */}
          <div
            ref={box}
            dir="ltr"
            className={`absolute inset-0 overflow-auto overscroll-contain ${zoomed ? "" : "touch-pan-y touch-pinch-zoom"}`}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <button
              type="button"
              onClick={toggle}
              aria-label={zoomed ? "کوچک‌نمایی تصویر" : "بزرگ‌نمایی تصویر"}
              className={`relative block ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
              style={{ width: `${zoomed ? ZOOM * 100 : 100}%`, height: `${zoomed ? ZOOM * 100 : 100}%` }}
            >
              {/* sizes: تا بزرگ‌نمایی نشده همان اندازهٔ صفحه را می‌گیرد؛ با بزرگ‌نمایی next/image نسخهٔ بزرگ‌تر را می‌خواهد */}
              {src && <AppImage key={src} src={src} alt={alt} fill sizes={zoomed ? `${ZOOM * 100}vw` : "100vw"} className="object-contain p-4" />}
            </button>
          </div>
          {many && (
            <>
              <button type="button" onClick={() => go(1)} aria-label="تصویر بعدی" className={`${arrowButton} left-3`}>
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => go(-1)} aria-label="تصویر قبلی" className={`${arrowButton} right-3`}>
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        {many && (
          // w-max + mx-auto: وسط‌چین وقتی جا می‌شوند و قابل اسکرول وقتی نمی‌شوند (justify-center ابتدای ردیف سرریز را غیرقابل‌دسترس می‌کرد)
          <ul className="no-scrollbar mx-auto flex w-max max-w-full items-center gap-2 overflow-x-auto px-4 py-3" aria-label="تصویرهای محصول">
            {images.map((item, i) => (
              <li key={item} className="shrink-0">
                <button
                  type="button"
                  onClick={() => select(i)}
                  aria-label={`نمایش تصویر ${fa(i + 1)} از ${fa(count)}`}
                  aria-current={i === current ? "true" : undefined}
                  className={`relative block h-14 w-14 cursor-pointer overflow-hidden rounded-lg bg-white/90 ring-2 transition focus-visible:outline-none focus-visible:ring-white ${
                    i === current ? "ring-brand-500" : "opacity-70 ring-transparent hover:opacity-100"
                  }`}
                >
                  <AppImage src={item} alt="" fill sizes="56px" className="object-contain p-1" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
