"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// نوار باریک پیشرفت بالای صفحه هنگام رفتن به صفحهٔ دیگر (مرحلهٔ ۵). صفحه‌های فروشگاه سروری‌اند و تا آمادگی صفحهٔ بعد چند صد میلی‌ثانیه
// هیچ چیز عوض نمی‌شود؛ این نوار نشان می‌دهد کلیک گرفته شده. برای هیچ صفحه‌ای loading.js اضافه نشده چون streaming کد وضعیت ۴۰۴ و ریدایرکت‌ها را خراب می‌کرد.
// شروع: کلیک روی لینکی به آدرس داخلیِ دیگر (بدون کلید کمکی و بدون target)؛ پایان: عوض شدن آدرس. اگر ناوبری زود تمام شود (کمتر از SHOW_DELAY) نوار اصلاً دیده نمی‌شود.
// حالت‌ها در data-state (idle | loading | done) و استایل در globals.css (.nav-progress)؛ بدون state ریاکت تا هر کلیک رندر اضافه نسازد.
const SHOW_DELAY = 120;
const GIVE_UP = 8000;

export default function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const route = `${pathname}?${search}`;
  const bar = useRef(null);
  const run = useRef({ active: false, show: 0, giveUp: 0, hide: 0 });

  // آدرس عوض شد = ناوبری تمام شد
  useEffect(() => {
    const el = bar.current;
    const r = run.current;
    if (!el || !r.active) return;
    r.active = false;
    clearTimeout(r.show);
    clearTimeout(r.giveUp);
    if (el.dataset.state === "loading") {
      el.dataset.state = "done";
      r.hide = setTimeout(() => {
        el.dataset.state = "idle";
      }, 700);
    } else {
      el.dataset.state = "idle";
    }
  }, [route]);

  useEffect(() => {
    const el = bar.current;
    const r = run.current;
    if (!el) return;

    const stop = () => {
      r.active = false;
      clearTimeout(r.show);
      clearTimeout(r.giveUp);
      el.dataset.state = "idle";
    };

    const onClick = (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      let url;
      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      // آدرس بیرونی، tel:، mailto: و همان صفحه (یا فقط #بخش) ناوبری نیستند
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      clearTimeout(r.show);
      clearTimeout(r.giveUp);
      clearTimeout(r.hide);
      r.active = true;
      el.dataset.state = "idle"; // نوار قبلی (اگر مانده) فوری صفر می‌شود
      r.show = setTimeout(() => {
        if (r.active) el.dataset.state = "loading";
      }, SHOW_DELAY);
      // کلیکی که در عمل جایی نرفت (مثلاً لینکی که کنترل‌کننده‌اش جلوی رفتن را گرفت) نوار را برای همیشه باز نگذارد
      r.giveUp = setTimeout(stop, GIVE_UP);
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clearTimeout(r.show);
      clearTimeout(r.giveUp);
      clearTimeout(r.hide);
    };
  }, []);

  return (
    <div ref={bar} data-state="idle" aria-hidden="true" className="nav-progress">
      <span />
    </div>
  );
}
