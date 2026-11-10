"use client";

import Link from "next/link";
import AppImage from "@/app/components/AppImage";
import { useChangeKey } from "@/lib/motion";
import { Ic } from "./icons";
import { NO_IMAGE, fa } from "./format";

// وضعیت‌های سفارش در پنل: برچسب، رنگ (--st-* در profile.css) و آیکون
export const ST = {
  processing: { label: "جاری", c: "var(--st-processing)", icon: "truck" },
  delivered: { label: "تحویل شده", c: "var(--st-delivered)", icon: "packcheck" },
  returned: { label: "مرجوع شده", c: "var(--st-returned)", icon: "undo" },
  pending: { label: "منتظر پرداخت", c: "var(--st-pending)", icon: "hourglass" },
};
export const ST_KEYS = Object.keys(ST);

// تعداد سفارش هر وضعیت
export const countByStatus = (orders) => Object.fromEntries(ST_KEYS.map((k) => [k, orders.filter((o) => o.status === k).length]));

// عنوان صفحهٔ هر بخش: کاشی شیشه‌ای با آیکون گرادیانی؛ با کلیک روی کاشی‌های نمای کلی، کاشی به همین کاشی تبدیل (morph) می‌شود
export function ViewHead({ icon, title, sub, children }) {
  return (
    <div className="tile vh rise" style={{ "--i": 0 }}>
      <h1>
        <span className="ib">
          <Ic n={icon} />
        </span>
        <span>
          {title}
          <small>{sub}</small>
        </span>
      </h1>
      {children}
    </div>
  );
}

export function Empty({ icon, title, text, children }) {
  return (
    <div className="tile empty rise" style={{ "--i": 1 }}>
      <div className="em-ic">
        <Ic n={icon} />
      </div>
      <b>{title}</b>
      {text && <span>{text}</span>}
      {children}
    </div>
  );
}

// عدد و مبلغی که هنگام تغییر مقدار یک «تیک» کوچک می‌زند (از بالا می‌نشیند)، نه هنگام نمایش اولیه
export function Tick({ value, className = "", children }) {
  const changed = useChangeKey(value);
  return (
    <span key={changed} className={`${changed ? "tick" : ""} ${className}`.trim()}>
      {children}
    </span>
  );
}

export function Thumb({ src, alt = "", width, height }) {
  return <AppImage src={src || NO_IMAGE} alt={alt} width={width} height={height} />;
}

// ردیف عکس‌های کالاهای یک سفارش (روی هم افتاده)؛ بیش از max کالا با حباب «+n»
export function Stack({ items, size = 52, max = 4 }) {
  const shown = items.slice(0, max);
  const rest = items.length - shown.length;
  return (
    <div className="stack">
      {shown.map((it, i) => (
        <Thumb key={it.id ?? i} src={it.image} alt={it.name} width={size} height={size} />
      ))}
      {rest > 0 && <span className="more">+{fa(rest)}</span>}
    </div>
  );
}

// نقشهٔ تزئینی آدرس (سه حالت چرخش و جابه‌جایی تا کارت‌ها یکسان نباشند)
export function MapArt({ seed = 0 }) {
  const rot = [0, -14, 22][seed % 3];
  const dx = [0, -40, 30][seed % 3];
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g transform={`translate(${dx} 0) rotate(${rot} 200 100) scale(1.15)`}>
        <rect x="-60" y="-40" width="520" height="280" fill="#f8e6f0" />
        <path d="M30 40h70v54H30zM120 40h90v54h-90zM236 40h80v54h-80zM30 114h58v60H30zM110 114h100v60H110zM236 114h120v60H236z" fill="#f3d6e6" />
        <path d="M250 124c30 0 60 8 90 6v38c-40 2-70-2-90-8z" fill="#e3d4f2" />
        <g fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round">
          <path d="M-30 106H440" />
          <path d="M110 -30V230" />
          <path d="M226 -30V230" />
          <path d="M-30 30C80 10 160 60 260 20S380 10 440 30" />
        </g>
        <g fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".85">
          <path d="M20 186H420" />
          <path d="M330 -20V220" />
          <path d="M-20 70H200" />
        </g>
      </g>
    </svg>
  );
}

// قاب نقشه با سنجاق شناور وسط آن؛ حلقهٔ پالسِ دور سنجاق خودِ .pin::before است (profile.css)
export function MapBox({ seed, children }) {
  return (
    <div className="map">
      <MapArt seed={seed} />
      <span className="pin">
        <Ic n="pin" />
      </span>
      {children}
    </div>
  );
}

// کارت محصول (بخش علاقه‌مندی‌ها): قلب برای برداشتن، درصد تخفیف و دکمهٔ افزودن به سبد.
// slug ندارد = لینک ندارد؛ oldPrice و discount فقط برای کالای تخفیف‌دار می‌آیند
export function Pcard({ item, index = 0, leaving = false, onUnfav, onAdd }) {
  const href = item.slug ? `/products/${item.slug}` : null;
  const image = <Thumb src={item.image} alt={item.name} width={260} height={195} />;
  return (
    <article className={`pcard ${leaving ? "out" : ""}`} style={{ "--i": index }}>
      <div className="im">
        {href ? (
          <Link href={href} tabIndex={-1} aria-hidden="true">
            {image}
          </Link>
        ) : (
          image
        )}
        {item.discount > 0 && (
          <span className="off">
            {fa(item.discount)}٪<small>تخفیف</small>
          </span>
        )}
        <button type="button" className="hb" onClick={() => onUnfav(item)} aria-label={`حذف ${item.name} از علاقه‌مندی‌ها`}>
          <Ic n="heart" />
        </button>
      </div>
      <div className="bd">
        <h3>{href ? <Link href={href}>{item.name}</Link> : item.name}</h3>
        <div className="price">
          {item.price ? (
            <>
              <b>{fa(item.price)}</b>
              <span>تومان</span>
              {item.oldPrice > item.price && <s>{fa(item.oldPrice)}</s>}
            </>
          ) : (
            <span>قیمت نامشخص</span>
          )}
        </div>
        <button type="button" className="btn btn-ghost sm add" onClick={(e) => onAdd(item, e.currentTarget)}>
          <Ic n="cart" />
          افزودن به سبد
        </button>
      </div>
    </article>
  );
}
