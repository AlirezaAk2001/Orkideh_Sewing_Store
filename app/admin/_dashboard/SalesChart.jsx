"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarCheck, ChartLine, ChartNoAxesColumn, Crown, Sigma, Table2, TrendingUp } from "lucide-react";
import { Empty } from "./Panel";
import { compactText, dayLong, dayShort, fa, niceScale, rtl } from "./format";
import { useReveal } from "@/app/admin/_ui/useReveal";
import { useSegmentSlide } from "@/app/admin/_ui/useSegmentSlide";

// نمودار فروش روزانه (یک سری → منحنی نرم + ناحیهٔ شیب‌دار به رنگ برند، بدون legend چون عنوان پنل همین را می‌گوید).
// صفحه راست‌به‌چپ است، پس زمان هم راست‌به‌چپ می‌رود: قدیمی‌ترین روز سمت راست و امروز سمت چپ، و محور عمودی کنار راست.
// بالای نمودار نوار خلاصه (مجموع، میانگین روزانه که خط‌چین آن هم روی نمودار است، و بهترین روز) و روی نمودار نشانگر اوج با حلقهٔ ضربان‌دار است.
// هر مقدار از سه راه در دسترس است: tooltip با موس/لمس (با تغییر نسبت به روز قبل)، همان tooltip با کلیدهای جهت‌دار، و نمای جدول با نوار داده.
// حرکت (کشیده‌شدن خط، باز شدن ناحیه) وقتی شروع می‌شود که نمودار به صفحه برسد. ارتفاع: روی صفحهٔ پهن کمی بلندتر (هم‌قد پنل کناری)، روی گوشی کوتاه‌تر
const H_WIDE = 364;
const H_NARROW = 240;
const PAD = { top: 18, right: 54, bottom: 30, left: 10 };
const TIP_W = 192;
const TIP_H = 112;

