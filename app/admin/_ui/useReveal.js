"use client";

import { useEffect, useState } from "react";

// true شدنِ یک‌بارهٔ «دیده شد»: وقتی عنصر برای اولین بار (دست‌کم ۱۵٪ آن) به صفحه می‌رسد. نمودارها و نوارها با همین شروع به حرکت می‌کنند تا آنچه پایین‌تر از
// صفحه است هنگام اسکرول و جلوی چشم کاربر رسم شود، نه ناپیدا و همان لحظهٔ بارگذاری. بدون IntersectionObserver (مرورگر خیلی قدیمی) فوراً true است.
// به‌جای ref معمولی، ref تابعی برمی‌گرداند: اگر عنصر بعداً ساخته شود (مثلاً با برگشتن از نمای جدول به نمودار) همان لحظه زیر نظر گرفته می‌شود
export function useReveal(options) {
  const [node, setNode] = useState(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!node || shown) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px", ...options },
    );
    io.observe(node);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- گزینه‌ها فقط هنگام ساخته‌شدن خوانده می‌شوند
  }, [node, shown]);
  return [setNode, shown];
}
