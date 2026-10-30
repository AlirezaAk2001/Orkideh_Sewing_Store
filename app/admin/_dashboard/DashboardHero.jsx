"use client";

import { useEffect, useState } from "react";
import { CalendarDays, FlaskConical, LayoutDashboard } from "lucide-react";
import Icon from "@mdi/react";
import { mdiCalendarMonthOutline, mdiCalendarMultiselectOutline, mdiCalendarWeekBeginOutline } from "@mdi/js";
import { dayFull, fa } from "./format";

// هر بازه آیکون تقویم خودش را دارد: هفته، ماه، چند ماه
const RANGES = [
  { days: 7, icon: mdiCalendarWeekBeginOutline },
  { days: 30, icon: mdiCalendarMonthOutline },
  { days: 90, icon: mdiCalendarMultiselectOutline },
];

// سربرگ داشبورد: همان گرادیان صورتی و بافت نقطه‌ای صفحه‌های ورود (هویت یک‌دست)، تاریخ امروز، خلاصهٔ یک‌جملهٔ دوره و یک ردیف کنترل (بازهٔ گزارش، داده نمونه).
// کنترل‌ها همهٔ شاخص‌ها و نمودارهای زیرش را محدود می‌کنند
export default function DashboardHero({ summary, days, setDays, loading, demoAvailable, demo, setDemo }) {
  const [today, setToday] = useState(""); // بعد از mount پر می‌شود تا تاریخ سرور و مرورگر هیدراتیشن را به‌هم نزند
  useEffect(() => setToday(dayFull(new Date())), []);

  return (
    <section
      className="auth-panel dash-rise relative overflow-hidden rounded-3xl p-5 pb-12 text-white shadow-[0_22px_50px_-22px_rgb(190_24_93/0.6)] sm:p-7 sm:pb-14"
      aria-labelledby="dash-title"
    >
      <LayoutDashboard className="pointer-events-none absolute -left-5 -top-8 h-44 w-44 -rotate-12 text-white/10" strokeWidth={1.25} aria-hidden="true" />
      <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-11 w-full" viewBox="0 0 800 44" preserveAspectRatio="none" fill="none" aria-hidden="true">
        <path className="auth-stitch" d="M-20 30 C 100 14, 220 40, 360 26 S 600 14, 820 28" stroke="#fff" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="relative z-10 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <p className="flex min-h-5 items-center gap-1.5 text-sm text-white/90">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {today}
          </p>
          <h1 id="dash-title" className="mt-1.5 text-2xl font-extrabold sm:text-3xl">
            داشبورد مدیریت
          </h1>
          <p className="mt-2 min-h-7 max-w-xl text-sm leading-7 text-white/90">{summary}</p>
        </div>

        <div className="flex flex-col items-start gap-2.5 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-white/90">بازهٔ گزارش:</span>
            <div className="inline-flex rounded-xl bg-white/15 p-1 ring-1 ring-white/25 backdrop-blur-sm" role="group" aria-label="بازهٔ گزارش">
              {RANGES.map(({ days: r, icon }) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={days === r}
                  disabled={loading}
                  onClick={() => setDays(r)}
                  className={`inline-flex cursor-pointer flex-col items-center justify-center gap-0.5 whitespace-nowrap rounded-lg px-2 py-1 text-sm font-semibold transition sm:h-8 sm:flex-row sm:gap-1.5 sm:px-3 sm:py-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-wait ${days === r ? "bg-white text-brand-700 shadow-sm" : "text-white/90 hover:bg-white/15"}`}
                >
                  <Icon path={icon} size={0.85} className="shrink-0" aria-hidden="true" />
                  {fa(r)} روز
                </button>
              ))}
            </div>
          </div>

          {demoAvailable && (
            <button
              type="button"
              role="switch"
              aria-checked={!!demo}
              onClick={() => setDemo(!demo)}
              className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl bg-white/15 px-3 py-1.5 text-sm font-medium ring-1 ring-white/25 backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
              داده نمونه
              <span aria-hidden="true" className={`relative h-5 w-9 rounded-full transition-colors ${demo ? "bg-white" : "bg-white/30"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full transition-all duration-200 ${demo ? "start-[1.125rem] bg-brand-600" : "start-0.5 bg-white"}`} />
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
