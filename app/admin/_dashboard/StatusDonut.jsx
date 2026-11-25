"use client";

import { useEffect, useId, useState } from "react";
import { ChartPie, Hourglass, PackageCheck, Truck, Undo2 } from "lucide-react";
import { Empty } from "./Panel";
import { fa } from "./format";
import ValueBar from "@/app/admin/_ui/ValueBar";
import { useReveal } from "@/app/admin/_ui/useReveal";
import { useCountUp } from "@/app/admin/_ui/useCountUp";
import "./donut.css";

// ترتیب حلقه: سبز، آبی، قرمز، خاکستری؛ سبز و قرمز کنار هم نمی‌افتند (برای کم‌بینایی رنگ). برچسب‌ها همان برچسب صفحهٔ سفارش‌هاست
const META = [
  { id: "delivered", label: "تحویل‌داده‌شده", color: "var(--viz-st-delivered)", icon: PackageCheck },
  { id: "processing", label: "جاری", color: "var(--viz-st-processing)", icon: Truck },
  { id: "returned", label: "مرجوع شده", color: "var(--viz-st-returned)", icon: Undo2 },
  { id: "pending", label: "منتظر پرداخت", color: "var(--viz-st-pending)", icon: Hourglass },
];

// خودِ حلقه دقیقاً حلقهٔ «آمار سفارش‌ها»ی پنل کاربر است (DonutTile در app/profile/_ui/Overview.jsx و استایل در donut.css): حلقهٔ نازک با سر گرد
// و شکاف میان قطعه‌ها که با ورود دور حلقه کشیده می‌شود، عدد وسط که می‌شمارد و خط نور سفیدی که هر چند ثانیه یک دور می‌گردد (ماسک از خود قطعه‌ها).
// لجند زیر حلقه همان لجند قبلی ادمین است (ردیف با آیکون، تعداد و نوار درصد)؛ هاور روی قطعه یا ردیف همان وضعیت را در حلقه پررنگ و بقیه را کم‌رنگ می‌کند.
// واحد همه‌چیز درصد محیط حلقه است (r = ۱۵٫۹۱۵۵ یعنی محیط ۱۰۰)
const SWEEP_LAP = 3.2; // ثانیه برای یک دور کامل؛ سرعت همیشه و همه‌جا همین است
const SWEEP_MOVE = 0.6; // سهم حرکت از هر چرخه (بقیه مکث)؛ باید با درصدهای sdn-sw-move در donut.css یکی باشد
const SWEEP_MIN_CYCLE = 2.2; // کمترین طول چرخه (ثانیه)
const SWEEP_TAIL = 15; // درصد محیط: طول دُم

// دو فریم بعد از نمایش true می‌شود؛ ترنزیشن‌های ورود (حلقه) از حالت اولیه شروع شوند. enabled: تا حلقه به صفحه نرسیده شروع نمی‌شود
function useArrived(enabled) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!enabled) return undefined;
    let b;
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setOn(true));
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, [enabled]);
  return on;
}

