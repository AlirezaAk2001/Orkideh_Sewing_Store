"use client";

import { useEffect, useRef } from "react";

const FIRST_MS = 1800;
const EVERY_MS = 5000;
const RING_MS = 1300;

// آیکون «نیازمند توجه» (همان BellRing کتابخانهٔ lucide با مسیرهای یکسان، ولی تکه‌تکه تا بشود تکه‌ها را جدا تکان داد): هر ۵ ثانیه
// data-ringing را برای ۱٫۳ ثانیه روی آیکون می‌گذارد؛ زنگوله از بالا چند بار به دو طرف تاب می‌خورد (زبانه کمی دیرتر)، و موج‌های چپ و راست
// هم‌زمان با هر تاب به بیرون می‌روند و کم‌رنگ می‌شوند. استایل در globals.css است. بین دو بار هیچ انیمیشنی اجرا نمی‌شود و با «کاهش حرکت» سیستم
// اصلاً شروع نمی‌شود. SVG روی خودش overflow را باز می‌گذارد تا کنار زنگوله هنگام تاب بریده نشود
export default function AttentionBell({ className = "", ...props }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let next, stop;
    const ring = () => {
      el.setAttribute("data-ringing", "");
      stop = setTimeout(() => el.removeAttribute("data-ringing"), RING_MS + 100);
      next = setTimeout(ring, EVERY_MS);
    };
    next = setTimeout(ring, FIRST_MS);
    return () => {
      clearTimeout(next);
      clearTimeout(stop);
    };
  }, []);

  return (
    <svg
      {...props}
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`attn-bell ${className}`}
    >
      <path className="attn-wave attn-wave-l" d="M4 2C2.8 3.7 2 5.7 2 8" />
      <path className="attn-wave attn-wave-r" d="M22 8c0-2.3-.8-4.3-2-6" />
      <g className="attn-swing">
        <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
        <path className="attn-clapper" d="M10.268 21a2 2 0 0 0 3.464 0" />
      </g>
    </svg>
  );
}
