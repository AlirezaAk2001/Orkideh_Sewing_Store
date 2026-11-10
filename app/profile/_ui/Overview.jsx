"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Scissors, Spool } from "lucide-react";
import Avatar from "@/app/components/Avatar";
import { useCountUp } from "@/app/admin/_ui/useCountUp";
import { compactText } from "@/app/admin/_dashboard/format";
import { scrollBehavior } from "@/lib/motion";
import { Ic } from "./icons";
import { dateFa, dayFull, fa, greeting, spendingByMonth, toman } from "./format";
import { MapBox, Pcard, ST, ST_KEYS, Stack, Thumb, countByStatus } from "./parts";

// شمارش تا مقدار با همان آهنگ طرح (۱٫۳ ثانیه)؛ با «کاهش حرکت» فوری
function Count({ to, delay = 250 }) {
  const v = useCountUp(to, { duration: 1300, delay });
  return <>{fa(Math.round(v))}</>;
}

// دو فریم بعد از نمایش true می‌شود؛ ترنزیشن‌های ورود (نخ بخیه، حلقه، نمودار) از حالت اولیه شروع شوند
function useArrived() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let b;
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setOn(true));
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, []);
  return on;
}

// کاشی قابل‌کلیک: کل کاشی به بخشش می‌رود (با morph)؛ دکمه‌ها و لینک‌های داخلش کار خودشان را می‌کنند
const tileLink = (key, label, onGo) => ({
  role: "link",
  tabIndex: 0,
  "aria-label": label,
  onClick: (e) => {
    if (e.target.closest("a,button")) return;
    onGo(key, e.currentTarget);
  },
  onKeyDown: (e) => {
    if (e.key === "Enter" && e.target === e.currentTarget) onGo(key, e.currentTarget);
  },
});

/* ───────── کاشی تیره: وضعیت سفارش (رهگیری با «نخ بخیه») ───────── */

// مراحل سفارش (pipeline). هر مرحله آیکون مخصوص خودش را دارد و آیکون «مرحلهٔ فعلی» کنار عنوان کاشی هم می‌نشیند. آماده‌سازی و ارسال دو مرحلهٔ جدا هستند.
// سفارش فقط سه وضعیت بعد از پرداخت دارد (جاری، تحویل شده، مرجوع شده)، پس سفارش جاری در «آماده‌سازی» می‌ایستد تا تحویل شود
const STAGES = [
  { label: "ثبت سفارش", icon: "clipboard" },
  { label: "پرداخت", icon: "card" },
  { label: "آماده‌سازی", icon: "box" },
  { label: "ارسال", icon: "truck" },
  { label: "تحویل به شما", icon: "postman" },
];

// cur = مرحلهٔ فعلی؛ done = همهٔ مرحله‌ها تمام شده
function flowOf(order) {
  if (order.status === "pending") return { steps: STAGES, cur: 1, done: false, nowText: "منتظر پرداخت" };
  if (order.status === "processing") return { steps: STAGES, cur: 2, done: false, nowText: "در جریان" };
  if (order.status === "delivered") return { steps: STAGES, cur: 4, done: true };
  return { steps: [...STAGES.slice(0, 4), { label: "مرجوع شد", icon: "undo" }], cur: 4, done: false, nowText: "مرجوع شد" };
}

