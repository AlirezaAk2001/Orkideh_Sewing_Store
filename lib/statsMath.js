// محاسبهٔ خالص آمار داشبورد ادمین (بدون دیتابیس) تا جداگانه تست شود؛ کوئری‌ها در lib/adminStats.js هستند.
// روز بر اساس تقویم تهران حساب می‌شود، نه UTC: سفارشی که ساعت ۰۱:۰۰ بامداد تهران ثبت شده در UTC هنوز «دیروز» است.
import { tracksStock } from "@/lib/stock";

export const TZ = "Asia/Tehran";

// وضعیت‌های سفارش: pending منتظر پرداخت، processing جاری (پرداخت شده)، delivered تحویل شده، returned مرجوع.
// فروش فقط سفارش‌های پرداخت‌شده است (همان تعریف «پرفروش‌ترین‌ها» در lib/products.js)
export const STATUSES = ["pending", "processing", "delivered", "returned"];
export const PAID_STATUSES = ["processing", "delivered"];
export const RANGES = [7, 30, 90];
export const LOW_STOCK_THRESHOLD = 5;

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const wallFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

// «۲۰۲۶-۱۰-۳۰» برای لحظهٔ داده‌شده، به وقت تهران
export const dayKey = (date) => dayFmt.format(date);

// کلید n روز آخر از قدیم به جدید؛ روزها با حساب تقویمی کم می‌شوند نه با ۲۴ساعت
export function lastDayKeys(n, now = new Date()) {
  const [y, m, d] = dayKey(now).split("-").map(Number);
  const base = Date.UTC(y, m - 1, d);
  return Array.from({ length: n }, (_, i) => new Date(base - (n - 1 - i) * 86400000).toISOString().slice(0, 10));
}

// لحظهٔ (UTC) شروع یک روز تهران
export function dayStart(key) {
  const [y, m, d] = key.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d);
  const p = Object.fromEntries(wallFmt.formatToParts(new Date(guess)).map((x) => [x.type, Number(x.value)]));
  const wallAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return new Date(guess - (wallAsUtc - guess));
}

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// فروش و تعداد سفارش پرداخت‌شدهٔ هر روز؛ روز بی‌فروش هم با صفر در فهرست می‌ماند تا محور زمان بی‌سوراخ بماند
export function bucketDaily(orders, keys) {
  const map = new Map(keys.map((k) => [k, { date: k, revenue: 0, orders: 0 }]));
  for (const o of orders) {
    if (!PAID_STATUSES.includes(o.status)) continue;
    const b = map.get(dayKey(new Date(o.createdAt)));
    if (!b) continue;
    b.revenue += num(o.totalPrice);
    b.orders += 1;
  }
  return keys.map((k) => map.get(k));
}

// جمع یک بازه [from, to): فروش، تعداد سفارش پرداخت‌شده، میانگین هر سفارش و شمار هر وضعیت
export function summarize(orders, from, to) {
  const statuses = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  let revenue = 0;
  let paid = 0;
  for (const o of orders) {
    const t = new Date(o.createdAt).getTime();
    if (t < from.getTime() || t >= to.getTime()) continue;
    if (o.status in statuses) statuses[o.status] += 1;
    if (PAID_STATUSES.includes(o.status)) {
      revenue += num(o.totalPrice);
      paid += 1;
    }
  }
  return { revenue, orders: paid, aov: paid ? Math.round(revenue / paid) : 0, statuses };
}

// تغییر درصدی نسبت به دورهٔ قبل؛ null یعنی «قبلاً صفر بوده و حالا چیزی هست» (درصدش معنی ندارد)
export function pctChange(current, previous) {
  if (!previous) return current ? null : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// پرفروش‌ترین کالاها: بر اساس تعداد فروش، بعد مبلغ فروش، بعد شناسه (ترتیب ثابت)
export function topProducts(items, names, limit = 5) {
  const byId = new Map();
  for (const it of items) {
    const row = byId.get(it.productId) ?? { id: it.productId, quantity: 0, revenue: 0 };
    row.quantity += num(it.quantity);
    row.revenue += num(it.quantity) * num(it.price);
    byId.set(it.productId, row);
  }
  return [...byId.values()]
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue || a.id - b.id)
    .slice(0, limit)
    .map((r) => ({ ...r, name: names.get(r.id)?.name ?? "کالای حذف‌شده", image: names.get(r.id)?.image ?? null }));
}

// کالاهای رو به اتمام: فقط کالایی که موجودی‌اش پیگیری می‌شود (قاعدهٔ lib/stock.js)؛ ناموجودها اول می‌آیند
// products باید Category را هم داشته باشد
export function lowStockProducts(products, threshold = LOW_STOCK_THRESHOLD, limit = 8) {
  return products
    .filter((p) => tracksStock(p) && Number(p.stock) <= threshold)
    .sort((a, b) => Number(a.stock) - Number(b.stock) || String(a.name).localeCompare(String(b.name), "fa"))
    .slice(0, limit)
    .map((p) => ({ id: p.id, name: p.name, stock: Number(p.stock), image: p.image ?? null }));
}