// منحنی یکنوای مکعبی (Fritsch–Carlson): بدون فرو رفتن زیر صفر یا بالاتر از اوج واقعی. نقطه‌ها به ترتیب رسم‌شدن‌اند (x یکنوا، اینجا نزولی)
function smoothPath(pts) {
  const n = pts.length;
  const f = (v) => v.toFixed(1);
  if (n < 2) return `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const dx = [];
  const m = [];
  for (let k = 0; k < n - 1; k++) {
    dx[k] = pts[k + 1][0] - pts[k][0];
    m[k] = (pts[k + 1][1] - pts[k][1]) / dx[k];
  }
  const t = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let k = 1; k < n - 1; k++) t[k] = m[k - 1] * m[k] <= 0 ? 0 : (m[k - 1] + m[k]) / 2;
  for (let k = 0; k < n - 1; k++) {
    if (m[k] === 0) {
      t[k] = 0;
      t[k + 1] = 0;
      continue;
    }
    const a = t[k] / m[k];
    const b = t[k + 1] / m[k];
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      t[k] = tau * a * m[k];
      t[k + 1] = tau * b * m[k];
    }
  }
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let k = 0; k < n - 1; k++) {
    const [x0, y0] = pts[k];
    const [x1, y1] = pts[k + 1];
    d += ` C${f(x0 + dx[k] / 3)} ${f(y0 + (t[k] * dx[k]) / 3)} ${f(x1 - dx[k] / 3)} ${f(y1 - (t[k + 1] * dx[k]) / 3)} ${f(x1)} ${f(y1)}`;
  }
  return d;
}

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
  const ref = useSegmentSlide(view);
  const base = "seg-tab inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";
  return (
    <div ref={ref} className="seg inline-flex gap-1 rounded-lg bg-gray-100 p-0.5" role="group" aria-label="نوع نمایش">
      {[
        { id: "chart", label: "نمودار", icon: ChartLine },
        { id: "table", label: "جدول", icon: Table2 },
      ].map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === id}
          data-on={view === id ? "" : undefined}
          aria-label={label}
          onClick={() => setView(id)}
          className={`${base} ${view === id ? "text-gray-900" : "text-gray-500 hover:bg-white/60 hover:text-gray-800"}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

// سه عدد مهم دوره، بالای نمودار: مجموع، میانگین هر روز (با نمونهٔ خط‌چین همان خط روی نمودار) و بهترین روز
function SummaryStrip({ stats, daily }) {
  const best = stats.peak >= 0 ? daily[stats.peak] : null;
  const item = "flex min-w-0 items-center gap-3 rounded-xl bg-gradient-to-l from-gray-50 to-white px-3 py-2.5 ring-1 ring-gray-100";
  const badge = "grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1";
  return (
    <ul className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label="خلاصهٔ فروش دوره">
      <li className={item}>
        <span className={`${badge} bg-brand-50 text-brand-600 ring-brand-100`}>
          <Sigma className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-xs text-gray-500">مجموع فروش</span>
          <span className="block truncate text-sm font-extrabold text-gray-900">
            {fa(Math.round(stats.total))} <span className="text-xs font-medium text-gray-500">تومان</span>
          </span>
        </span>
      </li>
      <li className={item}>
        <span className={`${badge} bg-violet-50 text-violet-600 ring-violet-100`}>
          <TrendingUp className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            میانگین هر روز
            <svg width="18" height="4" viewBox="0 0 18 4" aria-hidden="true">
              <line x1="0" x2="18" y1="2" y2="2" stroke="var(--viz-ink-3)" strokeWidth="1.5" strokeDasharray="4 3" />
            </svg>
          </span>
          <span className="block truncate text-sm font-extrabold text-gray-900">
            {fa(Math.round(stats.avg))} <span className="text-xs font-medium text-gray-500">تومان</span>
          </span>
        </span>
      </li>
      <li className={item}>
        <span className={`${badge} bg-amber-50 text-amber-600 ring-amber-100`}>
          <Crown className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-xs text-gray-500">بهترین روز{best ? `: ${dayShort(best.date)}` : ""}</span>
          <span className="block truncate text-sm font-extrabold text-gray-900">
            {fa(Math.round(stats.max))} <span className="text-xs font-medium text-gray-500">تومان</span>
          </span>
        </span>
      </li>
    </ul>
  );
}

// نمای جدول: هر روز یک ردیف؛ زیر عدد فروش یک نوار داده (به نسبت بهترین روز) که با دیده‌شدن جدول از راست باز می‌شود، و بهترین روز تاج دارد
function SalesTable({ daily, stats }) {
  return (
    <div className="max-h-[19rem] overflow-auto rounded-xl ring-1 ring-gray-200">
      <table className="w-full text-sm">
        <caption className="sr-only">فروش و تعداد سفارش پرداخت‌شدهٔ هر روز</caption>
        <thead className="sticky top-0 z-10 bg-gradient-to-b from-gray-50 to-gray-100/80 text-xs text-gray-500 backdrop-blur">
          <tr>
            <th scope="col" className="w-[34%] px-3 py-2.5 text-start font-semibold">تاریخ</th>
            <th scope="col" className="w-[46%] px-3 py-2.5 text-start font-semibold">فروش (تومان)</th>
            <th scope="col" className="px-3 py-2.5 text-start font-semibold">سفارش</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-gray-800">
          {[...daily].reverse().map((d, i) => {
            const share = stats.max > 0 ? (d.revenue / stats.max) * 100 : 0;
            const best = stats.peak >= 0 && d.date === daily[stats.peak].date;
            return (
              <tr key={d.date} className="transition-colors hover:bg-brand-50/50">
                <th scope="row" className="whitespace-nowrap px-3 py-2 text-start font-normal text-gray-600">
                  <span className="inline-flex items-center gap-1.5">
                    {dayLong(d.date)}
                    {best && <Crown className="h-3.5 w-3.5 text-amber-500" aria-label="بهترین روز" />}
                  </span>
                </th>
                <td className="relative px-3 py-2 tabular-nums">
                  <span
                    aria-hidden="true"
                    className="tbl-bar absolute inset-y-1.5 start-1.5 rounded-md bg-gradient-to-l from-brand-200/80 to-brand-50"
                    style={{ width: `calc((100% - 0.75rem) * ${share / 100})`, "--i": Math.min(i, 14) }}
                  />
                  <span className="relative font-semibold">{fa(d.revenue)}</span>
                </td>
                <td className="px-3 py-2 tabular-nums">
                  <span className="inline-flex min-w-7 justify-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">{fa(d.orders)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function SalesChart({ daily, view }) {
  const [wrapRef, width] = useWidth();
  const [revealRef, shown] = useReveal();
  const H = width < 480 ? H_NARROW : H_WIDE;
  const [active, setActive] = useState(null);
  const svgRef = useRef(null);
  const descId = useId();
  const gid = `sc${useId().replace(/:/g, "")}`;

  const n = daily.length;
  const stats = useMemo(() => {
    const revenues = daily.map((d) => d.revenue);
    const max = Math.max(0, ...revenues);
    const total = revenues.reduce((a, b) => a + b, 0);
    const orders = daily.reduce((a, d) => a + d.orders, 0);
    return { max, total, orders, avg: n ? total / n : 0, peak: max > 0 ? revenues.indexOf(max) : -1, scale: niceScale(max) };
  }, [daily, n]);

  if (stats.total === 0) {
    return (
      <div ref={wrapRef}>
        <Empty icon={ChartNoAxesColumn}>در این بازه فروشی ثبت نشده است.</Empty>
      </div>
    );
  }

  if (view === "table") {
    return (
      <div ref={wrapRef}>
        <SummaryStrip stats={stats} daily={daily} />
        <div ref={revealRef} data-in={shown ? "" : undefined}>
          <SalesTable daily={daily} stats={stats} />
        </div>
      </div>
    );
  }

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;
  const stepX = n > 1 ? plotW / (n - 1) : 0;
  const x = (i) => PAD.left + plotW - i * stepX;
  const y = (v) => PAD.top + plotH - (v / stats.scale.max) * plotH;
  const ticks = Array.from({ length: Math.round(stats.scale.max / stats.scale.step) + 1 }, (_, k) => k * stats.scale.step);
  const line = smoothPath(daily.map((d, i) => [x(i), y(d.revenue)]));
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
  // تغییر نسبت به روز قبل از آن (قدیمی‌تر = اندیس بعدی)؛ بدون روز قبل یا با فروش صفر روز قبل، درصدی معنی ندارد
  const prev = active !== null && active + 1 < n ? daily[active + 1] : null;
  const dayChange = a && prev && prev.revenue > 0 ? Math.round(((a.revenue - prev.revenue) / prev.revenue) * 100) : null;
  const tipX = a ? Math.min(width - TIP_W / 2, Math.max(TIP_W / 2, x(active))) : 0;
  // tooltip بالای نقطه می‌نشیند و اگر جا نبود زیر آن، تا خط را نپوشاند
  const tipTop = a ? (y(a.revenue) - TIP_H - 14 < 0 ? y(a.revenue) + 16 : y(a.revenue) - TIP_H - 14) : 0;

  const peakX = stats.peak >= 0 ? x(stats.peak) : 0;
  const peakY = stats.peak >= 0 ? y(stats.max) : 0;
  const peakText = fa(Math.round(stats.max)); // مبلغ کامل با جداکننده، مثل بقیهٔ پنل (نه «۵۳٫۵ میلیون»)
  const pillW = Math.max(40, peakText.length * 7.6 + 22);
  const pillX = Math.min(PAD.left + plotW - pillW / 2, Math.max(PAD.left + pillW / 2, peakX));
  const pillY = peakY - 34 < 0 ? peakY + 12 : peakY - 34;

  return (
    <div ref={wrapRef}>
      <SummaryStrip stats={stats} daily={daily} />
      <div
        ref={revealRef}
        data-in={shown ? "" : undefined}
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
            <defs>
              <linearGradient id={`${gid}a`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--viz-series)" stopOpacity="0.32" />
                <stop offset="0.65" stopColor="var(--viz-series)" stopOpacity="0.08" />
                <stop offset="1" stopColor="var(--viz-series)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`${gid}b`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--viz-series)" stopOpacity="0.16" />
                <stop offset="1" stopColor="var(--viz-series)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + plotW}
                  y1={y(t)}
                  y2={y(t)}
                  stroke={t === 0 ? "var(--viz-axis)" : "var(--viz-grid)"}
                  strokeWidth="1"
                  strokeDasharray={t === 0 ? undefined : "3 5"}
                />
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

            {n > 1 && (
              <line
                x1={PAD.left}
                x2={PAD.left + plotW}
                y1={y(stats.avg)}
                y2={y(stats.avg)}
                stroke="var(--viz-ink-3)"
                strokeOpacity="0.7"
                strokeWidth="1.25"
                strokeDasharray="5 4"
              />
            )}

            <path className="dash-area" d={area} fill={`url(#${gid}a)`} />
            <path
              className="dash-line"
              d={line}
              pathLength="1"
              fill="none"
              stroke="var(--viz-series)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 4px 5px color-mix(in srgb, var(--viz-series) 38%, transparent))" }}
            />

            {stats.peak >= 0 && active !== stats.peak && (
              <g className="dash-peak" pointerEvents="none">
                <circle className="dash-ping" cx={peakX} cy={peakY} r="5" fill="var(--viz-series)" fillOpacity="0.45" />
                <circle cx={peakX} cy={peakY} r="5" fill="var(--viz-series)" stroke="var(--viz-surface)" strokeWidth="2.5" />
                <rect x={pillX - pillW / 2} y={pillY} width={pillW} height="22" rx="11" fill="var(--viz-ink)" />
                <text x={pillX} y={pillY + 11} dy="0.35em" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
                  {rtl(peakText)}
                </text>
              </g>
            )}

            {a && (
              <g pointerEvents="none">
                <rect
                  x={Math.max(PAD.left, x(active) - stepX / 2)}
                  y={PAD.top}
                  width={Math.max(2, Math.min(stepX, PAD.left + plotW - Math.max(PAD.left, x(active) - stepX / 2)))}
                  height={plotH}
                  fill={`url(#${gid}b)`}
                />
                <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={y(0)} stroke="var(--viz-ink-3)" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx={x(active)} cy={y(a.revenue)} r="9" fill="var(--viz-series)" fillOpacity="0.18" />
                <circle cx={x(active)} cy={y(a.revenue)} r="5" fill="var(--viz-series)" stroke="var(--viz-surface)" strokeWidth="2.5" />
              </g>
            )}
          </svg>
        )}

        {a && (
          <div
            className="dash-tip pointer-events-none absolute z-10 rounded-xl bg-white p-3 text-xs shadow-xl ring-1 ring-gray-200"
            style={{ width: TIP_W, left: tipX - TIP_W / 2, top: tipTop }}
            role="presentation"
          >
            <p className="flex items-center gap-1.5 font-medium text-gray-500">
              <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {dayLong(a.date)}
            </p>
            <p className="mt-2 flex items-baseline gap-1.5">
              <span aria-hidden="true" className="h-0.5 w-3 self-center rounded-full" style={{ background: "var(--viz-series)" }} />
              <span className="text-base font-extrabold tabular-nums text-gray-900">{fa(a.revenue)}</span>
              <span className="text-gray-500">تومان</span>
            </p>
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2 text-gray-500">
              <span>
                سفارش‌ها: <span className="font-semibold text-gray-800">{fa(a.orders)}</span>
              </span>
              {dayChange !== null && dayChange !== 0 && (
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold"
                  style={
                    dayChange > 0
                      ? { background: "color-mix(in srgb, var(--viz-st-delivered) 14%, white)", color: "var(--viz-good-text)" }
                      : { background: "color-mix(in srgb, var(--viz-st-returned) 12%, white)", color: "color-mix(in srgb, var(--viz-bad-text) 82%, black)" }
                  }
                >
                  {dayChange > 0 ? <ArrowUpRight className="h-3 w-3" aria-hidden="true" /> : <ArrowDownLeft className="h-3 w-3" aria-hidden="true" />}
                  {fa(Math.abs(dayChange))}٪ {dayChange > 0 ? "بیشتر" : "کمتر"}
                </span>
              )}
            </div>
            {dayChange !== null && <p className="mt-1 text-[11px] text-gray-400">نسبت به روز قبل</p>}
          </div>
        )}
      </div>
    </div>
  );
}
