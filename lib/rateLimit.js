import { NextResponse } from "next/server";

/**
 * محدودکنندهٔ تعداد درخواست (rate limit) برای routeهای API (فقط سمت سرور).
 *
 *   // هر درخواست یک واحد مصرف می‌کند (ثبت‌نام، فراموشی رمز، پرداخت ...)
 *   const rl = hit(`forgot:email:${email}`, 3, 3600);   // حداکثر ۳ بار در ساعت
 *   if (rl.limited) return tooManyRequests(rl.retryAfter);
 *
 *   // فقط تلاش‌های ناموفق (رمز اشتباه، کد اشتباه): اول peek، شکست → hit، موفقیت → reset
 *   const lock = peek(key, 5);
 *   if (lock.limited) return tooManyRequests(lock.retryAfter);
 *
 * - شمارنده‌ها در حافظهٔ همین پردازش Node هستند (بدون Redis و بدون تغییر دیتابیس): با ری‌استارت سرور
 *   صفر می‌شوند و بین چند نمونهٔ سرور مشترک نیستند. برای یک سرور `next start` کافی است.
 * - IP فقط از هدرهای x-real-ip / x-forwarded-for خوانده می‌شود، یعنی پشت reverse proxy (nginx و ...)
 *   درست کار می‌کند. اگر IP مشخص نباشد محدودیت‌های مبتنی بر IP اعمال نمی‌شوند (تا کل سایت برای همه
 *   قفل نشود)؛ محدودیت‌های مبتنی بر حساب کاربری/ایمیل همچنان کار می‌کنند.
 * - خاموش‌کردن اضطراری یا برای تست: RATE_LIMIT_DISABLED=true
 */

const MAX_KEYS = 20000; // سقف حافظه؛ بیشتر از آن قدیمی‌ترین کلیدها حذف می‌شوند
const SWEEP_EVERY_MS = 5 * 60 * 1000;

// روی globalThis تا با HMR در حالت توسعه صفر نشود
const state = (globalThis.__orkidehRateLimit ??= { buckets: new Map(), lastSweep: Date.now() });
const { buckets } = state;

const isDisabled = () => ["1", "true"].includes(String(process.env.RATE_LIMIT_DISABLED || "").toLowerCase());
const secondsLeft = (bucket, now) => Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

function sweep(now) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  state.lastSweep = now;
}

function evictOldest() {
  let n = Math.ceil(MAX_KEYS / 10);
  for (const key of buckets.keys()) {
    buckets.delete(key);
    if (--n <= 0) break;
  }
}

function liveBucket(key, now) {
  const bucket = buckets.get(key);
  if (!bucket) return null;
  if (bucket.resetAt > now) return bucket;
  buckets.delete(key);
  return null;
}

// یک واحد مصرف می‌کند؛ limited = این درخواست بیش از `limit` بار در `windowSec` ثانیه است
export function hit(key, limit, windowSec) {
  if (isDisabled()) return { limited: false, retryAfter: 0 };

  const now = Date.now();
  if (now - state.lastSweep > SWEEP_EVERY_MS) sweep(now);

  let bucket = liveBucket(key, now);
  if (!bucket) {
    if (buckets.size >= MAX_KEYS) {
      sweep(now);
      if (buckets.size >= MAX_KEYS) evictOldest();
    }
    bucket = { count: 0, resetAt: now + windowSec * 1000 };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return { limited: bucket.count > limit, retryAfter: secondsLeft(bucket, now) };
}

// بدون مصرف واحد: آیا قبلاً `limit` بار شمرده شده است؟ (برای شمردن فقط تلاش‌های ناموفق)
export function peek(key, limit) {
  if (isDisabled()) return { limited: false, retryAfter: 0 };

  const now = Date.now();
  const bucket = liveBucket(key, now);
  if (bucket && bucket.count >= limit) return { limited: true, retryAfter: secondsLeft(bucket, now) };
  return { limited: false, retryAfter: 0 };
}

export function reset(key) {
  buckets.delete(key);
}

let warnedNoIp = false;

// پشت reverse proxy آخرین مقدار x-forwarded-for همان IP است که proxy دیده (مقادیر قبلی را کلاینت می‌تواند جعل کند)
export function clientIp(req) {
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }

  if (!warnedNoIp && process.env.NODE_ENV === "production") {
    warnedNoIp = true;
    console.warn("IP کلاینت از هدرهای x-real-ip / x-forwarded-for مشخص نیست؛ محدودیت‌های مبتنی بر IP اعمال نمی‌شوند.");
  }
  return null;
}

// محدودیت مبتنی بر IP؛ اگر IP مشخص نباشد اعمال نمی‌شود. در صورت عبور از سقف شیء { retryAfter } برمی‌گرداند
export function limitByIp(req, name, limit, windowSec) {
  const ip = clientIp(req);
  if (!ip) return null;
  const rl = hit(`${name}:ip:${ip}`, limit, windowSec);
  return rl.limited ? rl : null;
}

const faDigits = (n) => n.toLocaleString("fa-IR");

function waitText(seconds) {
  if (seconds < 60) return `${faDigits(seconds)} ثانیه`;
  if (seconds < 3600) return `${faDigits(Math.ceil(seconds / 60))} دقیقه`;
  return `${faDigits(Math.ceil(seconds / 3600))} ساعت`;
}

export function tooManyRequests(retryAfter, message = "تعداد درخواست‌ها بیش از حد مجاز است.") {
  return NextResponse.json(
    { error: `${message} لطفاً ${waitText(retryAfter)} دیگر دوباره تلاش کنید.`, retryAfter },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
