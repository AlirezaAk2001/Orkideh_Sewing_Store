"use client";

import Link from "next/link";
import { CircleCheck, PackageX, TriangleAlert } from "lucide-react";
import { fa } from "./format";
import ValueBar from "@/app/admin/_ui/ValueBar";
import { usePulseClock } from "@/app/admin/_ui/usePulseClock";

// شدت: ناموجود قرمز، یک تا دو عدد نارنجی، بقیه زرد؛ هر شدت آیکون و برچسب متنی هم دارد (رنگ تنها معنی نمی‌رساند). رنگ نوار از همان شدت می‌آید، ولی
// تیره‌تر از رنگ‌های نمودار است تا عدد سفید وسط نوار خوانا بماند. نوار به نسبت آستانه پر می‌شود و عدد موجودی وسطش است («ناموجود» برای صفر).
// برچسب شدت در یک چیپ هم‌رنگ شدت است (زمینهٔ کم‌رنگ، حلقهٔ نازک، آیکون و نوشتهٔ تیره‌تر از همان رنگ که خوانا بماند؛ ink درصد رنگ اصلی در نوشته است و برای زرد کمتر است
// چون زرد روشن‌تر است). چیپ «ناموجود» با یک حلقهٔ آرام که از لبه‌اش بیرون می‌رود هر چند ثانیه یک‌بار می‌زند تا از میان ردیف‌ها دیده شود (ساعت مشترک usePulseClock).
// هر ردیف لینک ویرایش کالاست؛ ردیف نمونه (حالت نمونه، بدون شناسه) فقط نمایش است
function severity(stock) {
  if (stock <= 0) return { label: "ناموجود", color: "var(--viz-sev-critical)", ink: 64, tone: "red", icon: PackageX, pulse: true };
  if (stock <= 2) return { label: "رو به اتمام", color: "var(--viz-sev-serious)", ink: 50, tone: "orange", icon: TriangleAlert };
  return { label: "کم‌موجود", color: "var(--viz-sev-warning)", ink: 44, tone: "amber", icon: TriangleAlert };
}

const chipStyle = (sev) => ({
  background: `color-mix(in srgb, ${sev.color} 13%, white)`,
  color: `color-mix(in srgb, ${sev.color} ${sev.ink}%, black)`,
  boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${sev.color} 32%, transparent)`,
  "--ripple": `color-mix(in srgb, ${sev.color} 45%, transparent)`,
});

const ROW = "-mx-2 block rounded-xl px-2 py-2.5 outline-none transition-colors";

export default function LowStock({ items, threshold }) {
  usePulseClock(items.some((p) => p.stock <= 0));
  if (!items.length) {
    return (
      <p className="flex h-40 flex-col items-center justify-center gap-3 text-sm text-gray-500">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
          <CircleCheck className="h-6 w-6" style={{ color: "var(--viz-st-delivered)" }} aria-hidden="true" />
        </span>
        موجودی همهٔ کالاها کافی است.
      </p>
    );
  }

  return (
    <ul className="bar-list divide-y divide-gray-100">
      {items.map((p, i) => {
        const sev = severity(p.stock);
        const Icon = sev.icon;
        const content = (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-medium text-gray-800">{p.name}</p>
              <span className="relative inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold leading-5" style={chipStyle(sev)}>
                {sev.pulse && <span aria-hidden="true" className="chip-ripple pointer-events-none absolute inset-0 rounded-full" />}
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {sev.label}
              </span>
            </div>
            <ValueBar
              className="mt-2"
              value={Math.min(100, (p.stock / threshold) * 100)}
              number={p.stock}
              suffix=" عدد"
              text={p.stock > 0 ? undefined : "ناموجود"}
              tone={sev.tone}
              delay={i * 80}
              shine
              label={`موجودی ${p.name}`}
            />
          </>
        );
        return (
          <li key={p.id ?? `${p.name}-${i}`} className="bar-row">
            {p.id ? (
              <Link href={`/admin/products/edit/${p.id}`} className={`${ROW} hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-500`}>
                {content}
              </Link>
            ) : (
              <div className={ROW}>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
