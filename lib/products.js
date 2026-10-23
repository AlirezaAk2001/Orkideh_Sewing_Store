import { cache } from "react";
import prisma from "@/lib/prisma";
import { toLatinSlug, safeDecode } from "@/lib/slug";
import { getRatingSummaries } from "@/lib/comments";

// داده‌ی محصول برای صفحه‌های سمت سرور (فهرست محصولات و صفحهٔ محصول).
// شکل خروجی همان پاسخ GET /api/admin/products است تا ProductCard و ProductDetails فرقی حس نکنند؛
// تاریخ‌ها هم مثل پاسخ JSON رشته می‌شوند. cache: متادیتا و خود صفحه در یک درخواست فقط یک بار از دیتابیس می‌خوانند.
// یک تفاوت عمدی با API: listProducts میانگین امتیاز و تعداد رای را هم اضافه می‌کند (API این‌ها را نداشت و ProductCard
// همیشه خالی می‌ماند چون محصول‌ها اصلاً comments نمی‌گرفتند).

const withCategory = { Category: { select: { id: true, name: true, slug: true } } };

export function shapeProduct(product) {
  return {
    ...product,
    categoryName: product.Category?.name || null,
    categoryId: product.categoryId || null,
    Category: product.Category || null,
    discount: product.discount != null ? product.discount : null,
    finalPrice:
      product.finalPrice != null
        ? parseFloat(product.finalPrice)
        : product.discount != null
        ? parseFloat(product.price * (1 - product.discount / 100))
        : parseFloat(product.price),
    image: product.image ? product.image.replace(/\/$/, "") : null,
    weight: product.weight || null,
    voltage: product.voltage || null,
    powerConsumption: product.powerConsumption || null,
    material: product.material || null,
    size: product.size || null,
    color: product.color || null,
    suitableFor: product.suitableFor || null,
    additionalFeatures: product.additionalFeatures || null,
  };
}

// همهٔ محصولات، جدیدترین اول؛ هر کدام با averageRating/totalVotes (بر اساس نظرهای تأییدشده)
export const listProducts = cache(async () => {
  const products = await prisma.product.findMany({ orderBy: { id: "desc" }, include: withCategory });
  const ratings = await getRatingSummaries(products.map((p) => p.id));
  return JSON.parse(
    JSON.stringify(
      products.map((p) => ({
        ...shapeProduct(p),
        averageRating: ratings[p.id]?.averageRating ?? 0,
        totalVotes: ratings[p.id]?.totalVotes ?? 0,
      }))
    )
  );
});

// ردیف‌های محصول صفحهٔ اصلی: جدیدترین، دارای تخفیف (بیشترین تخفیف اول) و پرفروش‌ترین.
// پرفروش فقط از سفارش‌های پرداخت‌شده حساب می‌شود («pending» پرداخت‌نشده و «returned» مرجوعی حساب نمی‌شود)؛ بدون فروش، آن ردیف خالی می‌ماند.
// هر ردیف کوتاه است (RAIL_SIZE تا) تا صفحهٔ اصلی همهٔ محصولات را نخواند.
const RAIL_SIZE = 10;
const PAID_STATUSES = ["processing", "delivered"];

export const listHomeRails = cache(async () => {
  const [newest, discounted, sales] = await Promise.all([
    prisma.product.findMany({ orderBy: { id: "desc" }, take: RAIL_SIZE, include: withCategory }),
    prisma.product.findMany({
      where: { discount: { gt: 0 } },
      orderBy: [{ discount: "desc" }, { id: "desc" }],
      take: RAIL_SIZE,
      include: withCategory,
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { Order: { status: { in: PAID_STATUSES } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: RAIL_SIZE,
    }),
  ]);

  const soldIds = sales.map((row) => row.productId);
  const soldProducts = soldIds.length
    ? await prisma.product.findMany({ where: { id: { in: soldIds } }, include: withCategory })
    : [];
  const soldById = new Map(soldProducts.map((p) => [p.id, p]));
  const bestSellers = soldIds.map((id) => soldById.get(id)).filter(Boolean);

  const ratings = await getRatingSummaries([...new Set([...newest, ...discounted, ...bestSellers].map((p) => p.id))]);
  const shape = (p) => ({
    ...shapeProduct(p),
    averageRating: ratings[p.id]?.averageRating ?? 0,
    totalVotes: ratings[p.id]?.totalVotes ?? 0,
  });

  return JSON.parse(
    JSON.stringify({ newest: newest.map(shape), discounted: discounted.map(shape), bestSellers: bestSellers.map(shape) })
  );
});

// محصول با slug؛ همان قاعدهٔ /api/admin/products/by-slug (slug فارسی یا بزرگ‌حروف به شکل لاتین درمی‌آید). نبودن محصول: null
export const getProductBySlug = cache(async (rawSlug) => {
  const slug = toLatinSlug(safeDecode(rawSlug));
  if (!slug) return null;
  const product = await prisma.product.findFirst({ where: { slug }, include: withCategory });
  return product ? JSON.parse(JSON.stringify(shapeProduct(product))) : null;
});
