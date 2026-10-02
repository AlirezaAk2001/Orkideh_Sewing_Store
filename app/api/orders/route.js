import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { tracksStock } from "@/lib/stock";
import { isValidPhone } from "@/lib/validation";

export async function GET(req) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "توکن موجود نیست" }, { status: 401 });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (error) {
      console.error("JWT Error:", error.message);
      return NextResponse.json({ error: "توکن نامعتبر یا منقضی شده است" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        OrderItems: {
          include: {
            Product: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                price: true,
                finalPrice: true,
              },
            },
          },
        },
        Address: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // محاسبه شماره سفارش برای این کاربر
    const ordersWithUserNumbers = orders.map((order, index) => {
      // شماره سفارش از جدیدترین به قدیمی: 1, 2, 3, ...
      const userOrderNumber = orders.length - index;
      return {
        ...order,
        userOrderNumber // اضافه کردن شماره سفارش کاربر
      };
    });

    return NextResponse.json({ orders: ordersWithUserNumbers });
  } catch (error) {
    console.error("GET Orders Error:", error.message, error.stack);
    return NextResponse.json(
      { error: "خطای داخلی سرور", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "توکن موجود نیست" }, { status: 401 });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch {
      return NextResponse.json({ error: "توکن نامعتبر" }, { status: 401 });
    }

    const { phoneNumber } = await req.json();
    if (!phoneNumber) {
      return NextResponse.json({ error: "شماره تلفن لازم است" }, { status: 400 });
    }
    if (!isValidPhone(phoneNumber)) {
      return NextResponse.json({ error: "شماره تلفن نامعتبر است" }, { status: 400 });
    }

    // بررسی وجود آدرس
    const address = await prisma.address.findFirst({
      where: { userId },
    });
    if (!address) {
      return NextResponse.json(
        { error: "لطفاً ابتدا آدرس خود را ثبت کنید", redirectTo: "/profile/addresses" },
        { status: 400 }
      );
    }

    // گرفتن آیتم‌های سبد خرید کاربر
    const cartItems = await prisma.cart.findMany({
      where: { userId },
      include: { Product: { include: { Category: true } } },
    });

    if (!cartItems.length) {
      return NextResponse.json({ error: "سبد خرید شما خالی است" }, { status: 400 });
    }

    // کنترل موجودی (فقط محصولاتی که موجودی‌شان پیگیری می‌شود)
    const short = cartItems.find(
      (item) => tracksStock(item.Product) && item.quantity > item.Product.stock
    );
    if (short) {
      return NextResponse.json(
        {
          error: `موجودی «${short.Product.name}» کافی نیست (موجودی: ${short.Product.stock})`,
          code: "OUT_OF_STOCK",
        },
        { status: 409 }
      );
    }

    // محاسبه قیمت کل
    const totalPrice = cartItems.reduce(
      (sum, item) =>
        sum + (item.Product.finalPrice ?? item.Product.price) * item.quantity,
      0
    );

    // ساخت سفارش
    const order = await prisma.order.create({
      data: {
        userId,
        addressId: address.id,
        phoneNumber,
        totalPrice,
        status: "pending",
        OrderItems: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.Product.finalPrice ?? item.Product.price,
          })),
        },
      },
      include: {
        OrderItems: {
          include: {
            Product: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
                finalPrice: true,
              },
            },
          },
        },
        Address: true,
      },
    });

    // حذف آیتم‌ها از سبد خرید پس از ثبت سفارش
    // await prisma.cart.deleteMany({ where: { userId } });

    return NextResponse.json({ 
      message: "سفارش شما با موفقیت ثبت شد", 
      order 
    });
  } catch (err) {
    console.error("POST Order Error:", err.message, err.stack);
    return NextResponse.json(
      { error: "خطا در ثبت سفارش", details: err.message },
      { status: 500 }
    );
  }
}