export default function StatusDonut({ statuses }) {
  const [hot, setHot] = useState(null);
  const [ref, shown] = useReveal();
  const arrived = useArrived(shown);
  const maskId = `sdn-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const total = META.reduce((sum, m) => sum + (statuses[m.id] || 0), 0);
  const counted = useCountUp(total, { run: shown, duration: 1300, delay: 500 });

  if (total === 0) {
    return <Empty icon={ChartPie}>در این بازه سفارشی ثبت نشده است.</Empty>;
  }

  // وضعیتی که سفارش ندارد کارت و قطعه ندارد؛ بین قطعه‌ها شکاف می‌افتد و اگر فقط یک وضعیت باشد حلقه کامل است
  const used = META.filter((m) => statuses[m.id] > 0);
  const gap = used.length > 1 ? 6.4 : 0;
  let cum = 0;
  const segs = used.map((m) => {
    const pct = (statuses[m.id] / total) * 100;
    const dash = Math.max(0.01, pct - gap);
    const from = cum + gap / 2;
    cum += pct;
    return { ...m, dash, off: -from, from };
  });
  const focus = segs.find((s) => s.id === hot);

  // خط نور: بدون هاور دور کل حلقه؛ با هاور فقط روی قطعهٔ هاورشده. سرعت ثابت است: مسافتی که سر خط می‌رود (درصد محیط) × (SWEEP_LAP / ۱۰۰) = زمان حرکت
  const idleStart = (segs[0]?.from ?? 0) + 1; // دور از کمی داخل ابتدای اولین قطعه شروع می‌شود تا هستهٔ خط از ابتدای مسیر بریده نشود
  const cycle = (travel) => `${((travel * (SWEEP_LAP / 100)) / SWEEP_MOVE).toFixed(3)}s`;
  const sweepVars = (() => {
    if (!focus) return { "--s": idleStart, "--e": 100 + SWEEP_TAIL, "--d": cycle(100 + SWEEP_TAIL - idleStart), "--w": "1.8s" };
    const travel = Math.max(focus.dash + 4 + SWEEP_TAIL, (SWEEP_MIN_CYCLE * SWEEP_MOVE * 100) / SWEEP_LAP);
    return { "--s": focus.from - 2, "--e": focus.from - 2 + travel, "--d": cycle(travel), "--w": "0s" };
  })();
  const showSweep = arrived && (!hot || focus);
  const dashes = ({ dash }) => (arrived ? `${dash.toFixed(2)} ${(100 - dash).toFixed(2)}` : "0 100");
  const pct = (id) => Math.round(((statuses[id] || 0) / total) * 100);

  return (
    <div ref={ref} data-in={shown ? "" : undefined} className="sdn flex flex-col items-center gap-5 sm:flex-row sm:justify-center lg:flex-col">
      <div className={`sdn-ring ${focus ? "dim" : ""}`}>
        <svg viewBox="0 0 42 42" role="img" aria-label={`وضعیت ${fa(total)} سفارش`}>
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="-4" y="-4" width="50" height="50">
              {segs
                .filter((s) => !focus || focus.id === s.id)
                .map((s) => (
                  <circle key={s.id} className="sdn-mk" cx="21" cy="21" r="15.9155" style={{ strokeWidth: focus ? 6.6 : 5.2, strokeDashoffset: s.off.toFixed(2), strokeDasharray: dashes(s) }} />
                ))}
            </mask>
          </defs>
          <circle className="sdn-trk" cx="21" cy="21" r="15.9155" />
          {segs.map((s) => (
            <circle
              key={s.id}
              className={`sdn-seg ${hot === s.id ? "hot" : ""}`}
              cx="21"
              cy="21"
              r="15.9155"
              style={{ stroke: s.color, strokeDashoffset: s.off.toFixed(2), strokeDasharray: dashes(s) }}
              onPointerEnter={() => setHot(s.id)}
              onPointerLeave={() => setHot(null)}
            />
          ))}
          {showSweep && (
            <g key={focus ? focus.id : "all"} mask={`url(#${maskId})`} style={sweepVars}>
              <circle className="sdn-sw tail" cx="21" cy="21" r="15.9155" />
              <circle className="sdn-sw mid" cx="21" cy="21" r="15.9155" />
              <circle className="sdn-sw core" cx="21" cy="21" r="15.9155" />
            </g>
          )}
        </svg>
        <div className="sdn-mid">
          <b>{fa(Math.round(counted))}</b>
          <span>سفارش</span>
        </div>
      </div>

      {/* لفاف لجند container است (donut.css): وقتی عرضش برای دو ستون کافی باشد ردیف‌ها دوتا‌دوتا کنار هم می‌نشینند تا ارتفاع کم شود؛ در عرض کم همان یک ستون همیشگی */}
      <div className="sdn-leg w-full max-w-xs lg:max-w-none">
      <ul className="bar-list w-full space-y-1" aria-label="وضعیت سفارش‌ها">
        {META.map((m, i) => {
          const Icon = m.icon;
          const count = statuses[m.id] || 0;
          return (
            <li
              key={m.id}
              tabIndex={0}
              className={`bar-row rounded-xl px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${hot === m.id ? "bg-gray-100" : "hover:bg-gray-50"}`}
              onPointerEnter={() => setHot(m.id)}
              onPointerLeave={() => setHot(null)}
              onFocus={() => setHot(m.id)}
              onBlur={() => setHot(null)}
            >
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="beat-dot h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: m.color }} />
                <Icon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
                <span className="flex-1 text-gray-700">{m.label}</span>
                <span className="font-bold text-gray-900">{fa(count)}</span>
              </div>
              <ValueBar className="mt-1.5" value={pct(m.id)} color={m.color} plain shine delay={i * 110} label={`سهم ${m.label} از کل سفارش‌ها`} />
            </li>
          );
        })}
      </ul>
      </div>
    </div>
  );
}
