"use client";

import Link from "next/link";
import { CircleCheck, PackageX, TriangleAlert } from "lucide-react";
import { fa } from "./format";
import ValueBar from "@/app/admin/_ui/ValueBar";

// شدت: ناموجود قرمز، یک تا دو عدد نارنجی، بقیه زرد؛ هر شدت آیکون و برچسب متنی هم دارد (رنگ تنها معنی نمی‌رساند). رنگ نوار از همان شدت می‌آید، ولی
// تیره‌تر از رنگ‌های نمودار است تا عدد سفید وسط نوار خوانا بماند. نوار به نسبت آستانه پر می‌شود و عدد موجودی وسطش است («ناموجود» برای صفر).
// آیکون ناموجود با یک حلقهٔ آرام می‌زند تا از میان ردیف‌ها دیده شود. هر ردیف لینک ویرایش کالاست؛ ردیف نمونه (حالت نمونه، بدون شناسه) فقط نمایش است
function severity(stock) {
  if (stock <= 0) return { label: "ناموجود", color: "var(--viz-sev-critical)", tone: "red", icon: PackageX, pulse: true };
  if (stock <= 2) return { label: "رو به اتمام", color: "var(--viz-sev-serious)", tone: "orange", icon: TriangleAlert };
  return { label: "کم‌موجود", color: "var(--viz-sev-warning)", tone: "amber", icon: TriangleAlert };
}

const ROW = "-mx-2 block rounded-xl px-2 py-2.5 outline-none transition-colors";

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
    <ul className="bar-list divide-y divide-gray-100">
      {items.map((p, i) => {
        const sev = severity(p.stock);
        const Icon = sev.icon;
        const content = (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-medium text-gray-800">{p.name}</p>
              <p className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-700">
                <span className="relative grid place-items-center">
                  {sev.pulse && <span aria-hidden="true" className="sold-ping absolute h-4 w-4 rounded-full" style={{ background: sev.color, opacity: 0.35 }} />}
                  <Icon className="relative h-4 w-4" style={{ color: sev.color }} aria-hidden="true" />
                </span>
                {sev.label}
              </p>
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
