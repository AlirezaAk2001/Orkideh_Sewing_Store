"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Rows3 } from "lucide-react";
import "./page-size-select.css";

const fa = (n) => Number(n).toLocaleString("fa-IR");

// «تعداد در صفحه»ی صفحه‌بندی جدول‌ها (ظاهر و انیمیشن در page-size-select.css): جای <select> بومی که لیستش را سیستم‌عامل می‌کشد و قابل طراحی نیست.
// الگوی combobox مثل SelectInput فرم‌ها: فوکوس همیشه روی دکمه می‌ماند (aria-activedescendant گزینهٔ فعال را اعلام می‌کند) و کیبورد کامل است: ↑ ↓ Home End Enter Space Esc Tab؛
// کلیک بیرون از فیلد منو را می‌بندد. options آرایهٔ عددهاست و onChange خودِ عدد را می‌گیرد؛ منو رو به پایین باز می‌شود و چون کارت جدول overflow:hidden دارد، در portal روی body
// و با position:fixed می‌نشیند (جا و بالاکشیدن در صورت نبودن جا: useLayoutEffect پایین)
export default function PageSizeSelect({ value, options, onChange, label = "تعداد در صفحه:" }) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState(null); // جای منوی fixed: { top, left } (تا اندازه‌گیری، پنهان)
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const idx = options.indexOf(value);

  const close = () => {
    setOpen(false);
    setActive(-1);
  };
  const show = () => {
    setActive(idx >= 0 ? idx : 0);
    setOpen(true);
  };
  const choose = (n) => {
    if (n !== value) onChange(n);
    close();
    btnRef.current?.focus({ preventScroll: true });
  };

  // کلیک بیرون از دکمه و منو (منو داخل portal است، پس جدا از rootRef بررسی می‌شود) آن را می‌بندد؛ منوی fixed با اسکرول از دکمه جدا می‌ماند، پس اسکرول هم می‌بندد
  useEffect(() => {
    if (!open) return undefined;
    const dismiss = () => {
      setOpen(false);
      setActive(-1);
    };
    const outside = (e) => {
      if (rootRef.current?.contains(e.target) || popRef.current?.contains(e.target)) return;
      dismiss();
    };
    document.addEventListener("pointerdown", outside, true);
    window.addEventListener("scroll", dismiss, true);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, [open]);

  // جای منو: همیشه زیر دکمه (۸px فاصله) و لبهٔ شروعش هم‌تراز لبهٔ دکمه. صفحه‌بندی ته پنجره است و زیرش جا نیست، پس اگر منو از کف پنجره بیرون می‌زد
  // به‌اندازهٔ لازم بالا کشیده می‌شود (دکمه را هم می‌پوشاند، مثل منوی سیستم‌عامل کنار لبه) تا هیچ گزینه‌ای بریده نشود. اندازه‌گیری پیش از رنگ‌شدن است (useLayoutEffect)
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return undefined;
    }
    const place = () => {
      const b = btnRef.current?.getBoundingClientRect();
      const p = popRef.current;
      if (!b || !p) return;
      const w = p.offsetWidth;
      const h = p.offsetHeight;
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      let top = b.bottom + 8;
      if (top + h > vh - 8) top = Math.max(8, vh - 8 - h);
      setPos({ top, left: Math.min(Math.max(8, b.right - w), vw - w - 8) });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);

  const onKeyDown = (e) => {
    const last = options.length - 1;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) show();
      else setActive((a) => (e.key === "ArrowDown" ? Math.min(a + 1, last) : Math.max(a - 1, 0)));
    } else if ((e.key === "Home" || e.key === "End") && open) {
      e.preventDefault();
      setActive(e.key === "Home" ? 0 : last);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) show();
      else if (active >= 0) choose(options[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") close();
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id}>{label}</label>
      <div className="alst-ps" ref={rootRef}>
        <button
          id={id}
          ref={btnRef}
          type="button"
          className="alst-ps-btn"
          data-open={open ? "" : undefined}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && active >= 0 ? `${id}-opt-${active}` : undefined}
          onClick={() => (open ? close() : show())}
          onKeyDown={onKeyDown}
        >
          <span className="alst-ps-ic" aria-hidden="true">
            <Rows3 />
          </span>
          <span className="alst-ps-val">{fa(value)}</span>
          <ChevronDown className="alst-ps-chev" aria-hidden="true" />
        </button>
        {open &&
          createPortal(
            <ul ref={popRef} className="alst-ps-pop" id={listId} role="listbox" aria-label={label} style={pos ? { top: pos.top, left: pos.left } : { visibility: "hidden" }}>
              {options.map((n, i) => (
                <li
                  key={n}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={n === value}
                  data-active={i === active ? "" : undefined}
                  className="alst-ps-opt"
                  style={{ "--i": i }}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(n)}
                >
                  <span className="alst-ps-num">{fa(n)}</span>
                  <span className="alst-ps-unit">مورد</span>
                  {n === value && <Check className="alst-ps-tick" aria-hidden="true" />}
                </li>
              ))}
            </ul>,
            document.body
          )}
      </div>
    </div>
  );
}
