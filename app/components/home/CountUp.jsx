"use client";

import { useEffect, useRef } from "react";

const format = (value, decimals) => value.toLocaleString("fa-IR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// عددی که با رسیدن به صفحه از صفر تا مقدار واقعی می‌شمارد (۱٫۴ ثانیه، کند شدن در پایان).
// متن نهایی از همان سرور در HTML است، پس بدون جاوااسکریپت یا با «کاهش حرکت» (که شمارش ندارد) درست دیده می‌شود.
// شمارش مستقیم روی متن عنصر انجام می‌شود، نه state ری‌اکت، پس هر فریم رندر دوباره نمی‌سازد.
export default function CountUp({ to, decimals = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const step = (now) => {
          const progress = Math.min(1, (now - start) / 1400);
          el.textContent = format(to * (1 - Math.pow(1 - progress, 3)), decimals);
          if (progress < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, decimals]);

  return <span ref={ref}>{format(to, decimals)}</span>;
}
