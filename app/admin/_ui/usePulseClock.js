import { useEffect } from "react";

// ساعت مشترک ضربان‌های دوره‌ای داشبورد (حلقهٔ نشانگر اوج نمودار فروش، حلقهٔ چیپ «ناموجود»): هر ۲٫۴ ثانیه صفت data-pulse را برای مدت یک ضربان روی <html> می‌گذارد و
// CSS (globals.css، «ضربان دوره‌ای») در همین پنجره حلقه را یک‌بار می‌زند؛ چون یک ساعت برای همه است، ضربان‌ها هم‌زمان‌اند. بین دو ضربان هیچ انیمیشنی اجرا نمی‌شود (پردازنده
// بیکار می‌ماند؛ این حلقه‌ها SVG یا سایه‌اند و تا وقتی انیمیشن «فعال» است هر فریم رسم می‌شوند). ساعت با اولین مصرف‌کننده شروع می‌شود و با رفتن آخرین مصرف‌کننده می‌ایستد؛ با
// «کاهش حرکت» سیستم اصلاً شروع نمی‌شود. PULSE_MS باید با مدت dash-ping / chip-ripple در globals.css یکی باشد
export const PULSE_EVERY_MS = 2400;
export const PULSE_MS = 1600;
const FIRST_MS = 1600;

let users = 0;
let next;
let stop;

function pulse() {
  const root = document.documentElement;
  root.setAttribute("data-pulse", "");
  stop = setTimeout(() => root.removeAttribute("data-pulse"), PULSE_MS + 150);
  next = setTimeout(pulse, PULSE_EVERY_MS);
}

export function usePulseClock(enabled = true) {
  useEffect(() => {
    if (!enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (users++ === 0) next = setTimeout(pulse, FIRST_MS);
    return () => {
      if (--users > 0) return;
      clearTimeout(next);
      clearTimeout(stop);
      document.documentElement.removeAttribute("data-pulse");
    };
  }, [enabled]);
}
