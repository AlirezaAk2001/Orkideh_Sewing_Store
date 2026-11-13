import crypto from "node:crypto";

/**
 * ارتباط سمت سرور با «نشان» (neshan.org): جستجوی مکان، تبدیل مختصات به آدرس و تصویر ثابت نقشه.
 * این فایل فقط در routeهای API استفاده می‌شود؛ کلید API هیچ‌وقت به مرورگر نمی‌رسد.
 *
 * محیط (.env):
 *   NESHAN_API_KEY             کلید API سرویس‌ها (جستجو، آدرس‌یابی، نقشهٔ ثابت) — فقط سمت سرور
 *   NEXT_PUBLIC_NESHAN_MAP_KEY کلید «نقشهٔ وب» برای نمایش نقشهٔ تعاملی در مرورگر (کلید عمومی؛ در پنل نشان به دامنهٔ سایت محدودش کنید)
 *   NESHAN_API_BASE            (اختیاری) آدرس پایهٔ API؛ پیش‌فرض https://api.neshan.org — برای تست با سرور ساختگی
 * بدون NESHAN_API_KEY همهٔ routeهای نقشه ۵۰۳ برمی‌گردانند و فرم آدرس بدون نقشه (دستی) کار می‌کند.
 */

const base = () => (process.env.NESHAN_API_BASE || "https://api.neshan.org").replace(/\/+$/, "");
const apiKey = () => process.env.NESHAN_API_KEY || "";

export const mapEnabled = () => Boolean(apiKey());

// اندازهٔ تصویر ثابت کارت‌های آدرس (نشان: عرض و ارتفاع ۲۰۰ تا ۲۰۴۸، بزرگ‌نمایی ۵ تا ۱۹)؛ یک اندازه برای همه تا مرورگر هر نقشه را یک بار بگیرد و نگه دارد
export const STATIC_MAP = { width: 1200, height: 360, zoom: 16 };

export class NeshanError extends Error {
  constructor(message, status = 502, code = "MAP_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const KEY_STATUSES = new Set([401, 403, 483, 484, 485]);
const LIMIT_STATUSES = new Set([429, 481, 482]);

function classify(status) {
  if (KEY_STATUSES.has(status)) return new NeshanError("کلید نشان معتبر نیست یا این سرویس برای آن فعال نشده است", 502, "MAP_KEY");
  if (LIMIT_STATUSES.has(status)) return new NeshanError("سقف درخواست سرویس نقشه پر شده است، کمی بعد دوباره تلاش کنید", 429, "MAP_LIMIT");
  return new NeshanError("سرویس نقشه پاسخ نداد", 502, "MAP_ERROR");
}

// فراخوانی JSON (جستجو و آدرس‌یابی): کلید در هدر Api-Key
export async function neshanJson(path, params) {
  const url = new URL(base() + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  let res;
  try {
    res = await fetch(url, { headers: { "Api-Key": apiKey() }, signal: AbortSignal.timeout(7000), cache: "no-store" });
  } catch {
    throw new NeshanError("ارتباط با سرویس نقشه برقرار نشد", 504, "MAP_TIMEOUT");
  }
  if (!res.ok) throw classify(res.status);
  try {
    return await res.json();
  } catch {
    throw new NeshanError("پاسخ سرویس نقشه خوانده نشد", 502, "MAP_ERROR");
  }
}

// تصویر ثابت نقشه: کلید در خود آدرس (query) است، پس این آدرس هرگز لاگ یا به کلاینت داده نمی‌شود
export async function neshanStaticImage(lat, lng) {
  const url = new URL(base() + "/v5/static");
  url.searchParams.set("key", apiKey());
  url.searchParams.set("style", "light");
  url.searchParams.set("width", String(STATIC_MAP.width));
  url.searchParams.set("height", String(STATIC_MAP.height));
  url.searchParams.set("zoom", String(STATIC_MAP.zoom));
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(9000), cache: "no-store" });
  } catch {
    throw new NeshanError("ارتباط با سرویس نقشه برقرار نشد", 504, "MAP_TIMEOUT");
  }
  const type = res.headers.get("content-type") || "";
  if (!res.ok || !type.startsWith("image/")) throw classify(res.ok ? 502 : res.status);
  return { body: await res.arrayBuffer(), type };
}

// امضای مختصات: تصویر نقشهٔ کارت‌ها با <img src> گرفته می‌شود (هدر Authorization نمی‌رود)، پس فقط آدرس‌هایی که خود سرور برای آدرس ثبت‌شدهٔ کاربر ساخته معتبرند
// و کسی نمی‌تواند با مختصات دلخواه از سهمیهٔ پولی نشان خرج کند
const coords = (lat, lng) => `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
const sign = (lat, lng) =>
  crypto
    .createHmac("sha256", `${process.env.JWT_SECRET || ""}:map-static`)
    .update(coords(lat, lng))
    .digest("hex")
    .slice(0, 32);

export function verifyCoords(lat, lng, signature) {
  if (!process.env.JWT_SECRET || typeof signature !== "string" || signature.length !== 32) return false;
  const a = Buffer.from(sign(lat, lng));
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// آدرس برای کلاینت: وقتی مختصات دارد و سرویس نقشه تنظیم است، mapUrl (تصویر واقعی کارت) هم می‌گیرد
export function withMapUrl(address) {
  if (!address) return address;
  const { lat, lng } = address;
  const ok = mapEnabled() && process.env.JWT_SECRET && Number.isFinite(lat) && Number.isFinite(lng);
  const mapUrl = ok ? `/api/map/static?lat=${Number(lat).toFixed(6)}&lng=${Number(lng).toFixed(6)}&s=${sign(lat, lng)}` : null;
  return { ...address, mapUrl };
}
