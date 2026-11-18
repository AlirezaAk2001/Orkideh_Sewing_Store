"use client";

// فراخوانی routeهای نقشهٔ خود سایت (/api/map/*) از مرورگر. کلید API نشان فقط سمت سرور است؛ اینجا فقط توکن کاربر می‌رود.
// کلید «نقشهٔ وب» (NEXT_PUBLIC_NESHAN_MAP_KEY) عمومی است و هنگام ساخت (build) در کد می‌نشیند؛ بدون آن فرم آدرس بدون نقشه (دستی) کار می‌کند
export const MAP_KEY = process.env.NEXT_PUBLIC_NESHAN_MAP_KEY || "";

// استایل و متن‌های فارسی نقشهٔ نشان؛ مشترک بین انتخاب موقعیت فرم آدرس (MapPicker) و نقشهٔ فروشگاه در صفحهٔ «درباره فروشگاه» (app/about/StoreMap.jsx)
export const MAP_STYLE_URL = "https://static.neshan.org/sdk/maplibre/styles/light.json";
export const MAP_LOCALE = {
  "CooperativeGesturesHandler.WindowsHelpText": "برای بزرگ‌نمایی کلید Ctrl را نگه دارید و اسکرول کنید",
  "CooperativeGesturesHandler.MacHelpText": "برای بزرگ‌نمایی کلید ⌘ را نگه دارید و اسکرول کنید",
  "CooperativeGesturesHandler.MobileHelpText": "برای حرکت روی نقشه از دو انگشت استفاده کنید",
  "NavigationControl.ZoomIn": "بزرگ‌نمایی",
  "NavigationControl.ZoomOut": "کوچک‌نمایی",
};

// خطاهای فنی (کلید، تنظیم‌نشدن، قطعی) را به کاربر نشان نمی‌دهیم؛ فقط «فعلاً در دسترس نیست». پیام سقف درخواست و ورودی نامعتبر برای کاربر مفید است
const UNAVAILABLE = "سرویس نقشه فعلاً در دسترس نیست؛ آدرس را دستی وارد کنید.";

export class MapError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

async function mapGet(path, params) {
  const token = localStorage.getItem("token");
  if (!token) throw new MapError("لطفاً دوباره وارد شوید.", "AUTH");
  let res;
  try {
    res = await fetch(`/api/map/${path}?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new MapError("اتصال برقرار نشد، اینترنت خود را بررسی کنید.", "NETWORK");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const showable = res.status === 429 || res.status === 400 || res.status === 401;
    throw new MapError(showable && data.error ? data.error : UNAVAILABLE, data.code || `HTTP_${res.status}`);
  }
  return data;
}

// [{ title, address, region, neighbourhood, lat, lng }] نزدیک (lat, lng)
export async function searchPlaces(term, lat, lng) {
  const data = await mapGet("search", { term, lat, lng });
  return Array.isArray(data.items) ? data.items : [];
}

// { address, city, neighbourhood }؛ address خالی = برای این نقطه آدرسی نیست
export const reverseGeocode = (lat, lng) => mapGet("reverse", { lat, lng });
