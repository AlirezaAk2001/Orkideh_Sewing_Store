// app/api/admin/categories/by-slug/[slug]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// دریافت دسته‌بندی بر اساس Slug
export async function GET(req, { params }) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug معتبر نیست." },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        Product: true, // محصولات مرتبط با این دسته
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "دسته‌بندی یافت نشد." },
        { status: 404 }
      );
    }

    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    console.error("خطا در دریافت دسته‌بندی بر اساس slug:", error);
    return NextResponse.json(
      { error: "خطای سرور", details: error.message },
      { status: 500 }
    );
  }
}