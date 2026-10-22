// مسیر: app/api/orders/[id]/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function DELETE(req, { params }) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  try {
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