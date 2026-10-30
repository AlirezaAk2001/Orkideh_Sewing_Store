// آمار ساختگی داشبورد فقط برای دیدن شکل نمودارها (جزء حالت نمونهٔ lib/demoFlag.js). هیچ‌جا ذخیره نمی‌شود و به دیتابیس دست نمی‌زند؛
// شمارش بخش‌ها (totals) را از بیرون می‌گیرد تا کارت‌های مدیریت عدد واقعی نشان بدهند.
// هر عدد فقط به تاریخ روز و یک دانه ثابت بستگی دارد: با رفرش، یا با عوض‌کردن بازه، نمودار نمی‌پرد و روز مشخص همیشه همان مقدار را دارد.
import { LOW_STOCK_THRESHOLD, lastDayKeys, pctChange } from "@/lib/statsMath";

const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// ضریب شلوغی هفته (یکشنبه..شنبه): شنبه اولین روز کاری و شلوغ‌ترین، پنجشنبه نیمه‌کاری، جمعه تعطیل
const WEEK = [1, 1.05, 1.1, 1.15, 0.75, 0.35, 1.25];

function dayData(key) {
  const r = rng(hash(`demo:${key}`));
  const dow = new Date(`${key}T12:00:00Z`).getUTCDay();
  const index = Math.floor(Date.parse(key) / 86400000);
  const trend = 1 + 0.28 * Math.sin(index / 16) + 0.12 * Math.sin(index / 5.5);
  const spike = r() < 0.07 ? 1.9 : 1; // روز کمپین
  const lull = r() < 0.05 ? 0 : 1; // روز بدون فروش
  const orders = Math.max(0, Math.round(3.4 * WEEK[dow] * trend * spike * lull + (r() - 0.5) * 2.6));
  let revenue = 0;
  for (let i = 0; i < orders; i++) revenue += Math.round((1_400_000 + r() * 11_000_000) / 10_000) * 10_000;
  return { date: key, orders, revenue };
}

const PRODUCTS = [
  { name: "چرخ خیاطی برادر VX-2080", price: 14_200_000 },
  { name: "چرخ خیاطی ژانومه ۶۲۵", price: 12_500_000 },
  { name: "چرخ خیاطی برنینا ۸۴۰", price: 21_800_000 },
  { name: "چرخ خیاطی جگوار ۷۵۰ سوپر", price: 8_200_000 },
  { name: "سردوز یوشیتا ۷۵۵", price: 9_600_000 },
  { name: "چرخ خیاطی کاچیران نیولایف ۵۷۰۰", price: 7_400_000 },
  { name: "چرخ خیاطی نیمه صنعتی رفری ۴۲۷", price: 16_900_000 },
  { name: "پدال دینامیکی", price: 450_000 },
];
const TOP_SHARES = [0.24, 0.19, 0.15, 0.12, 0.09];
const LOW = [
  { name: "چرخ خیاطی برادر VX-2080", stock: 0 },
  { name: "چرخ خیاطی برنینا ۸۴۰", stock: 1 },
  { name: "سردوز یوشیتا ۷۵۵", stock: 2 },
  { name: "چرخ خیاطی جگوار ۷۵۰ سوپر", stock: 2 },
  { name: "چرخ خیاطی ژانومه ۶۲۵", stock: 3 },
  { name: "پدال دینامیکی", stock: 4 },
];

const sum = (rows, k) => rows.reduce((a, d) => a + d[k], 0);

export function getDemoStats(days = 30, totals, now = new Date()) {
  const keys = lastDayKeys(days, now);
  const prevKeys = lastDayKeys(days * 2, now).slice(0, days);
  const daily = keys.map(dayData);
  const prev = prevKeys.map(dayData);

  const paid = sum(daily, "orders");
  const revenue = sum(daily, "revenue");
  const prevPaid = sum(prev, "orders");
  const prevRevenue = sum(prev, "revenue");
  const aov = paid ? Math.round(revenue / paid) : 0;
  const prevAov = prevPaid ? Math.round(prevRevenue / prevPaid) : 0;
  const customers = Math.round(days * 0.38) + (hash(`c:${keys[0]}`) % 4);
  const prevCustomers = Math.round(days * 0.31) + (hash(`c:${prevKeys[0]}`) % 4);

  const delivered = Math.round(paid * 0.72);
  const statuses = {
    pending: Math.round(paid * 0.2),
    processing: paid - delivered,
    delivered,
    returned: Math.round(paid * 0.06),
  };

  const r = rng(hash(`top:${keys[0]}`));
  const topProducts = TOP_SHARES.map((share, i) => {
    const p = PRODUCTS[i];
    const quantity = Math.max(1, Math.round(paid * share * (0.85 + r() * 0.3)));
    return { id: null, name: p.name, quantity, revenue: quantity * p.price };
  }).sort((a, b) => b.quantity - a.quantity);

  return {
    demo: true,
    generatedAt: now.toISOString(),
    days,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
    totals,
    attention: { processingOrders: Math.max(1, Math.round(paid * 0.18)), pendingComments: 4, soldOut: 1 },
    kpis: {
      revenue: { value: revenue, previous: prevRevenue, change: pctChange(revenue, prevRevenue) },
      orders: { value: paid, previous: prevPaid, change: pctChange(paid, prevPaid) },
      aov: { value: aov, previous: prevAov, change: pctChange(aov, prevAov) },
      customers: { value: customers, previous: prevCustomers, change: pctChange(customers, prevCustomers) },
    },
    daily,
    statuses,
    topProducts,
    lowStock: LOW.map((p) => ({ id: null, name: p.name, stock: p.stock })),
  };
}
