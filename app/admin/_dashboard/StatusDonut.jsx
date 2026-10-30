"use client";

import { useState } from "react";
import { ChartPie, Hourglass, PackageCheck, Truck, Undo2 } from "lucide-react";
import { Empty } from "./Panel";
import { fa } from "./format";

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

export default function StatusDonut({ statuses }) {
  const [active, setActive] = useState(null);
  const total = META.reduce((sum, m) => sum + (statuses[m.id] || 0), 0);

  if (total === 0) {
    return <Empty icon={ChartPie}>در این بازه سفارشی ثبت نشده است.</Empty>;
  }

  const segments = META.filter((m) => statuses[m.id] > 0);
  const C = 2 * Math.PI * R;
  let offset = 0;
  const arcs = segments.map((m) => {
    const len = (statuses[m.id] / total) * C;
    const gap = segments.length > 1 ? GAP : 0;
    const arc = { ...m, dash: Math.max(0, len - gap), offset: offset + gap / 2 };
    offset += len;
    return arc;
  });

  const current = active ? META.find((m) => m.id === active) : null;
  const pct = (id) => Math.round(((statuses[id] || 0) / total) * 100);

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center lg:flex-col">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`وضعیت ${fa(total)} سفارش`}>
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
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
                opacity={active && active !== a.id ? 0.45 : 1}
                onPointerEnter={() => setActive(a.id)}
                onPointerLeave={() => setActive(null)}
              />
            ))}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="text-3xl font-extrabold leading-none text-gray-900">{fa(current ? statuses[current.id] : total)}</span>
          <span className="mt-1.5 text-xs text-gray-500">{current ? `${current.label} (${fa(pct(current.id))}٪)` : "سفارش"}</span>
        </div>
      </div>

      <ul className="w-full max-w-xs space-y-1" aria-label="وضعیت سفارش‌ها">
        {META.map((m) => {
          const Icon = m.icon;
          const count = statuses[m.id] || 0;
          return (
            <li
              key={m.id}
              tabIndex={0}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 ${active === m.id ? "bg-gray-100" : ""}`}
              onPointerEnter={() => setActive(m.id)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(m.id)}
              onBlur={() => setActive(null)}
            >
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: m.color }} />
              <Icon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
              <span className="flex-1 text-gray-700">{m.label}</span>
              <span className="font-bold text-gray-900">{fa(count)}</span>
              <span className="w-9 text-end text-xs text-gray-500">{fa(pct(m.id))}٪</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
