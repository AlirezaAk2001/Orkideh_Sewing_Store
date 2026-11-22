import { cache } from "react";
import prisma from "@/lib/prisma";
import { withAvatar } from "@/lib/avatar";

// کاربر نظر: نام و آواتار نمایشی (ستون‌های خام آواتار بیرون نمی‌روند). همین انتخاب در API نظرهای محصول هم استفاده می‌شود
export const commentUserSelect = { id: true, name: true, username: true, profileImageUrl: true, googleImageUrl: true };
export const withCommentAvatar = (comment) => ({ ...comment, User: withAvatar(comment.User) });

// نشان «خریدار این محصول»: verifiedBuyer فقط وقتی true است که نویسندهٔ نظر همین الان سفارش تحویل‌شده‌ای دارای این محصول داشته باشد
// (همان شرط ثبت نظر در POST /api/admin/products/[id]/comments). جدول نظرها شناسهٔ سفارش ندارد، پس برای نظرهای قدیمی هم همین‌جا از روی سفارش‌ها
// سنجیده می‌شود و ادعایی بی‌پشتوانه نمی‌ماند. با یک کوئری برای همهٔ نویسنده‌ها
export async function withVerifiedBuyers(productId, comments) {
  const userIds = [...new Set(comments.map((comment) => comment.userId))];
  if (userIds.length === 0) return comments;
  const orders = await prisma.order.findMany({
    where: { userId: { in: userIds }, status: "delivered", OrderItems: { some: { productId } } },
    select: { userId: true },
    distinct: ["userId"],
  });
  const buyers = new Set(orders.map((order) => order.userId));
  return comments.map((comment) => ({ ...comment, verifiedBuyer: buyers.has(comment.userId) }));
}

// همهٔ نظرهای تأییدشدهٔ یک محصول، جدیدترین اول؛ همان شکلی که GET /api/admin/products/[id]/comments برمی‌گرداند
// (ProductComments بعد از ثبت یا حذف نظر همچنان همان API را صدا می‌زند؛ این تابع فقط بار اول را روی سرور می‌دهد)
export const listApprovedComments = cache(async (productId) => {
  const comments = await prisma.comment.findMany({
    where: { productId, approved: true },
    orderBy: { createdAt: "desc" },
    include: {
      User: { select: commentUserSelect },
      Product: { select: { id: true, name: true } },
    },
  });
  const marked = await withVerifiedBuyers(productId, comments);
  return JSON.parse(JSON.stringify(marked.map(withCommentAvatar)));
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

// آمار نظرهای تأییدشدهٔ کل فروشگاه برای صفحهٔ اصلی (بخش خدمات و چیپ امتیاز نظرها): تعداد همهٔ نظرها و میانگین امتیاز.
// میانگین فقط از نظرهایی است که امتیاز دارند (rating پیش‌فرض ۰ یعنی بدون امتیاز)؛ بدون امتیاز، average صفر است
export const getStoreReviewStats = cache(async () => {
  const [count, rated] = await Promise.all([
    prisma.comment.count({ where: { approved: true } }),
    prisma.comment.aggregate({ where: { approved: true, rating: { gt: 0 } }, _avg: { rating: true }, _count: { _all: true } }),
  ]);
  const average = rated._count._all > 0 && rated._avg.rating != null ? Number(rated._avg.rating.toFixed(1)) : 0;
  return { count, average };
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
