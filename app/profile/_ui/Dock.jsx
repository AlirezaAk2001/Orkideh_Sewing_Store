"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

// دوک شناور در گوشهٔ صفحه (دسکتاپ؛ ریل .dock-rail بیرون از ستون محتوا): ناوبری پنل. «حباب» صورتی که با فنر زیر گزینهٔ فعال می‌لغزد، شمارندهٔ هر بخش، و زیر خط جداکننده فروشگاه، دکمهٔ باز/بسته‌کردن و خروج.
// مثل منوی کناری پنل مدیریت دو حالت دارد: بسته (پیش‌فرض) فقط آیکون با برچسب هنگام هاور، و باز با برچسب کنار هر آیکون و یک لایهٔ تیرهٔ کم‌رنگ با کمی بلور پشتش (dock-scrim).
// محتوا تا جایی که چیدمان کاشی‌ها اجازه می‌دهد کنار می‌رود و وقتی جا نیست (صفحه‌های باریک‌تر از ۱۲۳۰) دوک روی آن می‌افتد؛ جزئیاتش در profile.css (.app). با انتخاب یک بخش،
// کلیک روی لایهٔ تیره یا Esc دوباره بسته می‌شود. زیر ۸۲۰ پیکسل (کوئری ظرف) پنهان است و TabBar جایش را می‌گیرد
export function Dock({ tab, counts, onNav, onLogout }) {
  const dockRef = useRef(null);
  const toggleRef = useRef(null);
  const navRef = useRef(null);
  const blobRef = useRef(null);
  const first = useRef(true);
  const [open, setOpen] = useState(false);

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

  // با تغییر اندازه (باز شدن دوک بعد از پنهان بودن، بارگذاری فونت) دوباره جا می‌گیرد. فقط تغییر ارتفاع مهم است: حباب فقط عمودی جابه‌جا می‌شود، و با باز و بسته‌شدن دوک پهنا هر لحظه عوض می‌شود
  // که اگر آن را هم می‌شنید لغزش فنری حباب (انتخاب یک بخش از دوک باز) را وسط راه می‌پراند
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;
    let lastHeight = -1;
    const ro = new ResizeObserver(() => {
      if (nav.offsetHeight === lastHeight) return;
      lastHeight = nav.offsetHeight;
      place(true);
    });
    ro.observe(nav);
    document.fonts?.ready.then(() => place(true));
    return () => ro.disconnect();
  }, []);

  // دوک باز با Esc (فوکوس به دکمهٔ باز/بسته برمی‌گردد) و با کلیک بیرون از خودش بسته می‌شود
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    const onDown = (e) => {
      if (!dockRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  // انتخاب یک بخش (کلیک ساده؛ با کلید کمکی یا دکمهٔ میانی مرورگر تب تازه باز می‌کند و دوک همان‌طور می‌ماند) دوک را می‌بندد تا محتوا روی صفحه پوشیده نماند
  const pick = (key) => (e) => {
    clickNav(onNav, key)(e);
    if (e.defaultPrevented) setOpen(false);
  };

  // هر ردیف: آیکون (همیشه همان جا)، برچسب دوک باز (dl) و برچسب هاور دوک بسته (tip)
  return (
    <>
      <div className="dock-scrim" data-on={open ? "" : undefined} aria-hidden="true" />
      <div className="dock-rail">
        <aside ref={dockRef} className="dock" data-open={open ? "" : undefined} aria-label="حساب کاربری">
          <nav className="dock-nav" ref={navRef} aria-label="بخش‌های حساب">
            <span className="blob" ref={blobRef} aria-hidden="true" />
            {TABS.map((t) => (
              <Link key={t.key} href={tabHref(t.key)} scroll={false} prefetch={false} className="nb" aria-current={tab === t.key ? "page" : "false"} aria-label={t.label} onClick={pick(t.key)}>
                <Ic n={t.icon} />
                <span className="dl" aria-hidden="true">
                  {t.label}
                </span>
                <span className="tip">{t.label}</span>
                {t.badge && <Badge n={counts[t.badge]} />}
              </Link>
            ))}
          </nav>
          <hr />
          <div className="dock-foot">
            <Link href="/products" prefetch={false} className="nb" aria-label="فروشگاه">
              <Ic n="store" />
              <span className="dl" aria-hidden="true">
                فروشگاه
              </span>
              <span className="tip">فروشگاه</span>
            </Link>
            <button ref={toggleRef} type="button" className="nb" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? "جمع کردن منو" : "باز کردن منو"}>
              <Ic n={open ? "panelClose" : "panelOpen"} />
              <span className="dl" aria-hidden="true">
                جمع کردن منو
              </span>
              <span className="tip">باز کردن منو</span>
            </button>
            <button type="button" className="nb out" onClick={onLogout} aria-label="خروج از حساب">
              <Ic n="out" />
              <span className="dl" aria-hidden="true">
                خروج از حساب
              </span>
              <span className="tip">خروج از حساب</span>
            </button>
          </div>
        </aside>
      </div>
    </>
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
