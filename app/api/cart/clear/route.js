import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { userId } = body;
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "توکن الزامی است" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "توکن نامعتبر یا منقضی شده" }, { status: 401 });
    }

    if (decoded.id !== userId) {
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