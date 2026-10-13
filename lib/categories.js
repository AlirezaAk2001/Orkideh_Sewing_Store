import { cache } from "react";
import prisma from "@/lib/prisma";
import { safeDecode } from "@/lib/slug";

// داده‌ی دسته‌بندی برای صفحه‌های سمت سرور (صفحهٔ اصلی و صفحهٔ دسته).
// شکل خروجی همان پاسخ API است (GET /api/admin/categories و /api/admin/categories/by-slug/[slug])؛
// تاریخ‌ها هم مثل پاسخ JSON رشته می‌شوند. cache: متادیتا و خود صفحه در یک درخواست فقط یک بار از دیتابیس می‌خوانند.

// همهٔ دسته‌بندی‌ها؛ در دیتابیس فقط نام فایل تصویر ذخیره می‌شود و مسیر کامل را همین‌جا می‌سازیم.
// ترتیب با id ثابت است: بدون orderBy ترتیب همان ترتیب فیزیکی ردیف‌های جدول است و بعد از ویرایش یک ردیف (مثلاً کم‌شدن موجودی با هر خرید) عوض می‌شود.
export const listCategories = cache(async () => {
  const categories = await prisma.category.findMany({ orderBy: { id: "asc" } });
  return categories.map((category) => ({
    ...category,
    image: category.image ? `/image/${category.image}` : null,
  }));
});

// یک دسته با همهٔ محصولاتش (Product، به ترتیب id)؛ نبودن دسته: null
export const getCategoryBySlug = cache(async (rawSlug) => {
  const slug = safeDecode(rawSlug);
  if (!slug) return null;
  const category = await prisma.category.findUnique({ where: { slug }, include: { Product: { orderBy: { id: "asc" } } } });
  return category ? JSON.parse(JSON.stringify(category)) : null;
});
