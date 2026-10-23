/**
 * مقصد بعد از ورود (?redirect=)
 *
 * صفحهٔ ورود مقصد را از آدرس می‌خواند و در sessionStorage نگه می‌دارد تا از مسیرهای طولانی
 * (ورود با گوگل، ثبت‌نام ← تأیید ایمیل ← ورود) هم جان سالم به در ببرد.
 * فقط مسیرهای داخل همین سایت پذیرفته می‌شوند تا آدرس ورود نتواند کسی را به سایت دیگر بفرستد.
 */

const KEY = "authRedirect";
const MAX_AGE_MS = 30 * 60 * 1000;

export function safeRedirect(value) {
  if (typeof value !== "string" || value.length > 300) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  // کاراکترهای کنترلی و \ را مرورگر موقع باز کردن آدرس حذف یا تبدیل می‌کند ("/\t/evil.com" می‌شود "//evil.com")
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (code <= 31 || code === 127 || ch === "\\") return null;
  }
  try {
    if (new URL(value, "http://orkideh.invalid").origin !== "http://orkideh.invalid") return null;
  } catch {
    return null;
  }
  // برگشت به صفحهٔ ورود یا تأیید ایمیل، کاربر را در یک حلقه می‌اندازد
  if (/^\/(auth|verify)(?:[/?#]|$)/.test(value)) return null;
  return value;
}

// اگر آدرس صفحه redirect معتبر داشته باشد ذخیره‌اش می‌کند؛ در غیر این صورت مقدار قبلی دست‌نخورده می‌ماند
export function rememberRedirect() {
  try {
    const path = safeRedirect(new URLSearchParams(window.location.search).get("redirect"));
    if (path) sessionStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() }));
  } catch {
    // sessionStorage در برخی حالت‌ها (مثلاً مرورگر خصوصی) در دسترس نیست
  }
}

// مقصد ذخیره‌شده را برمی‌گرداند و پاک می‌کند؛ هر مقصد فقط یک بار و تا ۳۰ دقیقه معتبر است
export function takeRedirect() {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const { path, at } = JSON.parse(raw);
    if (!Number.isFinite(at) || Date.now() - at > MAX_AGE_MS) return null;
    return safeRedirect(path);
  } catch {
    return null;
  }
}

// آدرس صفحهٔ ورود که بعد از ورود به path برمی‌گردد
export function authUrl(path) {
  const safe = safeRedirect(path);
  return safe ? `/auth?redirect=${encodeURIComponent(safe)}` : "/auth";
}
