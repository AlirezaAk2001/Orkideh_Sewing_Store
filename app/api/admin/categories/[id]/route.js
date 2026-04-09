// app/api/admin/categories/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// دریافت دسته‌بندی بر اساس ID
export async function GET(req, { params }) {
  try {
    const id = Number(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "شناسه معتبر نیست." },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        Product: true, // برای گرفتن محصولات مرتبط با این دسته
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
    console.error("خطا در دریافت دسته‌بندی:", error);
    return NextResponse.json(
      { error: "خطای سرور", details: error.message },
      { status: 500 }
    );
  }
}