import { useEffect } from "react";

// ساعت مشترک برقِ نوارها: هر ۶ ثانیه صفت data-bar-shine را برای مدت حرکت برق روی <html> می‌گذارد و CSS (globals.css، بخش «فهرست نوارها») در همین پنجره برق را روی
// همهٔ نوارهای دارای data-shine اجرا می‌کند؛ چون یک ساعت برای همه است، برق روی همهٔ نوارها (در هر سه کارت) دقیقاً هم‌زمان شروع و تمام می‌شود، نه پشت سر هم.
// بین دو برق هیچ انیمیشنی اجرا نمی‌شود. ساعت با اولین نوار شروع می‌شود و با رفتن آخرین نوار (مثلاً رفتن به صفحهٔ دیگر) می‌ایستد؛ با «کاهش حرکت» سیستم اصلاً شروع نمی‌شود.
// SHINE_MS باید با مدت حرکت vbar-shine در globals.css یکی باشد: ۶۰٪ از چرخهٔ ۴٫۴ ثانیه‌ای (همان سرعت برق چیپ تخفیف) = ۲٫۶۴ ثانیه؛ بعد از آن نوار تا پایان چرخه ثابت است
export const SHINE_EVERY_MS = 6000;
export const SHINE_MS = 2640;
const FIRST_MS = 2200;

let users = 0;
let next;
let stop;

function shine() {
  const root = document.documentElement;
  root.setAttribute("data-bar-shine", "");
  stop = setTimeout(() => root.removeAttribute("data-bar-shine"), SHINE_MS + 150);
  next = setTimeout(shine, SHINE_EVERY_MS);
}

export function useShineClock(enabled = true) {
  useEffect(() => {
    if (!enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (users++ === 0) next = setTimeout(shine, FIRST_MS);
    return () => {
      if (--users > 0) return;
      clearTimeout(next);
      clearTimeout(stop);
      document.documentElement.removeAttribute("data-bar-shine");
    };
  }, [enabled]);
}
