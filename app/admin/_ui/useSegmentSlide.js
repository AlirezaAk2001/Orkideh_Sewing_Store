"use client";

import { useLayoutEffect, useRef } from "react";

// لغزش نرم قرص سفید بین تب‌های قطعه‌ای (بازهٔ داشبورد، نمودار/جدول، تب‌های سفارش و نظر، فیلتر دسته‌بندی محصولات).
// قرص خود تب فعال است: .seg-tab[data-on]::before در globals.css. وقتی تب فعال عوض می‌شود، قرصِ تب تازه از جای قرصِ تب قبلی شروع می‌کند و با Web Animations
// API (روی همان شبه‌عنصر) تا جای خودش می‌لغزد. چون قرص هنوز همان جای قبلی را پر می‌کند، لحظهٔ عوض‌شدن هیچ پرشی نیست. اندازه و جای تب‌ها با offsetLeft/offsetWidth
// خوانده می‌شود (نه getBoundingClientRect) تا حرکت سه‌بعدی هاور (که ابعاد را عوض می‌کند) اندازه‌گیری را به‌هم نزند. با «کاهش حرکت» جابه‌جایی فوری است.
// کاربرد: const ref = useSegmentSlide(value)؛ ref روی ظرف تب‌ها (کلاس seg)، و هر تب کلاس seg-tab و data-on={on ? "" : undefined} دارد
const SLIDE_MS = 340;

export function useSegmentSlide(active) {
  const root = useRef(null);
  const previous = useRef(null);

  useLayoutEffect(() => {
    const el = root.current?.querySelector("[data-on]") ?? null;
    const old = previous.current;
    previous.current = el;
    if (!el || !old || old === el || !old.isConnected || typeof el.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fromLeft = old.offsetLeft - el.offsetLeft;
    const fromRight = el.offsetLeft + el.offsetWidth - (old.offsetLeft + old.offsetWidth);
    el.animate([{ left: `${fromLeft}px`, right: `${fromRight}px` }, { left: "0px", right: "0px" }], {
      duration: SLIDE_MS,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      pseudoElement: "::before",
    });
  }, [active]);

  return root;
}
