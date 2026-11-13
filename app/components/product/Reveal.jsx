"use client";

import { useEffect, useRef } from "react";

// بخش‌های پایین صفحهٔ محصول تا وقتی به آن‌ها نرسیده‌ایم ناپیدا می‌مانند و با رسیدن یک بار نرم وارد می‌شوند (استایل: .pd-reveal در product.css).
// صفت data-in را مستقیم روی DOM می‌گذارد (نه state)، پس رندر دوباره‌ای ندارد و HTML سروری و کلاینتی یکی می‌ماند. بدون IntersectionObserver فوراً دیده می‌شود.
// پرش (کلید End، لینک لنگری، اسکرول بازیابی‌شده) صفحه را از کنار بخش رد می‌کند بی‌آنکه هیچ‌وقت «دیده‌شده» حساب شود؛ برای همین با اسکرول هم
// بررسی می‌شود که بخش بالای پنجره جا نمانده باشد (مثل useTileReveal پروفایل).
export default function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || node.hasAttribute("data-in")) return undefined;
    const show = () => node.setAttribute("data-in", "");
    if (typeof IntersectionObserver === "undefined") {
      show();
      return undefined;
    }
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (node.getBoundingClientRect().top < 0) done();
      });
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) done();
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" }
    );
    function done() {
      show();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    }
    io.observe(node);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Tag ref={ref} className={`pd-reveal ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
