import { useState } from "react";

// ابزارهای مشترک انیمیشن (مرحلهٔ ۵). فقط در کامپوننت‌های کلاینتی استفاده می‌شود.

// کاربر در سیستم‌عامل «کاهش حرکت» را روشن کرده است؟ (برای انیمیشن‌هایی که با جاوااسکریپت اجرا می‌شوند؛ CSS خودش با @media همین را می‌خواند)
export function prefersReducedMotion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// مقدار behavior برای scrollTo/scrollBy/scrollIntoView: با «کاهش حرکت» اسکرول فوری است
export function scrollBehavior() {
  return prefersReducedMotion() ? "auto" : "smooth";
}

// کلیدی که هر بار مقدار عوض می‌شود یک واحد بالا می‌رود و در رندر اول صفر است؛ با key روی یک عنصر، انیمیشن آن فقط هنگام «تغییر» دوباره اجرا می‌شود
// (نه هنگام نمایش اولیهٔ صفحه). از الگوی «تنظیم state هنگام رندر» استفاده می‌کند تا effect اضافه لازم نباشد.
export function useChangeKey(value) {
  const [state, setState] = useState({ value, key: 0 });
  if (state.value !== value) setState({ value, key: state.key + 1 });
  return state.key;
}

// مثل useChangeKey ولی فقط وقتی عدد بالا برود و آماده باشد (ready) بالا می‌رود: بارگذاری اولیهٔ سبد/علاقه‌مندی‌ها و کم‌شدن عدد انیمیشن ندارند
export function useRiseKey(count, ready) {
  const [state, setState] = useState({ count, ready, key: 0 });
  if (state.count !== count || state.ready !== ready) {
    setState({ count, ready, key: state.ready && ready && count > state.count ? state.key + 1 : state.key });
  }
  return state.key;
}
