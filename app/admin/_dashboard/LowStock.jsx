"use client";

import Link from "next/link";
import { CircleCheck, PackageX, TriangleAlert } from "lucide-react";
import { fa } from "./format";

// شدت: ناموجود قرمز، یک تا دو عدد نارنجی، بقیه زرد؛ هر شدت آیکون و برچسب متنی هم دارد (رنگ تنها معنی نمی‌رساند).
// نوار موجودی نسبت به آستانه پر می‌شود و ریلش (بخش خالی) همان رنگ را کم‌رنگ دارد.
// هر ردیف لینک ویرایش کالاست؛ ردیف نمونه (حالت نمونه، بدون شناسه) فقط نمایش است
function severity(stock) {
  if (stock <= 0) return { label: "ناموجود", color: "var(--viz-sev-critical)", icon: PackageX };
  if (stock <= 2) return { label: "رو به اتمام", color: "var(--viz-sev-serious)", icon: TriangleAlert };
  return { label: "کم‌موجود", color: "var(--viz-sev-warning)", icon: TriangleAlert };
}

const ROW = "-mx-2 block rounded-lg px-2 py-2.5 outline-none transition-colors";

export default function LowStock({ items, threshold }) {
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
    <ul className="divide-y divide-gray-100">
      {items.map((p, i) => {
        const sev = severity(p.stock);
        const Icon = sev.icon;
        const content = (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm text-gray-800">{p.name}</p>
              <p className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-700">
                <Icon className="h-4 w-4" style={{ color: sev.color }} aria-hidden="true" />
                {sev.label}
                <span className="font-bold text-gray-900">{p.stock > 0 ? `${fa(p.stock)} عدد` : ""}</span>
              </p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: `color-mix(in srgb, ${sev.color} 16%, white)` }} aria-hidden="true">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (p.stock / threshold) * 100)}%`, background: sev.color }} />
            </div>
          </>
        );
        return (
          <li key={p.id ?? `${p.name}-${i}`}>
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
