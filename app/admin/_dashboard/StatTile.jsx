"use client";

import { useId } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useReveal } from "@/app/admin/_ui/useReveal";
import { useCountUp } from "@/app/admin/_ui/useCountUp";
import { fa } from "./format";
import { sparkGeometry, sparkPath } from "./spark";
import { TONES } from "./tones";

// تغییر نسبت به دورهٔ قبل در یک چیپ روبروی عنوان کاشی: جهت با آیکون و کلمه هم گفته می‌شود، نه فقط رنگ. در این چهار شاخص «بیشتر» همیشه خوب است.
// چیپ عمداً کوچک است (۱۱px): روی کاشی‌های باریک (پنجرهٔ حدود ۱۲۸۰px و گوشی) فقط حدود ۷۰px برای عنوان می‌ماند.
// رنگ زمینه از رنگ وضعیت‌ها (سبز تحویل‌شده / قرمز مرجوع) با شفافیت کم است و متن از رنگ تیره‌ترِ همان خانواده، تا خوانا بماند
const CHIP = "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold leading-5";
const FLAT = "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200";
const UP = {
  background: "color-mix(in srgb, var(--viz-st-delivered) 14%, white)",
  color: "var(--viz-good-text)",
  boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--viz-st-delivered) 30%, white)",
};
const DOWN = {
  background: "color-mix(in srgb, var(--viz-st-returned) 12%, white)",
  color: "color-mix(in srgb, var(--viz-bad-text) 82%, black)",
  boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--viz-st-returned) 30%, white)",
};

export function DeltaChip({ change }) {
  if (change === null) return <span className={`${CHIP} ${FLAT}`}>جدید</span>;
  if (change === 0) {
    return (
      <span className={`${CHIP} ${FLAT}`}>
        <Minus className="h-3 w-3" aria-hidden="true" />
        بدون تغییر
      </span>
    );
  }
  const up = change > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={CHIP} style={up ? UP : DOWN}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>
        {fa(Math.abs(change))}٪ {up ? "بیشتر" : "کمتر"}
      </span>
    </span>
  );
}

// توضیح زیر عدد: چیپ بالا می‌گوید چقدر، این می‌گوید نسبت به چه دوره‌ای
const caption = (change, days) => (change === null ? `در ${fa(days)} روز قبل سابقه‌ای نبود` : `نسبت به ${fa(days)} روز قبل`);

// نمودار کوچک روند (قدیمی‌ترین روز سمت راست؛ هندسه در spark.js). خط و نقطهٔ پایانی به رنگ سری؛ نقطه حلقهٔ هم‌رنگ سطح دارد.
// زیر هر تکهٔ خط یک ناحیهٔ شیب‌دار (کم‌رنگ‌شونده به پایین) است. خط با دیده‌شدن کاشی کشیده می‌شود، ناحیه محو می‌شود و نقطهٔ پایانی آخر ظاهر می‌شود
function Sparkline({ values, baseline, width = 96, height = 34 }) {
  const gid = `sp${useId().replace(/:/g, "")}`;
  const geo = sparkGeometry(values, { width, height, baseline });
  if (!geo) return null;
  const floor = height - 2;
  const areas = geo.segments
    .filter((seg) => seg.length > 1)
    .map((seg) => `${seg.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ")} L${seg[seg.length - 1][0].toFixed(1)} ${floor} L${seg[0][0].toFixed(1)} ${floor} Z`)
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="shrink-0 overflow-visible" data-spark="">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--viz-series)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--viz-series)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="spark-area" d={areas} fill={`url(#${gid})`} stroke="none" />
      <path className="spark-line" d={sparkPath(geo.segments)} pathLength="1" fill="none" stroke="var(--viz-series)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle className="spark-dot" cx={geo.last[0]} cy={geo.last[1]} r="4" fill="var(--viz-series)" stroke="var(--viz-surface)" strokeWidth="2" />
    </svg>
  );
}

// اندازهٔ عدد درشت: حداکثر ۳۰px، ولی مبلغ کامل (مثلاً «۸۲۰٬۶۰۰٬۰۰۰») باید با واحدش در یک خط جا شود؛ پس از عرض کاشی (cqw) و تعداد نویسه‌ها
// حساب می‌شود (۰٫۵۶em برای هر نویسه با حاشیه‌ی اطمینان؛ ۵٫۲۵rem = دو حاشیهٔ کاشی + واحد)
const valueSize = (num, unit) => `min(1.875rem, calc((100cqw - ${unit ? "5.25rem" : "2rem"}) / ${(String(num).length * 0.56).toFixed(2)}))`;

// کاشی شاخص: نوار رنگی بالا، آیکون و عنوان با چیپ تغییر روبرویشان، عدد درشت، و زیرش توضیح دوره و (اگر باشد) روند در گوشه. عدد صفر کم‌رنگ می‌شود
export default function StatTile({ label, icon: Icon, tone = "brand", value, zero = false, change, days, spark, sparkBaseline = "zero", busy = false, index = 0 }) {
  const t = TONES[tone];
  const [ref, shown] = useReveal();
  // عدد درشت با دیده‌شدن کاشی از صفر تا مقدار می‌شمارد (value.raw)؛ هنگام عوض‌شدن بازه از همان عدد فعلی به عدد تازه می‌رود. اندازهٔ قلم از رشتهٔ نهایی حساب
  // می‌شود (value.num) تا هنگام شمارش اندازه نپرد
  const counted = useCountUp(value.raw ?? 0, { run: shown && value.raw !== undefined, delay: index * 60, duration: 1100 });
  const text = value.raw === undefined ? value.num : fa(Math.round(counted));
  return (
    <div
      ref={ref}
      data-in={shown ? "" : undefined}
      className={`dash-rise group @container relative min-w-0 overflow-hidden rounded-2xl bg-white p-4 pt-5 shadow-sm ring-1 ring-gray-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${busy ? "opacity-60" : ""}`}
      style={{ "--i": index }}
    >
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${t.bar}`} />
      <div className="flex min-h-10 flex-wrap items-center gap-x-2.5 gap-y-2">
        <div className="flex min-w-0 flex-1 basis-24 items-center gap-2.5">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-110 ${t.badge}`}>
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <p className="min-w-0 text-balance text-sm font-medium leading-5 text-gray-600">{label}</p>
        </div>
        <span className="ms-auto">
          <DeltaChip change={change} />
        </span>
      </div>
      <p className="mt-3.5 flex h-[1.875rem] flex-wrap content-end items-baseline gap-x-1.5">
        <span className={`leading-none ${zero ? "font-medium text-gray-300" : "font-extrabold text-gray-900"}`} style={{ fontSize: valueSize(value.num, value.unit) }}>
          {text}
        </span>
        {value.unit && <span className="whitespace-nowrap text-sm font-medium text-gray-500">{value.unit}</span>}
      </p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-[11px] leading-4 text-gray-500">{caption(change, days)}</p>
        {spark && <Sparkline values={spark} baseline={sparkBaseline} />}
      </div>
    </div>
  );
}
