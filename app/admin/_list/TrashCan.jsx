"use client";

import { useEffect, useRef } from "react";

// سطل زبالهٔ دکمهٔ حذف (همان شکل Trash2 لوسید، ولی درب جدا از بدنه). با هاور یا فوکوس کیبورد روی دکمه‌ی دربرگیرنده، درب از سطل جدا می‌شود، با فاصله در هوا
// مثل زنگوله می‌جنبد و برمی‌گردد سر جایش (keyframes «trash-lid» در globals.css). حرکت یک‌بار تا آخر پخش می‌شود، حتی اگر موس وسطش بیرون برود، تا درب
// هیچ‌وقت وسط راه نپرد؛ با «کاهش حرکت» سیستم هیچ حرکتی نیست
export default function TrashCan({ className = "h-[18px] w-[18px]" }) {
  const svg = useRef(null);

  useEffect(() => {
    const root = svg.current;
    const host = root?.closest("button, a");
    const lid = root?.querySelector(".trash-lid");
    if (!host || !lid) return;
    const play = () => lid.setAttribute("data-play", "");
    const playOnKeyboardFocus = () => {
      if (host.matches(":focus-visible")) play();
    };
    const done = () => lid.removeAttribute("data-play");
    host.addEventListener("pointerenter", play);
    host.addEventListener("focus", playOnKeyboardFocus);
    lid.addEventListener("animationend", done);
    return () => {
      host.removeEventListener("pointerenter", play);
      host.removeEventListener("focus", playOnKeyboardFocus);
      lid.removeEventListener("animationend", done);
    };
  }, []);

  return (
    <svg
      ref={svg}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`overflow-visible ${className}`}
      aria-hidden="true"
    >
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <g className="trash-lid">
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </g>
    </svg>
  );
}
