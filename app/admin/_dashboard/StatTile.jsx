"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { fa } from "./format";
import { TONES } from "./tones";

// تغییر نسبت به دورهٔ قبل: جهت با آیکون و علامت هم گفته می‌شود، نه فقط رنگ. در این چهار شاخص «بیشتر» همیشه خوب است
export function Delta({ change, days }) {
  const head = "flex items-center gap-1 text-xs font-bold";
  const sub = "text-[11px] text-gray-500";
  if (change === null) {
    return (
      <span className="flex flex-col gap-0.5">
        <span className={`${head} text-gray-600`}>جدید</span>
        <span className={sub}>در {fa(days)} روز قبل سابقه‌ای نبود</span>
      </span>
    );
  }
  if (change === 0) {
    return (
      <span className="flex flex-col gap-0.5">
        <span className={`${head} text-gray-600`}>
          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
          بدون تغییر
        </span>
        <span className={sub}>نسبت به {fa(days)} روز قبل</span>
      </span>
    );
  }
  const up = change > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className="flex flex-col gap-0.5">
      <span className={head} style={{ color: up ? "var(--viz-good-text)" : "var(--viz-bad-text)" }}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <span>
          {fa(Math.abs(change))}٪ {up ? "بیشتر" : "کمتر"}
        </span>
      </span>
      <span className={sub}>از {fa(days)} روز قبل</span>
    </span>
  );
}

// نمودار کوچک روند (قدیمی‌ترین روز سمت راست). خط و نقطهٔ پایانی به رنگ سری؛ نقطه حلقهٔ هم‌رنگ سطح دارد
function Sparkline({ values, width = 96, height = 34 }) {
  const max = Math.max(...values);
  if (!(max > 0) || values.length < 2) return null;
  const pad = 5;
  const step = (width - 2 * pad) / (values.length - 1);
  const x = (i) => width - pad - i * step;
  const y = (v) => height - pad - (v / max) * (height - 2 * pad);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const last = values.length - 1;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="shrink-0" data-spark="">
      <path d={d} fill="none" stroke="var(--viz-series)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last)} cy={y(values[last])} r="4" fill="var(--viz-series)" stroke="var(--viz-surface)" strokeWidth="2" />
    </svg>
  );
}

// کاشی شاخص: نوار رنگی بالا و آیکون همرنگ، عدد درشت، تغییر نسبت به دورهٔ قبل و (اگر باشد) روند در گوشه. عدد صفر کم‌رنگ می‌شود
export default function StatTile({ label, icon: Icon, tone = "brand", value, zero = false, change, days, spark, busy = false, index = 0 }) {
  const t = TONES[tone];
  return (
    <div
      className={`dash-rise group relative min-w-0 overflow-hidden rounded-2xl bg-white p-4 pt-5 shadow-sm ring-1 ring-gray-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${busy ? "opacity-60" : ""}`}
      style={{ "--i": index }}
    >
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${t.bar}`} />
      <div className="flex items-center gap-2.5">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-110 ${t.badge}`}>
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <p className="min-w-0 text-sm font-medium text-gray-600">{label}</p>
      </div>
      <p className="mt-3.5 flex flex-wrap items-baseline gap-x-1.5">
        <span className={`text-3xl leading-none ${zero ? "font-medium text-gray-300" : "font-extrabold text-gray-900"}`}>{value.num}</span>
        {value.unit && <span className="whitespace-nowrap text-sm font-medium text-gray-500">{value.unit}</span>}
      </p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <Delta change={change} days={days} />
        {spark && <Sparkline values={spark} />}
      </div>
    </div>
  );
}
