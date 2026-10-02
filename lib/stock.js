/**
 * قاعدهٔ موجودی؛ یک جا برای سبد خرید، ثبت سفارش، پرداخت و پنل ادمین.
 *
 * - stock = null: موجودی پیگیری نمی‌شود (نه کنترل می‌شود و نه کم می‌شود)
 * - stock = 0: ناموجود
 * - «لوازم جانبی» مثل قبل از کنترل موجودی معاف است
 */

// product باید Category را هم داشته باشد (include: { Category: true })
export function tracksStock(product) {
  return (
    !!product &&
    product.stock !== null &&
    product.stock !== undefined &&
    product.Category?.name !== "لوازم جانبی"
  );
}

// «ناموجود» فقط وقتی است که موجودی پیگیری شود و صفر باشد (برای نمایش در کارت و صفحهٔ محصول)
export function isSoldOut(product) {
  return tracksStock(product) && Number(product.stock) <= 0;
}

// بیشترین تعداد قابل خرید؛ بدون پیگیری موجودی محدودیتی نیست
export function maxPurchasable(product) {
  return tracksStock(product) ? Math.max(0, Number(product.stock)) : Infinity;
}

// ورودی ادمین: خالی → null (پیگیری نمی‌شود)، صفر → 0 (ناموجود)
export function parseStock(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : Math.max(0, n);
}
