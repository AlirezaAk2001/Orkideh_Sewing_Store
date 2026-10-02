import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req) {
  try {
    // نقش ادمین از دیتابیس خوانده می‌شود، نه از ادعای داخل توکن
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const orders = await prisma.order.findMany({
  // where رو کامل حذف کن
  include: {
    User: { select: { username: true, id: true } },
    Address: { select: { address: true, postalCode: true } },
    OrderItems: {
      include: {
        Product: { select: { name: true, price: true, finalPrice: true } },
      },
    },
  },
  orderBy: { createdAt: "desc" },
});

    // محاسبه شماره سفارش برای هر کاربر
    const userOrdersMap = {};
    
    // ابتدا تمام سفارش‌های هر کاربر را گروه‌بندی می‌کنیم
    orders.forEach(order => {
      if (!userOrdersMap[order.User.id]) {
        userOrdersMap[order.User.id] = [];
      }
      userOrdersMap[order.User.id].push(order);
    });

    // برای هر کاربر، سفارش‌هایش را بر اساس تاریخ مرتب می‌کنیم
    Object.keys(userOrdersMap).forEach(userId => {
      userOrdersMap[userId].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });

    // اضافه کردن شماره سفارش برای هر سفارش
    const ordersWithUserNumbers = orders.map(order => {
      const userOrders = userOrdersMap[order.User.id] || [];
      const userOrderIndex = userOrders.findIndex(o => o.id === order.id);
      const userOrderNumber = userOrderIndex !== -1 ? userOrders.length - userOrderIndex : 1;
      
      return {
        ...order,
        userOrderNumber
      };
    });

    return NextResponse.json({ orders: ordersWithUserNumbers });
  } catch (error) {
    console.error("Error fetching orders:", { message: error.message, stack: error.stack });
    return NextResponse.json({ error: "خطا در دریافت سفارش‌ها: " + error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    // نقش ادمین از دیتابیس خوانده می‌شود، نه از ادعای داخل توکن
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const { orderId, status } = await req.json();
    if (!orderId || !status || !["processing", "delivered", "returned"].includes(status)) {
      return NextResponse.json({ error: "شناسه سفارش یا وضعیت نامعتبر است" }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        User: { select: { username: true, id: true } },
        Address: { select: { address: true, postalCode: true } },
        OrderItems: {
          include: {
            Product: { select: { name: true, price: true, finalPrice: true } },
          },
        },
      },
    });

    // برای نمایش شماره سفارش کاربر در پاسخ
    const userOrders = await prisma.order.findMany({
      where: { userId: order.userId },
      orderBy: { createdAt: "desc" },
    });
    
    const userOrderIndex = userOrders.findIndex(o => o.id === order.id);
    const userOrderNumber = userOrderIndex !== -1 ? userOrders.length - userOrderIndex : 1;
    
    const orderWithUserNumber = {
      ...order,
      userOrderNumber
    };

    return NextResponse.json({ order: orderWithUserNumber });
  } catch (error) {
    console.error("Error updating order status:", { message: error.message, stack: error.stack });
    return NextResponse.json({ error: "خطا در به‌روزرسانی وضعیت سفارش: " + error.message }, { status: 500 });
  }
}