"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChartLine, ChartNoAxesColumn, Table2 } from "lucide-react";
import { Empty } from "./Panel";
import { compactText, dayLong, dayShort, fa, niceScale, rtl } from "./format";

// نمودار فروش روزانه (یک سری → ناحیه + خط به رنگ برند، بدون legend چون عنوان پنل همین را می‌گوید).
// صفحه راست‌به‌چپ است، پس زمان هم راست‌به‌چپ می‌رود: قدیمی‌ترین روز سمت راست و امروز سمت چپ، و محور عمودی کنار راست.
// هر مقدار از سه راه در دسترس است: tooltip با موس/لمس، همان tooltip با کلیدهای جهت‌دار، و نمای جدول.
// ارتفاع نمودار: روی صفحهٔ پهن کمی بلندتر (هم‌قد پنل کناری)، روی گوشی کوتاه‌تر
const H_WIDE = 320;
const H_NARROW = 240;
const PAD = { top: 18, right: 54, bottom: 30, left: 10 };
const TIP_W = 176;
const TIP_H = 78;

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(Math.round(el.clientWidth));
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

export function ViewToggle({ view, setView }) {
  const base = "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";
  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-0.5" role="group" aria-label="نوع نمایش">
      {[
        { id: "chart", label: "نمودار", icon: ChartLine },
        { id: "table", label: "جدول", icon: Table2 },
      ].map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === id}
          aria-label={label}
          onClick={() => setView(id)}
          className={`${base} ${view === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

export default function SalesChart({ daily, view }) {
  const [wrapRef, width] = useWidth();
  const H = width < 480 ? H_NARROW : H_WIDE;
  const [active, setActive] = useState(null);
  const svgRef = useRef(null);
  const descId = useId();

  const n = daily.length;
  const stats = useMemo(() => {
    const revenues = daily.map((d) => d.revenue);
    const max = Math.max(0, ...revenues);
    const total = revenues.reduce((a, b) => a + b, 0);
    const orders = daily.reduce((a, d) => a + d.orders, 0);
    return { max, total, orders, peak: max > 0 ? revenues.indexOf(max) : -1, scale: niceScale(max) };
  }, [daily]);

  if (stats.total === 0) {
    return (
      <div ref={wrapRef}>
        <Empty icon={ChartNoAxesColumn}>در این بازه فروشی ثبت نشده است.</Empty>
      </div>
    );
  }

  if (view === "table") {
    return (
      <div ref={wrapRef} className="max-h-[17rem] overflow-auto rounded-lg ring-1 ring-gray-200">
        <table className="w-full text-sm">
          <caption className="sr-only">فروش و تعداد سفارش پرداخت‌شدهٔ هر روز</caption>
          <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500">
            <tr>
              <th scope="col" className="px-3 py-2 text-start font-medium">تاریخ</th>
              <th scope="col" className="px-3 py-2 text-start font-medium">فروش (تومان)</th>
              <th scope="col" className="px-3 py-2 text-start font-medium">سفارش</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-800">
            {[...daily].reverse().map((d) => (
              <tr key={d.date}>
                <th scope="row" className="px-3 py-1.5 text-start font-normal text-gray-600">{dayLong(d.date)}</th>
                <td className="px-3 py-1.5 tabular-nums">{fa(d.revenue)}</td>
                <td className="px-3 py-1.5 tabular-nums">{fa(d.orders)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;
  const stepX = n > 1 ? plotW / (n - 1) : 0;
  const x = (i) => PAD.left + plotW - i * stepX;
  const y = (v) => PAD.top + plotH - (v / stats.scale.max) * plotH;
  const ticks = Array.from({ length: Math.round(stats.scale.max / stats.scale.step) + 1 }, (_, k) => k * stats.scale.step);
  const line = daily.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(d.revenue).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)} ${y(0).toFixed(1)} L${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`;

  const every = Math.max(1, Math.round((n - 1) / 5));
  const labelIdx = [];
  for (let i = n - 1; i >= 0; i -= every) labelIdx.push(i); // امروز همیشه برچسب دارد؛ بقیه به فاصلهٔ ثابت

  const at = (clientX) => {
    const rect = svgRef.current.getBoundingClientRect();
    const i = Math.round((PAD.left + plotW - (clientX - rect.left)) / (stepX || 1));
    return Math.min(n - 1, Math.max(0, i));
  };

  const onKeyDown = (e) => {
    const cur = active ?? n - 1;
    // ArrowLeft به سمت امروز (چپ) می‌رود و ArrowRight به سمت روزهای قدیمی (راست)
    const next = { ArrowLeft: cur + 1, ArrowRight: cur - 1, Home: 0, End: n - 1 }[e.key];
    if (e.key === "Escape") return setActive(null);
    if (next === undefined) return;
    e.preventDefault();
    setActive(Math.min(n - 1, Math.max(0, next)));
  };

  const a = active === null ? null : daily[active];
  const tipX = a ? Math.min(width - TIP_W / 2, Math.max(TIP_W / 2, x(active))) : 0;
  // tooltip بالای نقطه می‌نشیند و اگر جا نبود زیر آن، تا خط را نپوشاند
  const tipTop = a ? (y(a.revenue) - TIP_H - 12 < 0 ? y(a.revenue) + 14 : y(a.revenue) - TIP_H - 12) : 0;

  return (
    <div ref={wrapRef}>
    <div
      className="relative rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      tabIndex={0}
      role="group"
      aria-label={`نمودار فروش روزانه؛ با کلیدهای چپ و راست روی روزها بروید`}
      aria-describedby={descId}
      onKeyDown={onKeyDown}
      onFocus={() => setActive((v) => v ?? n - 1)}
      onBlur={() => setActive(null)}
    >
      <span id={descId} className="sr-only" aria-live="polite">
        {a ? `${dayLong(a.date)}: ${fa(a.revenue)} تومان فروش، ${fa(a.orders)} سفارش` : `مجموع ${fa(stats.total)} تومان در ${fa(stats.orders)} سفارش`}
      </span>
      {width > 0 && (
        <svg
          ref={svgRef}
          width={width}
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          style={{ direction: "ltr", display: "block", touchAction: "pan-y" }}
          aria-hidden="true"
          onPointerMove={(e) => setActive(at(e.clientX))}
          onPointerDown={(e) => setActive(at(e.clientX))}
          onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={PAD.left + plotW} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--viz-axis)" : "var(--viz-grid)"} strokeWidth="1" />
              <text x={PAD.left + plotW + 8} y={y(t)} dy="0.32em" fontSize="11" fill="var(--viz-ink-3)">{t === 0 ? fa(0) : rtl(compactText(t))}</text>
            </g>
          ))}
          {labelIdx.map((i) => {
            const px = x(i);
            const anchor = px < 34 ? "start" : px > PAD.left + plotW - 34 ? "end" : "middle";
            return (
              <text key={i} x={px} y={H - 8} textAnchor={anchor} fontSize="11" fill="var(--viz-ink-3)">{rtl(dayShort(daily[i].date))}</text>
            );
          })}

          <path className="dash-area" d={area} fill="var(--viz-series)" fillOpacity="0.1" />
          <path className="dash-line" d={line} pathLength="1" fill="none" stroke="var(--viz-series)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {stats.peak >= 0 && active !== stats.peak && (
            <g>
              <circle cx={x(stats.peak)} cy={y(daily[stats.peak].revenue)} r="4" fill="var(--viz-series)" stroke="var(--viz-surface)" strokeWidth="2" />
              <text
                x={Math.min(PAD.left + plotW - 4, Math.max(PAD.left + 4, x(stats.peak)))}
                y={y(daily[stats.peak].revenue) - 11}
                textAnchor={x(stats.peak) < 40 ? "start" : x(stats.peak) > PAD.left + plotW - 40 ? "end" : "middle"}
                fontSize="11"
                fontWeight="600"
                fill="var(--viz-ink)"
              >
                {rtl(compactText(stats.max))}
              </text>
            </g>
          )}

          {a && (
            <g pointerEvents="none">
              <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={y(0)} stroke="var(--viz-ink-3)" strokeWidth="1" />
              <circle cx={x(active)} cy={y(a.revenue)} r="4.5" fill="var(--viz-series)" stroke="var(--viz-surface)" strokeWidth="2" />
            </g>
          )}
        </svg>
      )}

      {a && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg bg-white p-2.5 text-xs shadow-lg ring-1 ring-gray-200"
          style={{ width: TIP_W, left: tipX - TIP_W / 2, top: tipTop }}
          role="presentation"
        >
          <p className="font-medium text-gray-500">{dayLong(a.date)}</p>
          <p className="mt-1.5 flex items-center gap-1.5">
            <span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ background: "var(--viz-series)" }} />
            <span className="text-sm font-bold text-gray-900">{fa(a.revenue)}</span>
            <span className="text-gray-500">تومان</span>
          </p>
          <p className="mt-1 text-gray-500">
            سفارش‌ها: <span className="font-semibold text-gray-800">{fa(a.orders)}</span>
          </p>
        </div>
      )}
    </div>
    </div>
  );
}
