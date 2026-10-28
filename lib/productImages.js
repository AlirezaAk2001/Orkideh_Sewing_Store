// فهرست تصویرهای محصول (هم سمت سرور و هم مرورگر): image تصویر اصلی (کاور: کارت‌ها، سبد، پیش‌نمایش لینک) و images بقیهٔ گالری به ترتیب نمایش است.
// مقدار هر تصویر یکی از این‌هاست: نام فایل داخل public/image (z.png)، مسیر کامل (/image/z.png)، فایل آپلودشده (/uploads/…) یا آدرس بیرونی (https://…).

export const MAX_PRODUCT_IMAGES = 10; // کاور + گالری
export const UPLOADS_PREFIX = "/uploads/";
export const MAX_IMAGE_REF_LENGTH = 500;

const clean = (value) => (typeof value === "string" ? value.trim().replace(/\/+$/, "") : "");

// [کاور، ...گالری] بدون مقدار خالی و تکراری
export function productImages(product) {
  const list = [product?.image, ...(Array.isArray(product?.images) ? product.images : [])];
  const seen = new Set();
  return list.map(clean).filter((src) => src && !seen.has(src) && seen.add(src));
}

// آیا این مقدار می‌تواند آدرس تصویر باشد؟ data:/blob:/javascript:، مسیر بالا رفتن (..) و نویسهٔ کنترلی پذیرفته نمی‌شود
export function isAcceptableImageRef(value) {
  if (typeof value !== "string" || !value || value.length > MAX_IMAGE_REF_LENGTH) return false;
  if (/[\u0000-\u001f\u007f\\]/.test(value) || value.includes("..")) return false;
  return !/^(data|blob|javascript|file|vbscript):/i.test(value.trim());
}

// آرایهٔ images که ادمین فرستاده: undefined = فرستاده نشده (دست نمی‌زنیم)، null = نامعتبر، وگرنه آرایهٔ پاک‌شده و بدون تکراری.
// کاور (image) هم از گالری برداشته می‌شود تا یک تصویر دوبار نیاید.
export function parseImageList(value, cover) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return null;
  const coverRef = clean(cover);
  const out = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    const src = clean(item);
    if (!src) continue;
    if (!isAcceptableImageRef(src)) return null;
    if (src !== coverRef && !out.includes(src)) out.push(src);
  }
  return out;
}
