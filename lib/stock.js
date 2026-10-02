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

// ورودی ادمین: خالی → null (پیگیری نمی‌شود)، صفر → 0 (ناموجود)
export function parseStock(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : Math.max(0, n);
}
