"use client";

import { Trophy } from "lucide-react";
import { Empty } from "./Panel";
import { fa } from "./format";
import ValueBar from "@/app/admin/_ui/ValueBar";

// پرفروش‌ترین کالاها: هر ردیف یک مدال رتبه (سه اول طلایی، نقره‌ای و برنزی، بقیه ساده)، نام و مبلغ فروش، و زیرشان نوار مقدار با عدد فروش در وسطش.
// نوار نسبت به پرفروش‌ترین کالا پر می‌شود (اولی همیشه کامل)؛ همه یک رنگ‌اند چون کالاها ترتیب طبیعی ندارند. نوارها پشت سر هم پر می‌شوند.
// نام کامل و مبلغ فروش با موس یا فوکوس هم در tooltip می‌آید
const MEDALS = [
  "bg-gradient-to-br from-amber-200 to-amber-400 text-amber-950 ring-amber-300",
  "bg-gradient-to-br from-gray-100 to-gray-300 text-gray-800 ring-gray-300",
  "bg-gradient-to-br from-orange-200 to-orange-300 text-orange-950 ring-orange-300",
];
const PLAIN_MEDAL = "bg-gray-100 text-gray-600 ring-gray-200";

export default function TopProducts({ items }) {
  if (!items.length) {
    return <Empty icon={Trophy} className="h-40">در این بازه فروشی ثبت نشده است.</Empty>;
  }
  const max = Math.max(...items.map((p) => p.quantity));

  return (
    <ol className="bar-list space-y-1.5">
      {items.map((p, i) => (
        <li key={p.id ?? `${p.name}-${i}`} className="bar-row group relative">
          <div tabIndex={0} className="flex items-center gap-3 rounded-xl p-2 outline-none transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-500">
            <span
              aria-label={`رتبه ${fa(i + 1)}`}
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold shadow-sm ring-1 transition-transform duration-300 group-hover:scale-110 ${MEDALS[i] ?? PLAIN_MEDAL}`}
            >
              {fa(i + 1)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-medium text-gray-800">{p.name}</p>
                <span className="shrink-0 whitespace-nowrap rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold leading-5 tabular-nums text-brand-700 ring-1 ring-inset ring-brand-200/70">
                  {fa(Math.round(p.revenue))} <span className="font-medium text-brand-700/80">تومان</span>
                </span>
              </div>
              <ValueBar className="mt-1.5" value={Math.max(4, (p.quantity / max) * 100)} number={p.quantity} suffix=" عدد" delay={i * 90} shine label={`تعداد فروش ${p.name}`} />
            </div>
          </div>
          <div
            role="tooltip"
            className="pointer-events-none invisible absolute bottom-full start-0 z-10 mb-1 w-56 max-w-full rounded-lg bg-white p-2.5 text-xs opacity-0 shadow-lg ring-1 ring-gray-200 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
          >
            <p className="font-semibold text-gray-900">{p.name}</p>
            <p className="mt-1 text-gray-500">
              فروش: <span className="font-bold text-gray-900">{fa(p.quantity)}</span> عدد
            </p>
            <p className="text-gray-500">
              مبلغ: <span className="font-bold text-gray-900">{fa(p.revenue)}</span> تومان
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
