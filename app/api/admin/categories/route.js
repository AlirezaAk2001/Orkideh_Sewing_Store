import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * 📘 GET /api/admin/categories
 * دریافت لیست همه دسته‌بندی‌ها
 */

export async function GET() {
  try {
    const categories = await prisma.category.findMany();

    // مسیر تصویر را اصلاح کن
    const updated = categories.map((cat) => ({
      ...cat,
      image: cat.image ? `/image/${cat.image}` : null,
    }));

    return NextResponse.json(updated);
  } catch (error) {
    console.error("خطا در دریافت دسته‌بندی‌ها:", error);
    return NextResponse.json({ error: "مشکلی پیش آمد" }, { status: 500 });
  }
  }

/**
 * 📦 POST /api/admin/categories
 * ایجاد یک دسته‌بندی جدید
 */
export async function POST(req) {
  try {
    const { name, slug, image } = await req.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "نام و slug الزامی است." },
        { status: 400 }
      );
    }

    const existingCategory = await prisma.category.findFirst({
      where: { OR: [{ name }, { slug }] },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "دسته‌ای با این نام یا slug از قبل وجود دارد." },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        image: image || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("خطا در ایجاد دسته‌بندی:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد دسته‌بندی", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * ✏️ PUT /api/admin/categories
 * ویرایش دسته‌بندی موجود
 */
export async function PUT(req) {
  try {
    const { id, name, slug, image } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "شناسه دسته‌بندی الزامی است." },
        { status: 400 }
      );
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "دسته‌بندی یافت نشد." },
        { status: 404 }
      );
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        slug: slug ?? existing.slug,
        image: image ?? existing.image,
      },
    });

    return NextResponse.json(updatedCategory, { status: 200 });
  } catch (error) {
    console.error("خطا در ویرایش دسته‌بندی:", error);
    return NextResponse.json(
      { error: "خطا در ویرایش دسته‌بندی", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * ❌ DELETE /api/admin/categories
 * حذف دسته‌بندی بر اساس id
 */
export async function DELETE(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "شناسه دسته‌بندی الزامی است." },
        { status: 400 }
      );
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "دسته‌بندی یافت نشد." },
        { status: 404 }
      );
    }

    const hasProducts = await prisma.product.findFirst({
      where: { categoryId: id },
    });

    if (hasProducts) {
      return NextResponse.json(
        { error: "ابتدا محصولات مرتبط با این دسته را حذف یا منتقل کنید." },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json(
      { message: "دسته‌بندی با موفقیت حذف شد." },
      { status: 200 }
    );
  } catch (error) {
    console.error("خطا در حذف دسته‌بندی:", error);
    return NextResponse.json(
      { error: "خطا در حذف دسته‌بندی", details: error.message },
      { status: 500 }
    );
  }
}