function TrackTile({ order, onGo, onPay, paying }) {
  const arrived = useArrived();
  if (!order) {
    return (
      <article className="tile t-track rise" style={{ "--i": 1 }}>
        <div className="t-head">
          <div className="t-title">
            <span className="ib">
              <Ic n="clipboard" />
            </span>
            وضعیت سفارش
          </div>
        </div>
        <div className="empty" style={{ color: "rgb(255 255 255 / 0.75)", padding: "34px 10px" }}>
          <div className="em-ic" style={{ background: "rgb(255 255 255 / 0.12)", color: "#fff" }}>
            <Ic n="bag" />
          </div>
          <b style={{ color: "#fff" }}>هنوز سفارشی ثبت نکرده‌اید</b>
          <span>محصول مورد نظرتان را پیدا کنید و به سبد خرید اضافه کنید.</span>
          <Link href="/products" className="btn btn-white sm" style={{ marginTop: 10 }}>
            <Ic n="store" />
            مشاهدهٔ محصولات
          </Link>
        </div>
      </article>
    );
  }

  const { steps, cur, done, nowText } = flowOf(order);
  const n = steps.length;
  const items = order.OrderItems ?? [];
  const qty = items.reduce((sum, it) => sum + it.quantity, 0);
  const s = ST[order.status];
  const state = (i) => (done || i < cur ? "done" : i === cur ? "now" : "later");
  const small = (i) => {
    if (i === 0) return dateFa(order.createdAt);
    const st = state(i);
    return st === "done" ? "انجام شد" : st === "now" ? nowText : "";
  };

  return (
    <article className="tile t-track rise" style={{ "--i": 1 }} {...tileLink("orders", "وضعیت سفارش، رفتن به سفارش‌ها", onGo)}>
      <div className="t-head">
        <div className="t-title">
          <span className="ib">
            <Ic n={steps[cur].icon} />
          </span>
          وضعیت سفارش
        </div>
        <span className="t-go">
          <Ic n="arrowL" />
        </span>
      </div>
      <div className="trk-meta">
        <span className="trk-id">سفارش شمارهٔ {fa(order.userOrderNumber)}</span>
        <span className={`chip ${order.status === "processing" ? "live" : ""}`}>
          <i />
          {s.label}
        </span>
        <span className="trk-eta">
          ثبت‌شده در <b>{dateFa(order.createdAt)}</b>
        </span>
      </div>
      <div className={`steps ${arrived ? "on" : ""}`} style={{ "--n": n, "--cur": cur }}>
        <ol>
          {steps.map((st, i) => {
            const k = state(i);
            // در سفارش تحویل‌شده آخرین نقطه همان پستچی را نشان می‌دهد، نه تیک
            const icon = k === "done" && !(done && i === n - 1) ? "check" : st.icon;
            return (
              <li key={st.label} className={k === "later" ? "future" : ""} style={{ "--k": i }} aria-current={k === "now" ? "step" : undefined}>
                <span className={`dot ${k === "now" ? "now" : k === "later" ? "later" : ""}`}>
                  <Ic n={icon} />
                </span>
                {i < n - 1 && (
                  <span className={`cn ${i < cur ? "d" : ""}`} aria-hidden="true">
                    <i />
                    {i < cur && <b />}
                  </span>
                )}
                {k === "now" && !done && (
                  <span className="needle" aria-hidden="true">
                    <svg viewBox="0 0 46 46" fill="none">
                      <path d="M41 5 11 35" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
                      <ellipse cx="38.6" cy="7.4" rx="1.7" ry="3.6" transform="rotate(45 38.6 7.4)" fill="#3a1141" stroke="#fff" strokeWidth="1.6" />
                      <path d="M38 8c7 12-8 17-3 33" stroke="#fda4af" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </span>
                )}
                <div className="tx">
                  <b>{st.label}</b>
                  <small>{small(i)}</small>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="trk-foot">
        <div className="trk-items">
          <Stack items={items.map((it) => ({ id: it.id, image: it.Product?.image, name: it.Product?.name }))} max={3} />
          <div className="trk-sum">
            {fa(qty)} کالا<b>{toman(order.totalPrice)}</b>
          </div>
        </div>
        <div className="trk-actions">
          {order.status === "pending" && (
            <button type="button" className="btn btn-light sm" disabled={paying} onClick={() => onPay(order)}>
              <Ic n={paying ? "loader" : "shield"} className={paying ? "spin" : ""} />
              {paying ? "در حال انتقال…" : "ادامهٔ پرداخت"}
            </button>
          )}
          <button type="button" className="btn btn-white sm" onClick={(e) => onGo("orders", e.currentTarget.closest(".tile"))}>
            جزئیات سفارش
          </button>
        </div>
      </div>
    </article>
  );
}

/* ───────── حلقهٔ وضعیت سفارش‌ها ───────── */

function DonutTile({ orders, onGo }) {
  const arrived = useArrived();
  const [hot, setHot] = useState(null);
  const counts = countByStatus(orders);
  const total = orders.length;
  // بین بخش‌ها شکاف می‌افتد؛ اگر فقط یک وضعیت باشد، حلقهٔ کامل است
  const used = ST_KEYS.filter((k) => counts[k] > 0);
  const gap = used.length > 1 ? 6.4 : 0;
  let cum = 0;
  const segs = used.map((k) => {
    const pct = (counts[k] / total) * 100;
    const dash = Math.max(0.01, pct - gap);
    const off = -(cum + gap / 2);
    cum += pct;
    return { k, dash, off };
  });

  return (
    <article className="tile t-donut rise" style={{ "--i": 2 }} {...tileLink("orders", "وضعیت سفارش‌ها", onGo)}>
      <div className="t-head">
        <div className="t-title">
          <span className="ib">
            <Ic n="bag" />
          </span>
          وضعیت سفارش‌ها
        </div>
        <span className="t-go">
          <Ic n="arrowL" />
        </span>
      </div>
      <div className="donut-wrap">
        <div className={`donut ${hot ? "dim" : ""}`}>
          <svg viewBox="0 0 42 42" aria-hidden="true">
            <circle className="trk" cx="21" cy="21" r="15.9155" />
            {segs.map(({ k, dash, off }) => (
              <circle
                key={k}
                className={`seg ${hot === k ? "hot" : ""}`}
                cx="21"
                cy="21"
                r="15.9155"
                style={{ stroke: ST[k].c, strokeDashoffset: off.toFixed(2), strokeDasharray: arrived ? `${dash.toFixed(2)} ${(100 - dash).toFixed(2)}` : "0 100" }}
                onPointerEnter={() => setHot(k)}
                onPointerLeave={() => setHot(null)}
              />
            ))}
          </svg>
          <div className="mid">
            <b>
              <Count to={total} delay={500} />
            </b>
            <span>سفارش</span>
          </div>
        </div>
        <ul className="legend">
          {ST_KEYS.map((k) => (
            <li key={k} className={hot === k ? "hot" : ""} style={{ "--c": ST[k].c }} onPointerEnter={() => setHot(k)} onPointerLeave={() => setHot(null)}>
              <i />
              {ST[k].label}
              <b>{fa(counts[k])}</b>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/* ───────── نمودار خرید ۶ ماه اخیر (دست‌ساز، بدون کتابخانه) ───────── */

function SpendChart({ months }) {
  const ref = useRef(null);
  const arrived = useArrived();
  const [w, setW] = useState(0);
  const [hover, setHover] = useState(null);
  const h = 150;
  const n = months.length;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const values = months.map((m) => m.total);
  const max = (Math.max(...values) || 1) * 1.12;
  const pad = 14;
  const step = w / (n - 1);
  // قدیمی‌ترین ماه سمت راست و جدیدترین سمت چپ (راست‌به‌چپ)
  const pts = values.map((x, i) => [w - i * step, h - 6 - ((h - pad - 6) * x) / max]);
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const cx = (x0 + x1) / 2;
    d += ` C${cx.toFixed(1)},${y0.toFixed(1)} ${cx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  const area = `${d} L${pts[n - 1][0]},${h} L${pts[0][0]},${h} Z`;

  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setHover(Math.round((1 - frac) * (n - 1)));
  };
  const at = hover == null ? null : pts[hover];

  return (
    <>
      <div className={`chart ${arrived ? "on" : ""} ${hover != null ? "hov" : ""}`} ref={ref} onPointerMove={move} onPointerLeave={() => setHover(null)}>
        {w > 0 && (
          <>
            <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
              <defs>
                <linearGradient id="pf-lg" x1="1" x2="0">
                  <stop offset="0" stopColor="#fb7185" />
                  <stop offset=".55" stopColor="#e11d74" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="pf-ag" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#e11d74" stopOpacity=".28" />
                  <stop offset="1" stopColor="#e11d74" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map((f) => (
                <line key={f} className="gl" x1="0" x2={w} y1={(h * f).toFixed(1)} y2={(h * f).toFixed(1)} />
              ))}
              <path className="ar" d={area} />
              <path className="ln" pathLength="1" d={d} />
            </svg>
            <span className="cross" style={at ? { left: at[0] } : undefined} />
            <span className="dotp" style={at ? { left: at[0], top: at[1] } : undefined} />
            <span className="ctip" style={at ? { left: Math.min(w - 50, Math.max(50, at[0])) } : undefined}>
              {hover != null && `${months[hover].name}: ${compactText(values[hover])} تومان`}
            </span>
          </>
        )}
      </div>
      <div className="xl">
        {months.map((m) => (
          <span key={m.idx}>{m.name}</span>
        ))}
      </div>
    </>
  );
}

function SpendTile({ orders }) {
  const { months, total, previous } = spendingByMonth(orders);
  // تغییر نسبت به شش ماهِ پیش از آن؛ بدون سابقه، نشان داده نمی‌شود
  const change = previous > 0 ? Math.round(((total - previous) / previous) * 100) : null;
  return (
    <article className="tile t-spend rise" style={{ "--i": 3 }}>
      <div className="t-head">
        <div className="t-title">
          <span className="ib">
            <Ic n="trend" />
          </span>
          خرید ۶ ماه اخیر
        </div>
      </div>
      <div>
        <span className="big">
          <Count to={total} delay={700} />
          <small>تومان</small>
        </span>
        {change != null && change !== 0 && (
          <span className={`delta ${change < 0 ? "down" : ""}`} title="نسبت به شش ماه قبل از آن">
            <Ic n="trend" />
            {fa(Math.abs(change))}٪
          </span>
        )}
      </div>
      <SpendChart months={months} />
    </article>
  );
}

/* ───────── سبد، آدرس و علاقه‌مندی‌ها ───────── */

function CartTile({ items, count, onGo }) {
  // گران‌ترین کالا وسط بادبزن است (آخرین تصویر روی بقیه می‌افتد)
  const top = [...items].sort((a, b) => b.price - a.price).slice(0, 3).reverse();
  const sum = items.reduce((s, it) => s + it.price * it.quantity, 0);
  return (
    <article className="tile t-cart rise" style={{ "--i": 4 }} {...tileLink("cart", "سبد خرید", onGo)}>
      <div className="t-head">
        <div className="t-title">
          <span className="ib">
            <Ic n="cart" />
          </span>
          سبد خرید
        </div>
        <span className="t-go">
          <Ic n="arrowL" />
        </span>
      </div>
      {top.length ? (
        <>
          <div className="fan">
            {top.map((it) => (
              <Thumb key={it.id} src={it.image} alt="" width={112} height={92} />
            ))}
          </div>
          <div className="cart-row">
            <div>
              <div className="lbl">{fa(count)} کالا در سبد</div>
              <div className="big">
                <Count to={sum} delay={600} />
                <small>تومان</small>
              </div>
            </div>
          </div>
          <button type="button" className="btn btn-primary" style={{ width: "100%" }} onClick={(e) => onGo("cart", e.currentTarget.closest(".tile"))}>
            تکمیل خرید <Ic n="arrowL" />
          </button>
        </>
      ) : (
        <div className="empty">
          <div className="em-ic">
            <Ic n="cart" />
          </div>
          <b>سبد شما خالی است</b>
        </div>
      )}
    </article>
  );
}

function AddrTile({ addresses, onGo }) {
  const last = addresses[addresses.length - 1];
  return (
    <article className="tile t-addr rise" style={{ "--i": 5 }} {...tileLink("addresses", "آدرس‌ها", onGo)}>
      <MapBox seed={Math.max(0, addresses.length - 1)} />
      <div className="addr-body">
        <div className="t-title" style={{ justifyContent: "space-between" }}>
          <span>آدرس من</span>
          {addresses.length > 0 && (
            <span className="chip" style={{ "--c": "var(--brand-600)" }}>
              {fa(addresses.length)} آدرس
            </span>
          )}
        </div>
        <p>{last ? last.address : "هنوز آدرسی ثبت نکرده‌اید."}</p>
      </div>
    </article>
  );
}

function FavTile({ favorites, leavingId, onUnfav, onAdd }) {
  const rail = useRef(null);
  // جهت اسکرول در راست‌به‌چپ: «قبلی» به سمت شروع (راست) و «بعدی» به سمت چپ می‌رود
  const slide = (d) => rail.current?.scrollBy({ left: d * 480, behavior: scrollBehavior() });
  return (
    <article className="tile t-fav rise" style={{ "--i": 6 }}>
      <div className="t-head">
        <div className="t-title">
          <span className="ib">
            <Ic n="heart" />
          </span>
          علاقه‌مندی‌ها
          <span className="chip" style={{ "--c": "var(--ink-3)" }}>
            {fa(favorites.length)} کالا
          </span>
        </div>
        {favorites.length > 0 && (
          <div className="rail-ctl">
            <button type="button" className="ib-btn" onClick={() => slide(1)} aria-label="قبلی">
              <Ic n="chevR" />
            </button>
            <button type="button" className="ib-btn" onClick={() => slide(-1)} aria-label="بعدی">
              <Ic n="chevL" />
            </button>
          </div>
        )}
      </div>
      {favorites.length ? (
        <div className="rail" ref={rail}>
          {favorites.map((item, i) => (
            <Pcard key={item.id} item={item} index={i} leaving={leavingId === item.id} onUnfav={onUnfav} onAdd={onAdd} />
          ))}
        </div>
      ) : (
        <div className="empty" style={{ padding: "26px 20px" }}>
          <div className="em-ic">
            <Ic n="heart" />
          </div>
          <b>هنوز چیزی ذخیره نکرده‌اید</b>
          <span>با زدن قلب روی هر محصول، اینجا نگهش می‌داریم.</span>
        </div>
      )}
    </article>
  );
}

// جملهٔ خلاصهٔ زیر سلام، از روی وضعیت واقعی سفارش‌ها و سبد
function Lead({ orders, cartCount }) {
  if (orders == null) return null;
  const processing = orders.find((o) => o.status === "processing");
  const pending = orders.find((o) => o.status === "pending");
  const last = orders[0];
  let first;
  if (processing)
    first = (
      <>
        سفارش شمارهٔ <b>{fa(processing.userOrderNumber)}</b> شما در جریان است.
      </>
    );
  else if (pending)
    first = (
      <>
        سفارش شمارهٔ <b>{fa(pending.userOrderNumber)}</b> شما هنوز پرداخت نشده است.
      </>
    );
  else if (last)
    first = (
      <>
        آخرین سفارش شما (شمارهٔ <b>{fa(last.userOrderNumber)}</b>) {last.status === "delivered" ? "تحویل شده است." : "مرجوع شده است."}
      </>
    );
  else first = <>هنوز سفارشی ثبت نکرده‌اید.</>;
  return (
    <>
      {first}
      {cartCount > 0 && (
        <>
          {" "}
          <b>{fa(cartCount)} کالا</b> هم در سبد خرید منتظر شماست.
        </>
      )}
    </>
  );
}

// نمای کلی: سلام، جملهٔ خلاصه و کاشی‌های بنتو. هر کاشی داده‌ٔ زنده نشان می‌دهد و با کلیک به بخش خودش می‌رود؛ بنابراین «دسترسی سریع» جدا لازم نیست
export default function Overview({ user, orders, cartItems, cartCount, favorites, addresses, payingId, leavingFav, onGo, onPay, onUnfav, onAdd }) {
  const first = user?.name?.trim().split(/\s+/)[0] || "کاربر";
  const focus = orders && (orders.find((o) => o.status === "processing") ?? orders.find((o) => o.status === "pending") ?? orders[0] ?? null);
  const loading = orders == null;

  return (
    <>
      {/* سربرگ: کارت صورتی پنل قبلی با قرقره و قیچی کم‌رنگ، نوار بخیهٔ متحرک پایین، آواتار (حلقهٔ چرخان + پالس + نام کامل در تولتیپ)، سلام و مشخصات حساب */}
      <section className="hero auth-panel rise" style={{ "--i": 0 }} aria-labelledby="profile-title">
        <Spool className="pointer-events-none absolute -left-6 -top-8 h-44 w-44 -rotate-12 text-white/10" strokeWidth={1.25} aria-hidden="true" />
        <Scissors className="pointer-events-none absolute -bottom-10 left-1/3 hidden h-32 w-32 rotate-12 text-white/[0.07] md:block" strokeWidth={1.25} aria-hidden="true" />
        <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-11 w-full" viewBox="0 0 800 44" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <path className="auth-stitch" d="M-20 30 C 100 14, 220 40, 360 26 S 600 14, 820 28" stroke="#fff" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="hero-in">
          <div className="hero-id">
            <div className="hero-av">
              <Avatar value={user?.avatar} name={user?.name} label={user?.name || "حساب کاربری"} />
              {/* مداد: مستقیم به کارت «تغییر آواتار» در تنظیمات می‌رود (پنجرهٔ جدا باز نمی‌شود) */}
              <button type="button" className="pen" data-tip="تغییر آواتار" aria-label="تغییر آواتار" onClick={() => onGo("settings", null, "avatar-card")}>
                <Ic n="pencil" />
              </button>
              {user?.name && (
                <span className="tip" aria-hidden="true">
                  {user.name}
                </span>
              )}
            </div>
            <div className="hero-txt">
              <span className="eyebrow">
                <Ic n="cal" />
                {dayFull(new Date())}
              </span>
              <h1 id="profile-title" className="hello">
                {greeting()}، {first}
              </h1>
              <p className="lead">
                <Lead orders={orders} cartCount={cartCount} />
              </p>
              {(user?.username || user?.email) && (
                <ul className="hero-meta" aria-label="مشخصات حساب">
                  {user?.username && (
                    <li>
                      <span className="mi">
                        <Ic n="user" />
                      </span>
                      <span className="mt">
                        <small>نام کاربری</small>
                        <bdi dir="ltr">{user.username}</bdi>
                      </span>
                    </li>
                  )}
                  {user?.email && (
                    <li>
                      <span className="mi">
                        <Ic n="mail" />
                      </span>
                      <span className="mt">
                        <small>ایمیل</small>
                        <bdi dir="ltr">{user.email}</bdi>
                      </span>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
          <Link href="/products" className="btn btn-white">
            <Ic n="store" />
            ادامهٔ خرید
          </Link>
        </div>
      </section>
      <div className="bento">
        {loading ? (
          <>
            <div className="tile skel t-track" style={{ minHeight: 340 }} aria-hidden="true" />
            <div className="tile skel t-donut" style={{ minHeight: 340 }} aria-hidden="true" />
            <div className="tile skel t-spend" style={{ minHeight: 300 }} aria-hidden="true" />
          </>
        ) : (
          <>
            <TrackTile order={focus} onGo={onGo} onPay={onPay} paying={focus && payingId === focus.id} />
            <DonutTile orders={orders} onGo={onGo} />
            <SpendTile orders={orders} />
          </>
        )}
        <CartTile items={cartItems} count={cartCount} onGo={onGo} />
        <AddrTile addresses={addresses} onGo={onGo} />
        <FavTile favorites={favorites} leavingId={leavingFav} onUnfav={onUnfav} onAdd={onAdd} />
      </div>
    </>
  );
}
