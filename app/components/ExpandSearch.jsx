"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import SearchGlyph from "./SearchGlyph";
import { OrbBubbles, OrbHalo, useOrbTilt } from "./SearchOrb";

// جستجوی جمع‌شونده برای جاهایی که فیلد داخل صفحه می‌نشیند (نوار ابزار محصولات ادمین، فیلتر صفحهٔ محصولات). در حالت عادی فقط یک گوی صورتی براق است: مثل مایع آرام موج می‌خورد،
// حباب از آن بالا می‌رود، ذره‌بین نرم معلق است و هر چند ثانیه خودش را پاک می‌کند و از صفر می‌کشد. با هاور گوی سه‌بعدی کج می‌شود، نور براقش دنبال نشانگر می‌آید و حلقه‌ای دورش کشیده می‌شود.
// با کلیک گوی مثل مایع به فیلد کش می‌آید (قطره‌هایی از آن جدا و دوباره جذب می‌شوند)، بعد فیلد سفید با لبهٔ صورتی ظاهر می‌شود (ظاهر: بخش «جستجو» در globals.css).
// value / onChange(event) / onClear: فیلد کنترل‌شده است و متن از والد می‌آید. تا وقتی متنی هست، فیلد باز می‌ماند (جستجوی فعال نباید پنهان شود)؛ با خالی‌شدن و رفتن فوکوس، یا با ضربدر و Esc، جمع می‌شود.
// ضربدر: با متن، متن را پاک می‌کند و فیلد باز می‌ماند؛ بدون متن، فیلد را می‌بندد. Esc همیشه پاک و جمع می‌کند و فوکوس را به گوی برمی‌گرداند.
// rest: محتوایی که هنگام جمع بودن کنار گوی دیده می‌شود (مثلاً برچسب «نام برند یا نام محصول») و با باز شدن فیلد زیر آن محو می‌شود؛ با آن فیلد روی همان ردیف باز می‌شود (گوی در انتهای ردیف می‌ماند).
// با حرکت نشانگر روی برچسب هم گوی بیدار می‌شود (به سمت نشانگر کج می‌شود و حلقه‌اش کشیده می‌شود).
// openWidth: عرض فیلد باز (پیش‌فرض تمام عرض والد). phoneFullRow: روی گوشی فیلد باز تمام ردیف را می‌گیرد (برای نوار ابزار flex-wrap).
// مایع: فیلتر goo فقط حدود یک ثانیهٔ کش‌آمدن (و جمع‌شدن) روی لایهٔ رنگ است تا نوشتهٔ فیلد هرگز تار نشود؛ جای قطره‌ها به نسبت عرض باز (--xs-ow) در همین کامپوننت اندازه‌گیری می‌شود.
const DRIPS = [
  { f: 0.2, top: "30%" },
  { f: 0.5, top: "14%" },
  { f: 0.82, top: "40%" },
];
const STRETCH_MS = 1150;

export default function ExpandSearch({
  value,
  onChange,
  onClear,
  label = "جستجو",
  placeholder = "",
  inputId,
  inputProps,
  size = "md",
  rest,
  openWidth = "100%",
  phoneFullRow = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [stretch, setStretch] = useState(false);
  const gooId = `xs-goo-${useId().replace(/:/g, "")}`;
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const btnRef = useRef(null);
  const { orbRef, onPointerMove, onPointerLeave, reset } = useOrbTilt();
  const isOpen = open || value !== "";

  // باز و بسته شدن: لایهٔ رنگ مایع می‌شود و جای قطره‌ها از روی عرض فعلی فیلد باز اندازه‌گیری می‌شود (عرض باز هر چه شد، قطره‌ها داخل آن می‌مانند)
  const seen = useRef(isOpen);
  useEffect(() => {
    if (seen.current === isOpen) return undefined;
    seen.current = isOpen;
    reset(); // گوی بعد از باز/بسته‌شدن باید دوباره حرکت واقعی نشانگر ببیند تا هاور بگیرد
    const root = rootRef.current;
    if (root) root.style.setProperty("--xs-ow", `${Math.round(root.getBoundingClientRect().width)}px`);
    setStretch(true);
    const timer = setTimeout(() => setStretch(false), STRETCH_MS);
    return () => clearTimeout(timer);
  }, [isOpen, reset]);

  const openIt = () => {
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  };
  const closeIt = () => {
    setOpen(false);
    const btn = btnRef.current;
    if (btn) {
      btn.setAttribute("data-restored", ""); // فوکوس برگردانده می‌شود ولی حلقهٔ فوکوس نشان نمی‌دهد (CSS)
      btn.focus({ preventScroll: true });
    }
  };
  const onX = () => {
    if (value !== "") {
      setOpen(true); // بعد از پاک‌کردن هم باز می‌ماند
      onClear?.();
      inputRef.current?.focus({ preventScroll: true });
    } else {
      closeIt();
    }
  };

  return (
    <div
      ref={rootRef}
      role="search"
      aria-label={label}
      className={`xs ${isOpen ? "is-open" : ""} ${rest ? "xs--rest" : ""} ${phoneFullRow ? "xs--phone-row" : ""} ${className}`}
      style={{ "--xs-size": size === "lg" ? "2.75rem" : "2.5rem", "--xs-open": openWidth }}
      onBlur={(e) => {
        // فوکوس از کل جستجو رفت و متنی نیست: جمع شو
        if (open && value === "" && !rootRef.current?.contains(e.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !isOpen) return;
        e.preventDefault();
        onClear?.();
        closeIt();
      }}
    >
      {rest && (
        <button type="button" className="xs-rest" onClick={openIt} onPointerMove={isOpen ? undefined : onPointerMove} onPointerLeave={onPointerLeave} tabIndex={isOpen ? -1 : 0}>
          {rest}
        </button>
      )}
      <div ref={orbRef} className={`xs-orb ${isOpen ? "xs-open" : ""} ${stretch ? "is-stretch" : ""}`} onPointerMove={isOpen ? undefined : onPointerMove} onPointerLeave={onPointerLeave}>
        <span className="xs-goo" aria-hidden="true" style={stretch ? { filter: `url(#${gooId})` } : undefined}>
          <span className="xs-skin" />
          {DRIPS.map((d, i) => (
            <i key={i} className="xs-drip" style={{ "--f": d.f, "--n": i, top: d.top }} />
          ))}
        </span>
        <span className="xs-fill" aria-hidden="true" />
        <OrbBubbles />
        <OrbHalo />
        <button ref={btnRef} type="button" className="xs-btn" aria-label={label} aria-expanded={isOpen} onClick={openIt} onBlur={(e) => e.currentTarget.removeAttribute("data-restored")} tabIndex={isOpen ? -1 : 0}>
          <SearchGlyph />
        </button>
        <div className="xs-body" inert={!isOpen}>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            aria-label={label}
            className="xs-input"
            {...inputProps}
          />
          <button type="button" className="xs-x" onClick={onX} aria-label={value !== "" ? "پاک کردن جستجو" : "بستن جستجو"}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <defs>
          <filter id={gooId} x="-20%" y="-60%" width="140%" height="220%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b" />
            <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="g" />
            <feComposite in="SourceGraphic" in2="g" operator="atop" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
