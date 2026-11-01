"use client";

import { useEffect, useRef, useState } from "react";

// عدد را از مقدار فعلی تا target می‌شمارد (easeOutCubic). run=false یعنی هنوز شروع نکن (عدد صفر می‌ماند تا نوارها دیده شوند).
// با «کاهش حرکت» سیستم عدد نهایی بلافاصله نشان داده می‌شود. اگر target وسط راه عوض شود، از همان‌جا ادامه می‌دهد، نه از صفر
export const prefersReducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function useCountUp(target, { run = true, duration = 1000, delay = 0 } = {}) {
  const [value, setValue] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    if (!run) return;
    const to = Number(target) || 0;
    if (prefersReducedMotion()) {
      current.current = to;
      setValue(to);
      return;
    }
    const from = current.current;
    let raf;
    let t0;
    const step = (now) => {
      t0 ??= now;
      const k = Math.min(1, Math.max(0, (now - t0 - delay) / duration));
      const v = from + (to - from) * (1 - Math.pow(1 - k, 3));
      current.current = v;
      setValue(v);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration, delay]);

  return value;
}
