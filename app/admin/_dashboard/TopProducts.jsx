"use client";

import { Trophy } from "lucide-react";
import { Empty } from "./Panel";
import { fa } from "./format";

// پرفروش‌ترین کالاها: میلهٔ افقی با یک رنگ برای همهٔ میله‌ها (کالاها ترتیب طبیعی ندارند، پس رنگ شیب‌دار نمی‌دهیم)، عدد در نوک میله.
// میله از خط پایهٔ سمت راست رشد می‌کند و سر آزادش (چپ) ۴px گرد است. نام کامل و مبلغ فروش با موس یا فوکوس هم در tooltip می‌آید
export default function TopProducts({ items }) {
  if (!items.length) {
    return <Empty icon={Trophy} className="h-40">در این بازه فروشی ثبت نشده است.</Empty>;
  }
  const max = Math.max(...items.map((p) => p.quantity));

  return (
    <ol className="space-y-3.5">
      {items.map((p, i) => {
        const width = Math.max(3, (p.quantity / max) * 78);
        return (
          <li key={p.id ?? `${p.name}-${i}`} className="group relative" style={{ "--i": i }}>
            <div tabIndex={0} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate text-sm text-gray-800">
                  <span className="text-gray-400">{fa(i + 1)}.</span> {p.name}
                </p>
                <p className="shrink-0 text-xs text-gray-500">{fa(Math.round(p.revenue))} تومان</p>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="dash-bar h-2.5 rounded-e-[4px] transition-[filter] group-hover:brightness-110 group-focus-within:brightness-110" style={{ width: `${width}%`, background: "var(--viz-series)" }} />
                <span className="text-xs font-bold text-gray-900">{fa(p.quantity)} عدد</span>
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
        );
      })}
    </ol>
  );
}
