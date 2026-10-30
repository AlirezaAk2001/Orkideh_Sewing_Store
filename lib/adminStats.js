// آمار داشبورد ادمین: یک بار کوئری، همهٔ عددها آمادهٔ نمایش (فقط سرور). محاسبهٔ خالص در lib/statsMath.js است.
import prisma from "@/lib/prisma";
import {
  AOV_WINDOW,
  LOW_STOCK_THRESHOLD,
  PAID_STATUSES,
  bucketCustomers,
  bucketDaily,
  dayStart,
  lastDayKeys,
  lowStockProducts,
  pctChange,
  summarize,
  topProducts,
  trailingAov,
} from "@/lib/statsMath";

// شمارش بخش‌ها برای کارت‌های مدیریت (حالت نمونه هم همین‌ها را واقعی نشان می‌دهد)
export async function getTotals() {
  const [banners, categories, products, comments, orders] = await Promise.all([
    prisma.banner.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.comment.count(),
    prisma.order.count(),
  ]);
  return { banners, categories, products, comments, orders };
}

export async function getAdminStats(days = 30, now = new Date()) {
  // دو پنجرهٔ پشت‌سرهم: دورهٔ جاری و دورهٔ قبل با همان طول (برای «نسبت به دورهٔ قبل»)
  const keys = lastDayKeys(days, now);
  const extKeys = lastDayKeys(days + AOV_WINDOW - 1, now); // + پیش‌نشینی برای میانگین ۷روزهٔ همان روزهای اول (سفارش‌ها از ابتدای دورهٔ قبل می‌آیند و دست‌کم ۷ روز آن‌سوترند)
  const prevKeys = lastDayKeys(days * 2, now).slice(0, days);
  const currentStart = dayStart(keys[0]);
  const previousStart = dayStart(prevKeys[0]);
  const end = new Date(now.getTime() + 1);

  const [
    orders,
    items,
    newCustomers,
    customersBefore,
    banners,
    categories,
    products,
    comments,
    pendingComments,
    allOrders,
    processingOrders,
    stockCandidates,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: previousStart } },
      select: { createdAt: true, totalPrice: true, status: true },
    }),
    prisma.orderItem.findMany({
      where: { Order: { status: { in: PAID_STATUSES }, createdAt: { gte: currentStart } } },
      select: { productId: true, quantity: true, price: true },
    }),
    prisma.user.findMany({ where: { is_admin: false, is_verified: true, created_at: { gte: currentStart } }, select: { created_at: true } }),
    prisma.user.count({ where: { is_admin: false, is_verified: true, created_at: { gte: previousStart, lt: currentStart } } }),
    prisma.banner.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.comment.count(),
    prisma.comment.count({ where: { approved: false } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "processing" } }),
    prisma.product.findMany({
      where: { stock: { not: null, lte: LOW_STOCK_THRESHOLD } },
      select: { id: true, name: true, stock: true, image: true, Category: { select: { name: true } } },
    }),
  ]);

  const customersNow = newCustomers.length;
  const ext = bucketDaily(orders, extKeys);
  const customersByDay = bucketCustomers(newCustomers.map((u) => u.created_at), keys);
  const aovByDay = trailingAov(ext);
  const daily = ext.slice(AOV_WINDOW - 1).map((d, i) => ({ ...d, customers: customersByDay[i], aov: aovByDay[i] }));

  const current = summarize(orders, currentStart, end);
  const previous = summarize(orders, previousStart, currentStart);

  const sold = topProducts(items, new Map(), 5);
  const names = new Map(
    (await prisma.product.findMany({ where: { id: { in: sold.map((s) => s.id) } }, select: { id: true, name: true, image: true } })).map((p) => [p.id, p])
  );
  const top = topProducts(items, names, 5);

  const lowStock = lowStockProducts(stockCandidates, LOW_STOCK_THRESHOLD, 8);
  const soldOut = lowStockProducts(stockCandidates, 0, 1000).length;

  return {
    generatedAt: now.toISOString(),
    days,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
    totals: { banners, categories, products, comments, orders: allOrders },
    attention: { processingOrders, pendingComments, soldOut },
    kpis: {
      revenue: { value: current.revenue, previous: previous.revenue, change: pctChange(current.revenue, previous.revenue) },
      orders: { value: current.orders, previous: previous.orders, change: pctChange(current.orders, previous.orders) },
      aov: { value: current.aov, previous: previous.aov, change: pctChange(current.aov, previous.aov) },
      customers: { value: customersNow, previous: customersBefore, change: pctChange(customersNow, customersBefore) },
    },
    daily,
    statuses: current.statuses,
    topProducts: top.map(({ id, name, quantity, revenue }) => ({ id, name, quantity, revenue })),
    lowStock,
  };
}
