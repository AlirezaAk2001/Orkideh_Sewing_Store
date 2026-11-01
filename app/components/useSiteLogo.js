import { useSyncExternalStore } from "react";
import { LOGO } from "@/lib/siteLogo";

const KEY = "siteLogo";
let cached = null; // آدرس لوگو: از بازدید قبلی (localStorage) یا بعد از اولین دریافت؛ همهٔ جاهایی که لوگو را نشان می‌دهند یک درخواست را به اشتراک می‌گذارند
let pending = null;
const listeners = new Set();

function read() {
  if (cached) return cached;
  try {
    cached = window.localStorage.getItem(KEY) || null;
  } catch {
    // localStorage بسته است (حالت خصوصی): فقط لوگوی پیش‌فرض تا رسیدن پاسخ
  }
  return cached;
}

function publish(url) {
  if (!url || url === cached) return;
  cached = url;
  try {
    window.localStorage.setItem(KEY, url);
  } catch {
    // مهم نیست؛ فقط دفعهٔ بعد دوباره از سرور می‌پرسد
  }
  listeners.forEach((listener) => listener());
}

function loadLogo() {
  pending ??= fetch("/api/background")
    .then((res) => res.json())
    .then((data) => publish(data?.data || LOGO))
    .catch(() => {});
  return pending;
}

function subscribe(listener) {
  listeners.add(listener);
  loadLogo();
  return () => listeners.delete(listener);
}

// لوگوی اصلی سایت از همان منبعی که هدر فروشگاه می‌خواند (تنظیم background_image، پیش‌فرض /image/orkideh-logo.svg). هیچ‌وقت null نیست و منتظر شبکه نمی‌ماند:
// در رندر سرور و اولین رندر کلاینت لوگوی پیش‌فرض (SVG درون صفحه) می‌آید و فوراً دیده می‌شود؛ اگر مدیر لوگوی دیگری گذاشته باشد، همان که بازدید قبلی دیده و ذخیره شده بود
// بلافاصله بعد از بالا آمدن صفحه جایش را می‌گیرد، و پاسخ تازهٔ سرور اگر فرق داشت آن را به‌روز می‌کند
export function useSiteLogo() {
  return useSyncExternalStore(subscribe, () => read() || LOGO, () => LOGO);
}
