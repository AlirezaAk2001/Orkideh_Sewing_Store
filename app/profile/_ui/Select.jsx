"use client";

import { useEffect, useRef, useState } from "react";
import { Ic } from "./icons";
import { FL } from "./parts";

// سلکت‌باکس اختصاصی پنل (جای <select> بومی که لیستش را سیستم‌عامل می‌کشد و قابل طراحی نیست): باکس همان باکس شناورِ بقیهٔ فیلدهاست (کلاس fl)،
// فلشش با باز شدن می‌چرخد و منوی کشویی کارتِ شیشه‌ای با آیکون هر گزینه و تیک گزینهٔ انتخاب‌شده است.
// الگوی combobox: فوکوس همیشه روی دکمه می‌ماند (aria-activedescendant گزینهٔ فعال را اعلام می‌کند) و کیبورد کامل است: ↑ ↓ Home End Enter Space Esc Tab.
// کلیک بیرون از فیلد منو را می‌بندد و چون روی دکمه preventDefault نمی‌شود، فوکوس (و سایهٔ فوکوس باکس) هم همان لحظه برداشته می‌شود؛ <select> بومی بعد از بسته شدن لیستش فوکوس را نگه می‌داشت.
// options: [{ value, label, icon }]؛ value خالی یعنی هنوز انتخابی نیست (متن placeholder فقط با فوکوس دیده می‌شود، مثل بقیهٔ فیلدها)
export default function Select({ id, label, value, onChange, options, placeholder = "انتخاب کنید" }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const idx = options.findIndex((o) => o.value === value);
  const current = idx >= 0 ? options[idx] : null;
  const listId = `${id}-list`;

  const close = () => {
    setOpen(false);
    setActive(-1);
  };
  const show = () => {
    setActive(idx >= 0 ? idx : 0);
    setOpen(true);
  };
  const choose = (o) => {
    onChange(o.value);
    close();
    btnRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return undefined;
    const outside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setActive(-1);
      }
    };
    document.addEventListener("pointerdown", outside, true);
    return () => document.removeEventListener("pointerdown", outside, true);
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
    <div className="field fl sel-field" ref={rootRef}>
      <div className={`inp sel ${current ? "has" : ""} ${open ? "open" : ""}`}>
        <button
          id={id}
          ref={btnRef}
          type="button"
          className="sel-btn"
          value={value}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && active >= 0 ? `${id}-opt-${active}` : undefined}
          onClick={() => (open ? close() : show())}
          onKeyDown={onKeyDown}
        >
          <span className="sel-ic">
            <Ic n={current ? current.icon : options[0].icon} />
          </span>
          <span className="sel-txt">{current ? current.label : placeholder}</span>
          <Ic n="chevD" className="chev" />
        </button>
        <FL htmlFor={id}>{label}</FL>
      </div>
      {open && (
        <ul className="sel-pop" id={listId} role="listbox" aria-label={label}>
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={o.value === value}
              data-value={o.value}
              data-active={i === active ? "" : undefined}
              className="sel-opt"
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(o)}
            >
              <span className="sel-ic">
                <Ic n={o.icon} />
              </span>
              <span className="sel-txt">{o.label}</span>
              {o.value === value && <Ic n="check" className="tick" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
