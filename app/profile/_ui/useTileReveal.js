"use client";

import { useEffect, useRef, useState } from "react";

// کاشی‌های پایین صفحه تا وقتی به آن‌ها نرسیده‌ایم ناپیدا می‌مانند و با رسیدن (دست‌کم ۱۲٪ کاشی در صفحه) یک بار وارد می‌شوند، مثل کاشی‌های داشبورد پنل مدیریت (useReveal).
// early: کاشی‌هایی که در همان لحظهٔ بارگذاری جلوی چشم‌اند پله‌ای و با تأخیر --i وارد می‌شوند (هماهنگ با هم)؛ کاشی‌ای که با اسکرول می‌رسد بی‌تأخیر، وگرنه تا ۴۵۰ میلی‌ثانیه
// بعد از رسیدن خالی می‌ماند. بدون IntersectionObserver (مرورگر خیلی قدیمی) فوراً دیده می‌شود. ref تابعی است تا کاشی‌ای که بعداً ساخته می‌شود هم زیر نظر برود.
// پرش (کلید End، لینک لنگری، اسکرول بازیابی‌شده) صفحه را از کنار کاشی رد می‌کند بی‌آنکه هیچ‌وقت «دیده‌شده» حساب شود؛ پس کاشی‌ای که بالای پنجره جا ماند هم دیده‌شده است
const EARLY_MS = 900;

export function useTileReveal() {
  const [node, setNode] = useState(null);
  const [state, setState] = useState({ shown: false, early: false });
  const born = useRef(0);

  useEffect(() => {
    born.current = performance.now();
  }, []);

  useEffect(() => {
    if (!node || state.shown) return undefined;
    const done = () => setState({ shown: true, early: performance.now() - born.current < EARLY_MS });
    if (typeof IntersectionObserver === "undefined") {
      setState({ shown: true, early: true });
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) done();
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(node);
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (node.getBoundingClientRect().top < 0) done();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [node, state.shown]);

  return [setNode, state];
}
