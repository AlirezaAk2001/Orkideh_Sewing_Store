import { cache } from "react";
import prisma from "@/lib/prisma";

// همهٔ نظرهای تأییدشدهٔ یک محصول، جدیدترین اول؛ همان شکلی که GET /api/admin/products/[id]/comments برمی‌گرداند
// (ProductComments بعد از ثبت یا حذف نظر همچنان همان API را صدا می‌زند؛ این تابع فقط بار اول را روی سرور می‌دهد)
export const listApprovedComments = cache(async (productId) => {
  const comments = await prisma.comment.findMany({
    where: { productId, approved: true },
    orderBy: { createdAt: "desc" },
    include: {
      User: { select: { id: true, name: true, username: true } },
      Product: { select: { id: true, name: true } },
    },
  });
  return JSON.parse(JSON.stringify(comments));
});

// آخرین نظرهای تأییدشده در کل فروشگاه، برای صفحهٔ اصلی؛ از کاربر فقط نام کوچک بیرون می‌رود (نه ایمیل و نام کاربری)
export const listLatestReviews = cache(async (take = 6) => {
  const rows = await prisma.comment.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      text: true,
      rating: true,
      createdAt: true,
      User: { select: { name: true } },
      Product: { select: { name: true, slug: true } },
    },
  });
  return JSON.parse(
    JSON.stringify(
      rows.map(({ User, ...row }) => ({ ...row, author: (User?.name || "").trim().split(/\s+/)[0] || "کاربر" }))
    )
  );
});

// میانگین امتیاز و تعداد رای چند محصول با یک کوئری (برای کارت محصول در فهرست‌ها؛ متن نظرها لازم نیست)
export const getRatingSummaries = cache(async (productIds) => {
  if (!productIds || productIds.length === 0) return {};
  const grouped = await prisma.comment.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, approved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const summaries = {};
  for (const row of grouped) {
    summaries[row.productId] = {
      averageRating: row._avg.rating != null ? Number(row._avg.rating.toFixed(1)) : 0,
      totalVotes: row._count._all,
    };
  }
  return summaries;
});
