"use client";

import { useEffect, useRef } from "react";

// آیکون‌های متحرکِ دکمه‌های «ویرایش» و «حذف» (هر جا که کاربر چیزی را ویرایش یا حذف می‌کند: لیست‌های ادمین، سبد خرید، علاقه‌مندی‌ها، نظرات، گالری تصویر).
// هر دو همان شکل لوسید (Pencil / Trash2) را دارند، ولی یک بخش‌شان جداست و با هاور یا فوکوس کیبورد روی دکمه یا لینکِ دربرگیرنده یک‌بار حرکت می‌کند:
// قلم یک خط می‌نویسد (pen-write)، درِ سطل بالا می‌رود و مثل زنگوله می‌جنبد (trash-lid)؛ keyframesها در globals.css هستند و با «کاهش حرکت» هیچ حرکتی نیست.
// حرکت با data-play روی بخش متحرک روشن می‌شود و تا آخر پخش می‌شود (حتی اگر موس وسطش بیرون برود، تا آیکون هیچ‌وقت وسط راه نپرد). دکمهٔ غیرفعال حرکت نمی‌کند
function useHoverPlay(svgRef, partSelector) {
  useEffect(() => {
    const root = svgRef.current;
    const host = root?.closest("button, a");
    const part = root?.querySelector(partSelector);
    if (!host || !part) return;
    const blocked = () => host.disabled || host.getAttribute("aria-disabled") === "true";
    const play = () => {
      if (!blocked()) part.setAttribute("data-play", "");
    };
    const playOnKeyboardFocus = () => {
      if (host.matches(":focus-visible")) play();
    };
    const done = () => part.removeAttribute("data-play");
    host.addEventListener("pointerenter", play);
    host.addEventListener("focus", playOnKeyboardFocus);
    part.addEventListener("animationend", done);
    return () => {
      host.removeEventListener("pointerenter", play);
      host.removeEventListener("focus", playOnKeyboardFocus);
      part.removeEventListener("animationend", done);
    };
  }, [svgRef, partSelector]);
}

const SVG_PROPS = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

// سطل زباله (Trash2 لوسید با درب جدا از بدنه)
export function TrashCan({ className = "h-[18px] w-[18px]" }) {
  const svg = useRef(null);
  useHoverPlay(svg, ".trash-lid");
  return (
    <svg ref={svg} {...SVG_PROPS} className={`overflow-visible ${className}`}>
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

// قلم (Pencil لوسید). نوک قلم مرکز چرخش است (globals.css)، پس جای نوک فقط از جابه‌جایی می‌آید: خط از نقطهٔ شروعِ چپ تا نقطهٔ پایانِ راست و هر دو در یک سطح
export function PenIcon({ className = "h-[18px] w-[18px]" }) {
  const svg = useRef(null);
  useHoverPlay(svg, ".pen-write");
  return (
    <svg ref={svg} {...SVG_PROPS} className={`overflow-visible ${className}`}>
      <g className="pen-write">
        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
        <path d="m15 5 4 4" />
      </g>
    </svg>
  );
}
