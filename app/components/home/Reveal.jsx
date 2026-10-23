"use client";

import { useEffect, useRef } from "react";

// ظاهر شدن نرم یک بخش هنگام رسیدن به آن در اسکرول (فقط یک بار).
// بدون جاوااسکریپت یا با «کاهش حرکت» سیستم، بخش از اول دیده می‌شود (استایل در globals.css فقط وقتی فعال است که scripting فعال باشد).
export default function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add("is-in");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-in");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-reveal className={className} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}
