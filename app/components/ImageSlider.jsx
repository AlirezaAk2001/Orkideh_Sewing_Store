"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// اسلایدر تصویر محصول (گالری صفحهٔ محصول و کارت محصول)؛ فلش‌ها و نقطه‌ها همان ظاهر بنر صفحهٔ اصلی را دارند (.img-slider-* در globals.css)
// ولی تصویرها هیچ‌وقت خودکار عوض نمی‌شوند. روی مرورگر خود scroll-snap کار می‌کند (کشیدن انگشت نرم و بدون کتابخانه؛ همین باعث می‌شود
// صفحه‌های فهرست که دهها کارت دارند Swiper بارگذاری نکنند) و فلش، نقطه و کنترل از بیرون با scrollTo نرم می‌روند.
// جهت صفحه راست‌به‌چپ است: تصویر اول سمت راست است، «بعدی» سمت چپ.
//   در گالری صفحهٔ محصول اسلایدر کشیدن را به ناوبری مرورگر (برگشت به صفحهٔ قبل) نمی‌دهد (overscroll-x-contain)؛ در کارت می‌دهد تا
//   ردیف‌های افقی صفحهٔ اصلی بعد از آخرین عکس با همان کشیدن حرکت کنند.
//   className: موقعیت را فراخواننده می‌دهد (relative در صفحهٔ محصول، absolute inset-0 در کارت)
//   renderSlide(src, index, { load, active }) محتوای هر اسلاید است؛ تا load نشده تصویر نمی‌گذارد (فقط اسلاید جاری و همسایه‌هایش بارگذاری می‌شوند،
//   در کارت تا وقتی موس/انگشت روی آن نیامده فقط اولی). ref.goTo(index, { instant }) برای کوچک‌نماها و دیالوگ بزرگ‌نمایی.
//   onIndexChange فقط وقتی اسلاید جاری واقعاً عوض شده صدا می‌شود (نه در میانهٔ یک جابه‌جایی نرم).
const fa = (n) => Number(n).toLocaleString("fa-IR");

export default function ImageSlider({ ref, images, variant = "page", label, renderSlide, onIndexChange, className = "", dotsClassName = "" }) {
  const count = images.length;
  const many = count > 1;
  const card = variant === "card";
  const track = useRef(null);
  const reported = useRef(0); // آخرین شمارهٔ اسلاید جاری
  const target = useRef(null); // مقصد جابه‌جایی برنامه‌ای؛ تا رسیدن به آن گزارش‌های میانی نادیده گرفته می‌شوند
  const targetTimer = useRef(null);
  const frame = useRef(0);
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState(() => new Set(card ? [0] : [0, 1].filter((i) => i < count)));

  // اسلاید جاری و همسایه‌هایش (با چرخش از آخر به اول) برای بارگذاری تصویر علامت می‌خورند
  const mark = useCallback(
    (index) => {
      setSeen((prev) => {
        const next = new Set(prev);
        for (const step of [-1, 0, 1]) next.add((index + step + count) % count);
        return next.size === prev.size ? prev : next;
      });
    },
    [count]
  );

  const stopTarget = useCallback(() => {
    target.current = null;
    clearTimeout(targetTimer.current);
  }, []);

  const goTo = useCallback(
    (index, { instant = false } = {}) => {
      const el = track.current;
      if (!el || count === 0) return;
      const to = Math.min(Math.max(index, 0), count - 1);
      const reduced = instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      mark(to);
      stopTarget();
      if (to !== reported.current) {
        target.current = to;
        targetTimer.current = setTimeout(() => (target.current = null), 1500); // اگر به هر دلیل به مقصد نرسید گزارش‌ها دوباره باز شوند
      }
      const sign = getComputedStyle(el).direction === "rtl" ? -1 : 1; // scrollLeft در راست‌به‌چپ منفی می‌شود
      el.scrollTo({ left: sign * to * el.clientWidth, behavior: reduced ? "auto" : "smooth" });
    },
    [count, mark, stopTarget]
  );

  useImperativeHandle(ref, () => ({ goTo }), [goTo]);

  const onScroll = () => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const el = track.current;
      if (!el || !el.clientWidth) return;
      const index = Math.min(Math.max(Math.round(Math.abs(el.scrollLeft) / el.clientWidth), 0), count - 1);
      if (target.current != null) {
        if (index !== target.current) return;
        stopTarget();
      }
      if (index !== reported.current) {
        reported.current = index;
        setActive(index);
        mark(index);
        onIndexChange?.(index);
      }
    });
  };

  // با عوض‌شدن اندازه (چرخاندن گوشی، تغییر پنجره) اسلاید جاری سر جایش می‌ماند
  useEffect(() => {
    const el = track.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let width = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === width) return;
      width = el.clientWidth;
      const sign = getComputedStyle(el).direction === "rtl" ? -1 : 1;
      el.scrollTo({ left: sign * reported.current * width, behavior: "auto" });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      clearTimeout(targetTimer.current);
    },
    []
  );

  const step = (delta) => goTo((reported.current + delta + count) % count);
  const arrowClass = `img-slider-arrow ${card ? "img-slider-arrow--card" : "img-slider-arrow--page"}`;
  const arrowIcon = card ? "h-4 w-4" : "h-5 w-5";
  // در کارت کنترل‌ها فقط با موس و لمس‌اند (کل کارت لینک است و ۲ توقف تب اضافه برای هر کارت آزاردهنده است)
  const tab = card ? -1 : undefined;

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      className={`img-slider overflow-hidden ${card ? "img-slider--card" : ""} ${className}`}
      onPointerEnter={card ? () => mark(reported.current) : undefined}
      onTouchStart={card ? () => mark(reported.current) : undefined}
    >
      <div
        ref={track}
        dir="rtl"
        onScroll={onScroll}
        onPointerDown={stopTarget}
        onWheel={stopTarget}
        className={`no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto ${card ? "" : "overscroll-x-contain"}`}
      >
        {images.map((src, index) => (
          <div
            key={src}
            role="group"
            aria-roledescription="slide"
            aria-label={`${fa(index + 1)} از ${fa(count)}`}
            data-active={index === active}
            inert={index !== active}
            className="relative h-full w-full shrink-0 basis-full snap-start snap-always"
          >
            {renderSlide(src, index, { load: seen.has(index), active: index === active })}
          </div>
        ))}
      </div>

      {many && (
        <>
          <button type="button" tabIndex={tab} aria-label="تصویر بعدی" onClick={() => step(1)} className={`${arrowClass} ${card ? "left-2" : "left-3"}`}>
            <ChevronLeft className={arrowIcon} strokeWidth={2.5} aria-hidden="true" />
          </button>
          <button type="button" tabIndex={tab} aria-label="تصویر قبلی" onClick={() => step(-1)} className={`${arrowClass} ${card ? "right-2" : "right-3"}`}>
            <ChevronRight className={arrowIcon} strokeWidth={2.5} aria-hidden="true" />
          </button>
          <div className={`img-slider-dots ${dotsClassName}`}>
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                tabIndex={tab}
                aria-label={`نمایش تصویر ${fa(index + 1)} از ${fa(count)}`}
                aria-current={index === active ? "true" : undefined}
                onClick={() => goTo(index)}
                className="img-slider-dot"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
