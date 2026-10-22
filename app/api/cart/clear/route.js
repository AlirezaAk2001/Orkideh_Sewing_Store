import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { userId } = body;

    const auth = await requireUser(req);
    if (auth.error) return auth.error;

    if (auth.user.id !== userId) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    // حذف تمام آیتم‌های سبد خرید کاربر
    await prisma.cart.deleteMany({
      where: { userId },
    });

    return NextResponse.json({ message: "سبد خرید خالی شد" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json({ error: "خطا در خالی کردن سبد خرید" }, { status: 500 });
  }
}