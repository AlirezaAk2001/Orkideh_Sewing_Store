"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useChangeKey } from "@/lib/motion";
import { Ic } from "./icons";
import { fa } from "./format";
import { TABS, tabHref } from "./tabs";

// شمارندهٔ کنار آیکون: فقط وقتی عدد عوض می‌شود جهش می‌کند، نه هنگام نمایش اولیه
function Badge({ n }) {
  const changed = useChangeKey(n || 0);
  if (!n) return null;
  return (
    <span key={changed} className={`bd ${changed ? "pop" : ""}`.trim()}>
      {fa(n)}
    </span>
  );
}

// کلیک ساده روی لینک بخش، بدون جابه‌جایی صفحه، بخش را عوض می‌کند؛ کلیک با کلید کمکی یا دکمهٔ میانی کار عادی مرورگر را می‌کند (باز شدن در تب تازه)
const clickNav = (onNav, key) => (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  onNav(key);
};

// دوک شناور کنار صفحه (دسکتاپ): تنها ناوبری پنل. «حباب» صورتی که با فنر زیر گزینهٔ فعال می‌لغزد،
// برچسب هنگام هاور و شمارندهٔ هر بخش. زیر ۸۲۰ پیکسل (کوئری ظرف) پنهان است و TabBar جایش را می‌گیرد
export function Dock({ tab, counts, onNav, onLogout }) {
  const navRef = useRef(null);
  const blobRef = useRef(null);
  const first = useRef(true);

  const place = (instant) => {
    const nav = navRef.current;
    const blob = blobRef.current;
    const cur = nav?.querySelector('[aria-current="page"]');
    if (!cur || !blob || !cur.offsetHeight) return;
    if (instant) blob.style.transition = "none";
    blob.style.transform = `translateY(${cur.offsetTop}px)`;
    if (instant) {
      blob.offsetHeight; // خواندن اندازه تا بدون انیمیشن جا بگیرد
      blob.style.transition = "";
    }
  };

  // اولین جایگیری بی‌انیمیشن؛ بعد از آن با هر عوض‌شدن بخش حباب می‌لغزد
  useLayoutEffect(() => {
    place(first.current);
    first.current = false;
  }, [tab]);

  // با تغییر اندازه (باز شدن دوک بعد از پنهان بودن، بارگذاری فونت) دوباره جا می‌گیرد
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;
    const ro = new ResizeObserver(() => place(true));
    ro.observe(nav);
    document.fonts?.ready.then(() => place(true));
    return () => ro.disconnect();
  }, []);

  return (
    <aside className="dock" aria-label="حساب کاربری">
      <nav className="dock-nav" ref={navRef} aria-label="بخش‌های حساب">
        <span className="blob" ref={blobRef} aria-hidden="true" />
        {TABS.map((t) => (
          <Link key={t.key} href={tabHref(t.key)} scroll={false} prefetch={false} className="nb" aria-current={tab === t.key ? "page" : "false"} aria-label={t.label} onClick={clickNav(onNav, t.key)}>
            <Ic n={t.icon} />
            <span className="tip">{t.label}</span>
            {t.badge && <Badge n={counts[t.badge]} />}
          </Link>
        ))}
      </nav>
      <hr />
      <button type="button" className="nb out" onClick={onLogout} aria-label="خروج از حساب">
        <Ic n="out" />
        <span className="tip">خروج از حساب</span>
      </button>
    </aside>
  );
}

// نوار پایین موبایل: تب فعال باز می‌شود و نامش را نشان می‌دهد
export function TabBar({ tab, counts, onNav }) {
  return (
    <nav className="tabbar" aria-label="حساب کاربری">
      {TABS.map((t) => (
        <Link key={t.key} href={tabHref(t.key)} scroll={false} prefetch={false} className="tb" aria-current={tab === t.key ? "page" : "false"} aria-label={t.label} onClick={clickNav(onNav, t.key)}>
          <Ic n={t.icon} />
          <span className="lb">
            {t.short ? (
              <>
                <span className="lb-full">{t.label}</span>
                <span className="lb-short">{t.short}</span>
              </>
            ) : (
              t.label
            )}
          </span>
          {t.badge && <Badge n={counts[t.badge]} />}
        </Link>
      ))}
    </nav>
  );
}
