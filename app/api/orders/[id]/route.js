// مسیر: app/api/orders/[id]/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function DELETE(req, { params }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token)
      return NextResponse.json({ error: "توکن موجود نیست" }, { status: 401 });

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch {
      return NextResponse.json({ error: "توکن نامعتبر" }, { status: 401 });
    }

    const orderId = parseInt((await params).id);

    // بررسی اینکه سفارش متعلق به این کاربر باشه و pending باشه
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId, status: "pending" },
      include: { OrderItems: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "سفارش یافت نشد یا قابل حذف نیست" },
        { status: 404 }
      );
    }

    // حذف آیتم‌های سفارش
    await prisma.orderItem.deleteMany({ where: { orderId } });

    // حذف خود سفارش
    await prisma.order.delete({ where: { id: orderId } });

    // حذف سبد خرید کاربر
    await prisma.cart.deleteMany({ where: { userId } });

    return NextResponse.json({ success: true, message: "سفارش و سبد خرید حذف شدند" });
  } catch (error) {
    console.error("DELETE Order Error:", error);
    return NextResponse.json({ error: "خطا در حذف سفارش" }, { status: 500 });
  }
}