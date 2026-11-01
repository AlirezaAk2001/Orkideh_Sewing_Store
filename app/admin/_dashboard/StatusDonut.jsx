"use client";

import { useState } from "react";
import { ChartPie, Hourglass, PackageCheck, Truck, Undo2 } from "lucide-react";
import { Empty } from "./Panel";
import { fa } from "./format";
import ValueBar from "@/app/admin/_ui/ValueBar";
import { useReveal } from "@/app/admin/_ui/useReveal";
import { useCountUp } from "@/app/admin/_ui/useCountUp";

// ترتیب حلقه: سبز، آبی، قرمز، خاکستری؛ سبز و قرمز کنار هم نمی‌افتند (برای کم‌بینایی رنگ). برچسب‌ها همان برچسب صفحهٔ سفارش‌هاست
const META = [
  { id: "delivered", label: "تحویل شده", color: "var(--viz-st-delivered)", icon: PackageCheck },
  { id: "processing", label: "جاری", color: "var(--viz-st-processing)", icon: Truck },
  { id: "returned", label: "مرجوع شده", color: "var(--viz-st-returned)", icon: Undo2 },
  { id: "pending", label: "منتظر پرداخت", color: "var(--viz-st-pending)", icon: Hourglass },
];

const SIZE = 176;
const R = 68;
const STROKE = 18;
const GAP = 2; // شکاف هم‌رنگ سطح بین قطعه‌ها، به‌جای حاشیه دور هر قطعه
const SWEEP_MS = 1100; // کشیده‌شدن کل حلقه؛ قطعه‌ها پشت سر هم و به نسبت طولشان

// حلقهٔ وضعیت سفارش‌ها با حرکت ورود (قطعه‌ها یکی‌یکی دور حلقه کشیده می‌شوند و عدد وسط می‌شمارد) و لجند با نوار درصد: هر وضعیت یک نوار هم‌رنگ خودش دارد که
// به اندازهٔ سهم آن از کل پر می‌شود و درصد وسطش است. موس یا فوکوس روی قطعه یا ردیف، همان وضعیت را در وسط حلقه می‌نویسد و بقیه را کم‌رنگ می‌کند
export default function StatusDonut({ statuses }) {
  const [active, setActive] = useState(null);
  const [ref, shown] = useReveal();
  const total = META.reduce((sum, m) => sum + (statuses[m.id] || 0), 0);
  const counted = useCountUp(total, { run: shown, duration: SWEEP_MS });

  if (total === 0) {
    return <Empty icon={ChartPie}>در این بازه سفارشی ثبت نشده است.</Empty>;
  }

  const segments = META.filter((m) => statuses[m.id] > 0);
  const C = 2 * Math.PI * R;
  let offset = 0;
  const arcs = segments.map((m) => {
    const len = (statuses[m.id] / total) * C;
    const gap = segments.length > 1 ? GAP : 0;
    const arc = { ...m, dash: Math.max(0, len - gap), offset: offset + gap / 2, start: offset / C, span: len / C };
    offset += len;
    return arc;
  });

  const current = active ? META.find((m) => m.id === active) : null;
  const pct = (id) => Math.round(((statuses[id] || 0) / total) * 100);

  return (
    <div ref={ref} data-in={shown ? "" : undefined} className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center lg:flex-col">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`وضعیت ${fa(total)} سفارش`}>
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            <path
              d={`M ${SIZE / 2 - R} ${SIZE / 2} a ${R} ${R} 0 1 0 ${2 * R} 0 a ${R} ${R} 0 1 0 ${-2 * R} 0`}
              fill="none"
              stroke="#f1f0ee"
              strokeWidth={STROKE}
            />
            {arcs.map((a) => (
              <circle
                key={a.id}
                className="dash-seg"
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={a.color}
                strokeWidth={active === a.id ? STROKE + 4 : STROKE}
                strokeDasharray={`${a.dash} ${C - a.dash}`}
                strokeDashoffset={-a.offset}
                opacity={active && active !== a.id ? 0.4 : 1}
                style={{
                  "--circ": C,
                  "--len": a.dash,
                  "--rest": C - a.dash,
                  "--dur": `${Math.round(a.span * SWEEP_MS)}ms`,
                  "--delay": `${Math.round(a.start * SWEEP_MS)}ms`,
                  filter: active === a.id ? `drop-shadow(0 0 5px ${a.color})` : undefined,
                }}
                onPointerEnter={() => setActive(a.id)}
                onPointerLeave={() => setActive(null)}
              />
            ))}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-[27px] grid place-content-center rounded-full bg-gradient-to-b from-gray-50 to-white text-center shadow-[inset_0_2px_6px_rgb(0_0_0/0.06)]">
          <span className="text-3xl font-extrabold leading-none tabular-nums text-gray-900">{fa(current ? statuses[current.id] : Math.round(counted))}</span>
          <span className="mt-1.5 text-xs text-gray-500">{current ? `${current.label} (${fa(pct(current.id))}٪)` : "سفارش"}</span>
        </div>
      </div>

      <ul className="bar-list w-full max-w-xs space-y-1" aria-label="وضعیت سفارش‌ها">
        {META.map((m, i) => {
          const Icon = m.icon;
          const count = statuses[m.id] || 0;
          return (
            <li
              key={m.id}
              tabIndex={0}
              className={`bar-row rounded-xl px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${active === m.id ? "bg-gray-100" : "hover:bg-gray-50"}`}
              onPointerEnter={() => setActive(m.id)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(m.id)}
              onBlur={() => setActive(null)}
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
  );
}
