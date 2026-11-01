"use client";

import { fa } from "@/app/admin/_dashboard/format";
import { useReveal } from "./useReveal";
import { useCountUp } from "./useCountUp";
import { useShineClock } from "./useShineClock";

// نوار افقی مقدار، همان طراحی «درصد داخل نوار»: عدد درست وسط نوار می‌نشیند و نوار از لبهٔ چپ به سمت راست به اندازهٔ value (۰ تا ۱۰۰) پر می‌شود؛ با کم‌شدن مقدار به همان راه جمع می‌شود.
// عدد دو نسخه دارد: تیره روی زمینهٔ خاکستری و سفید روی بخش پر؛ نسخهٔ سفید فقط تا لبهٔ پرشدگی دیده می‌شود (clip-path هم‌زمان با پرشدن حرکت می‌کند)،
// پس وقتی لبه از وسط عدد رد می‌شود، هر حرف تا همان‌جا سفید و بعدش تیره است و در هیچ مقداری ناخوانا نمی‌شود.
// نمونه‌ها: <ValueBar value={57} /> «۵۷٪»؛ <ValueBar value={qty / max * 100} number={qty} suffix=" عدد" /> نوار مقایسه‌ای با عدد خودِ کالا؛
// <ValueBar value={0} text="ناموجود" /> متن ثابت. عدد با دیده‌شدن نوار از صفر تا مقدار می‌شمارد. فرض راست‌به‌چپ بودن صفحه است (پنل فارسی)
const TONES = {
  brand: { c: "var(--color-brand-600)", ma: "100%", mb: "78%" },
  green: { c: "#0ca30c" },
  blue: { c: "#2a78d6" },
  red: { c: "#d03b3b" },
  gray: { c: "#85847e" },
  // زرد و نارنجی روشن می‌مانند و به‌جای سفید، عددِ روی بخش پر تیره است (سفید روی زرد خوانا نیست)؛ برق (sa = شدت سفید) هم پررنگ‌تر است تا روی زمینهٔ روشن
  // همان‌قدر دیده شود (پیش‌فرض ۰٫۵)
  amber: { c: "#f5b00a", ink: "#3b2600", ma: "100%", mb: "86%", sa: 0.9 },
  orange: { c: "#ee7f4b", ink: "#3d1a08", ma: "100%", mb: "84%", sa: 0.8 },
};

const SIZES = {
  sm: "h-5 text-[11px]",
  md: "h-6 text-xs",
  lg: "h-7 text-[13px]",
};

// plain = بدون هاشور (کارت وضعیت سفارش‌ها)؛ بقیه هاشور مورب متحرک دارند (استایل در globals.css).
// shine = هر چند ثانیه یک برق نرم روی بخش پر؛ برای همهٔ نوارهای دارای shine هم‌زمان است (useShineClock)
export default function ValueBar({ value, number = value, suffix = "٪", text, tone = "brand", color, size = "md", delay = 0, plain = false, shine = false, label, className = "" }) {
  const t = TONES[tone] ?? TONES.brand;
  const [ref, shown] = useReveal();
  useShineClock(shine);
  const p = Math.min(100, Math.max(0, Number(value) || 0));
  const count = useCountUp(Number(number) || 0, { run: shown && text === undefined, delay: delay + 150, duration: 1000 });
  const final = text ?? `${fa(Math.round(Number(number) || 0))}${suffix}`;
  const live = text ?? `${fa(Math.round(count))}${suffix}`;

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p)}
      aria-valuetext={final}
      data-in={shown ? "" : undefined}
      data-plain={plain ? "" : undefined}
      data-shine={shine ? "" : undefined}
      className={`vbar relative isolate overflow-hidden rounded-full bg-gray-100 ${SIZES[size]} ${className}`}
      style={{ "--p": shown ? p : 0, "--pb-c": color ?? t.c, "--pb-ma": color ? undefined : t.ma, "--pb-mb": color ? undefined : t.mb, "--pb-ink": color ? undefined : t.ink, "--pb-sa": color ? undefined : t.sa, "--d": `${delay}ms` }}
    >
      <span className="vbar-fill absolute inset-y-0 left-0 overflow-hidden rounded-full" aria-hidden="true" />
      <span className="vbar-dark absolute inset-0 grid place-items-center whitespace-nowrap font-extrabold tabular-nums text-gray-700" aria-hidden="true">
        {live}
      </span>
      <span className="vbar-light absolute inset-0 grid place-items-center whitespace-nowrap font-extrabold tabular-nums" aria-hidden="true">
        {live}
      </span>
    </div>
  );
}
