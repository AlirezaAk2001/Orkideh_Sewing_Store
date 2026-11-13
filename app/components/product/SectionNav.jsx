"use client";

import { useEffect, useRef, useState } from "react";
import { scrollBehavior } from "@/lib/motion";

const fa = (n) => Number(n).toLocaleString("fa-IR");

// نوار چسبان بخش‌های صفحهٔ محصول: تب‌هایی که به بخش‌ها می‌پرند، تبِ بخشِ در حال دیدن با خط لغزان مشخص است (scroll-spy)، و سمت چپ
// «خرید فشرده» (children) که فقط وقتی showMini است می‌آید، یعنی وقتی دکمهٔ اصلی خرید از دید رفته. روی موبایل خرید فشرده نیست (نوار خرید پایین صفحه جایش را می‌گیرد).
// items: [{ id, label, count? }]؛ هر id باید شناسهٔ عنصری در صفحه باشد. استایل: .pd-snav در product.css
export default function SectionNav({ items, showMini = false, children }) {
  const [active, setActive] = useState(items[0]?.id);
  // نوار زیر هدر چسبان می‌ماند؛ ارتفاع هدر با اندازه و صفحه فرق می‌کند، پس اندازه‌گیری می‌شود (۷۶ پیش‌فرض سمت سرور)
  const [top, setTop] = useState(76);
  const [ink, setInk] = useState({ x: 0, w: 0 });
  // خط تا جای اولش نشسته بدون انیمیشن می‌ماند؛ لغزش فقط بین تب‌ها (data-ready)
  const [ready, setReady] = useState(false);
  const tabsRef = useRef(null);
  const ids = items.map((item) => item.id).join(",");

  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return undefined;
    const update = () => setTop(Math.round(header.getBoundingClientRect().height) + 12);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  // بخش جاری = آخرین بخشی که بالای خط کاوش رسیده (کمی پایین‌تر از نوار)؛ ته صفحه همیشه آخرین بخش. با اسکرول و با رندر اول
  useEffect(() => {
    const list = ids.split(",");
    let raf = 0;
    const measure = () => {
      raf = 0;
      const probe = top + 58 + 80;
      let current = list[0];
      for (const id of list) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= probe) current = id;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      setActive(atBottom ? list[list.length - 1] : current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ids, top]);

  // خط لغزان زیر تب فعال. offsetLeft و left:0 هر دو نسبت به لبهٔ چپ محتوای قابل اسکرول‌اند، پس در RTL و با اسکرول هم درست می‌مانند.
  // اندازهٔ تب‌ها با آمدن فونت عوض می‌شود، پس خود تب‌ها هم زیر نظر ResizeObserver‌اند
  useEffect(() => {
    const tabs = tabsRef.current;
    if (!tabs) return undefined;
    const place = () => {
      const tab = tabs.querySelector(`[data-id="${active}"]`);
      if (!tab) return;
      const inset = Math.min(14, tab.offsetWidth / 4);
      setInk((cur) => {
        const next = { x: tab.offsetLeft + inset, w: Math.max(tab.offsetWidth - inset * 2, 0) };
        return cur.x === next.x && cur.w === next.w ? cur : next;
      });
      // اگر تب فعال از نوار بیرون زده (موبایل)، فقط خود نوار تب‌ها اسکرول می‌شود، نه صفحه
      const box = tabs.getBoundingClientRect();
      const r = tab.getBoundingClientRect();
      if (r.left < box.left) tabs.scrollBy({ left: r.left - box.left - 8, behavior: scrollBehavior() });
      else if (r.right > box.right) tabs.scrollBy({ left: r.right - box.right + 8, behavior: scrollBehavior() });
    };
    place();
    const raf = requestAnimationFrame(() => setReady(true));
    const observer = new ResizeObserver(place);
    tabs.querySelectorAll("[data-id]").forEach((tab) => observer.observe(tab));
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [active, ids]);

  const go = (event, id) => {
    const section = document.getElementById(id);
    if (!section) return;
    event.preventDefault();
    setActive(id);
    section.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    section.focus({ preventScroll: true });
  };

  return (
    <nav className="pd-snav" aria-label="بخش‌های صفحه" style={{ top }}>
      <div className="pd-tabs" ref={tabsRef}>
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            data-id={item.id}
            aria-current={active === item.id ? "true" : undefined}
            onClick={(event) => go(event, item.id)}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 rounded-2xl"
          >
            {item.label}
            {item.count != null && <span className="pd-tab-n">{fa(item.count)}</span>}
          </a>
        ))}
        <i className="pd-ink" aria-hidden="true" data-ready={ready ? "" : undefined} style={{ width: ink.w, transform: `translateX(${ink.x}px)` }} />
      </div>
      <div className={`pd-mini ${showMini ? "show" : ""}`} aria-hidden={!showMini} inert={!showMini}>
        {children}
      </div>
    </nav>
  );
}
