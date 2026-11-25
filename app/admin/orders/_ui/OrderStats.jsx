"use client";

import { useMemo } from "react";
import { PackageCheck, Truck, Undo2 } from "lucide-react";
import Chip from "@/app/admin/_list/Chip";
import ValueBar from "@/app/admin/_ui/ValueBar";
import { useCountUp } from "@/app/admin/_ui/useCountUp";
import { agoText, daysAgo, fa } from "./format";

const TILE = "admin-row-in flex min-h-[5.5rem] items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200/80 transition-shadow hover:shadow-md";
const ICON = "grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1";
// روی پنجرهٔ خیلی کوتاه (۴۳٫۷۵rem = ۷۰۰ پیکسل یا کمتر) نوار پنهان می‌شود تا جای فهرست را نخورد
const ROW = "mb-3 grid shrink-0 gap-3 @3xl:grid-cols-3 [@media(max-height:43.75rem)]:hidden";

const sum = (list) => list.reduce((total, o) => total + (Number(o.totalPrice) || 0), 0);

// نوار آمار بالای صفحهٔ سفارش‌ها: سه کاشی از داده‌های واقعی همین فهرست (نه تخمین و مستقل از جست‌وجو): سفارش‌های جاری با ارزششان و قدیمی‌ترینشان، مبلغ تحویل‌شده‌ها،
// و نرخ مرجوعی (مرجوع از سفارش‌های نهایی‌شده = تحویل‌شده + مرجوع). عددها هنگام ورود می‌شمارند و با تغییر وضعیت از مقدار فعلی به مقدار تازه می‌روند
export default function OrderStats({ orders, loading }) {
  const stats = useMemo(() => {
    const open = orders.filter((o) => o.status === "processing");
    const done = orders.filter((o) => o.status === "delivered");
    const back = orders.filter((o) => o.status === "returned").length;
    const closed = done.length + back;
    return {
      open: open.length,
      openSum: sum(open),
      oldest: open.reduce((max, o) => Math.max(max, daysAgo(o.createdAt)), 0),
      done: done.length,
      doneSum: sum(done),
      back,
      closed,
      rate: closed ? Math.round((back / closed) * 100) : 0,
    };
  }, [orders]);

  const open = useCountUp(stats.open, { run: !loading, duration: 800, delay: 150 });
  const doneSum = useCountUp(stats.doneSum, { run: !loading, duration: 1100, delay: 220 });

  if (loading) {
    return (
      <div className={ROW} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="min-h-[5.5rem] animate-pulse rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200/80">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gray-200" />
              <div className="space-y-2">
                <div className="h-3 w-24 rounded-full bg-gray-100" />
                <div className="h-6 w-28 rounded-full bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section aria-label="آمار سفارش‌ها" className={ROW}>
      <div className={TILE}>
        <span className={`${ICON} bg-blue-50 text-blue-600 ring-blue-200`}>
          <Truck className="h-6 w-6 -scale-x-100" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-gray-500">در انتظار تحویل</p>
          <p className="flex flex-wrap items-baseline gap-x-2 leading-8">
            <span className="text-3xl font-extrabold tabular-nums text-gray-900">{fa(Math.round(open))}</span>
            <span className="text-xs text-gray-400">سفارش</span>
            {stats.open > 0 && <Chip tone={stats.oldest >= 4 ? "red" : stats.oldest >= 2 ? "amber" : "gray"}>قدیمی‌ترین: {agoText(stats.oldest)}</Chip>}
          </p>
          <p className="text-[11px] leading-5 text-gray-400">{stats.open ? `به ارزش ${fa(stats.openSum)} تومان` : "سفارشی منتظر تحویل نیست"}</p>
        </div>
      </div>

      <div className={TILE} style={{ animationDelay: "70ms" }}>
        <span className={`${ICON} bg-emerald-50 text-emerald-600 ring-emerald-200`}>
          <PackageCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-gray-500">مبلغ سفارش‌های تحویل‌داده‌شده</p>
          <p className="flex flex-wrap items-baseline gap-x-1.5 leading-8">
            <span className="text-2xl font-extrabold tabular-nums text-gray-900">{fa(Math.round(doneSum))}</span>
            <span className="text-xs text-gray-400">تومان</span>
          </p>
          <p className="text-[11px] leading-5 text-gray-400">{stats.done ? `از ${fa(stats.done)} سفارش تحویل‌داده‌شده` : "هنوز سفارشی تحویل داده نشده"}</p>
        </div>
      </div>

      <div className={TILE} style={{ animationDelay: "140ms" }}>
        <span className={`${ICON} bg-red-50 text-red-600 ring-red-200`}>
          <Undo2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-gray-500">نرخ مرجوعی</p>
          {/* همان نوار کارت‌های «وضعیت سفارش‌ها» داشبورد: بی‌هاشور (plain)، با همان رنگ مرجوع و برق دوره‌ای هم‌زمان (shine) */}
          {stats.closed > 0 ? (
            <ValueBar value={stats.rate} color="var(--viz-st-returned)" plain shine delay={300} label="درصد سفارش‌های مرجوع‌شده از سفارش‌های نهایی‌شده" className="mt-1.5" />
          ) : (
            <ValueBar value={0} text="—" color="var(--viz-st-returned)" plain label="درصد سفارش‌های مرجوع‌شده از سفارش‌های نهایی‌شده" className="mt-1.5" />
          )}
          <p className="mt-1.5 text-[11px] leading-5 text-gray-400">{stats.closed ? `${fa(stats.back)} از ${fa(stats.closed)} سفارش نهایی‌شده مرجوع شده` : "هنوز سفارشی نهایی نشده"}</p>
        </div>
      </div>
    </section>
  );
}
