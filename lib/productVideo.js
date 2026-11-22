// ویدیوی محصول (هم سمت سرور و هم مرورگر): هر محصول حداکثر یک ویدیوی کوتاه دارد که ادمین آپلود می‌کند و در ستون Product.video به‌شکل مسیر /uploads/<نام> می‌ماند.
// فقط فایل آپلودشده پذیرفته می‌شود (نه آدرس بیرونی)، تا هر ویدیو از همین سرور و با همان قاعدهٔ کنترل‌شدهٔ lib/uploads.js سرو شود.
import { UPLOADS_PREFIX } from "@/lib/productImages";

export const MAX_VIDEO_BYTES = 30 * 1024 * 1024; // ویدیوی کوتاه: یک کلیپ چندثانیه‌ای گوشی معمولاً زیر این سقف است
export const VIDEO_TYPES = ["video/mp4", "video/webm"];
export const VIDEO_EXT = /\.(mp4|webm)$/i;

// همان الگوی نام فایل ذخیره‌شده در lib/uploads.js برای ویدیو
const VIDEO_REF = /^\/uploads\/[a-z0-9]{6,12}-[a-f0-9]{16}\.(mp4|webm)$/;

// آیا این مقدار مسیر یک ویدیوی آپلودشدهٔ معتبر است؟
export function isVideoRef(value) {
  return typeof value === "string" && value.startsWith(UPLOADS_PREFIX) && VIDEO_REF.test(value);
}

// ویدیوی ارسالی ادمین: undefined = فرستاده نشده (دست نمی‌زنیم)، null = پاک‌کردن ("" یا null)، رشتهٔ معتبر = همان، false = نامعتبر
export function parseVideoRef(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return isVideoRef(value) ? value : false;
}
