"use client";

import { useRef } from "react";
import { useSegmentSlide } from "@/app/admin/_ui/useSegmentSlide";

const fa = (n) => Number(n).toLocaleString("fa-IR");

// تب‌های قطعهٔ صفحه‌های سفارش‌ها و نظرات: نوار خاکستری گرد با تب فعال سفید و برجسته، آیکون و نوار زیرینِ هم‌رنگ آن تب و چیپ شمار. همان ظاهر
// فیلتر دسته‌بندی محصولات. tabs: [{ id, label, icon, count, color, ink }] (color رنگ آیکون و نوار، ink رنگ تیره‌تر برای نوشتهٔ شمار)؛ روی گوشی نوار
// به‌جای شکستن، افقی اسکرول می‌شود. دسترسی‌پذیری: role=tablist/tab با تب‌ایندکس چرخشی؛ فلش‌ها (در راست‌به‌چپ فلش چپ = بعدی)، Home و End جابه‌جا می‌کنند.
// idPrefix شناسهٔ تب‌ها را می‌سازد (`${idPrefix}-tab-${id}`) و panelId همان ناحیهٔ محتوای role=tabpanel است
export default function SegmentedTabs({ label, tabs, value, onChange, loading = false, idPrefix, panelId }) {
  const refs = useRef([]);
  const rootRef = useSegmentSlide(value);

  const go = (index) => {
    const next = (index + tabs.length) % tabs.length;
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e, i) => {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    if (e.key === forward) go(i + 1);
    else if (e.key === back) go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(tabs.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div ref={rootRef} role="tablist" aria-label={label} className="seg flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 [scrollbar-width:none]">
      {tabs.map((t, i) => {
        const on = t.id === value;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${t.id}`}
            aria-selected={on}
            data-on={on ? "" : undefined}
            aria-controls={panelId}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`seg-tab flex h-9 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 ${
              on ? "text-gray-900" : "text-gray-600 hover:bg-white/60 hover:text-gray-900"
            }`}
          >
            <Icon className="h-4 w-4 transition-colors" style={{ color: on ? t.color : undefined }} aria-hidden="true" />
            <span>{t.label}</span>
            <span
              className="grid h-5 min-w-5 place-items-center rounded-full bg-gray-200/80 px-1.5 text-[11px] font-bold tabular-nums text-gray-600 transition-colors"
              style={on ? { background: `color-mix(in srgb, ${t.color} 14%, white)`, color: t.ink ?? t.color } : undefined}
            >
              {loading ? <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" /> : fa(t.count)}
            </span>
            {on && <span aria-hidden="true" className="seg-underline absolute inset-x-3 -bottom-px h-0.5 rounded-full" style={{ background: t.color }} />}
          </button>
        );
      })}
    </div>
  );
}
