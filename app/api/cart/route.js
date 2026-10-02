import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { tracksStock } from "@/lib/stock";

// 🟢 GET: دریافت سبد خرید کاربر
export async function GET(req) {
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

  try {
    const cart = await prisma.cart.findMany({
      where: { userId },
      include: { Product: true },
    });

    return NextResponse.json(cart);
  } catch (err) {
    console.error("Error fetching cart:", err);
    return NextResponse.json(
      { error: "خطا در دریافت سبد خرید" },
      { status: 500 }
    );
  }
}

// 🟡 POST: افزودن به سبد خرید
export async function POST(req) {
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

  const { productId, quantity } = await req.json();

  if (!productId || !quantity || isNaN(quantity) || quantity < 1) {
    return NextResponse.json(
      { error: "اطلاعات ناقص یا نامعتبر است" },
      { status: 400 }
    );
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: { Category: true },
    });

    if (!product)
      return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });

    // بررسی موجودی (فقط برای محصولاتی که موجودی‌شان پیگیری می‌شود)
    if (tracksStock(product)) {
      const currentCartItem = await prisma.cart.findFirst({
        where: { userId, productId: parseInt(productId) },
      });
      const currentQuantity = currentCartItem ? currentCartItem.quantity : 0;
      if (currentQuantity + quantity > product.stock) {
        return NextResponse.json(
          { error: "تعداد درخواستی بیش از موجودی است" },
          { status: 400 }
        );
      }
    }

    // 🚀 رفع خطا: استفاده از کلید ترکیبی طبق schema
    const cartItem = await prisma.cart.upsert({
      where: {
        userId_productId: {
          userId,
          productId: parseInt(productId),
        },
      },
      update: {
        quantity: { increment: parseInt(quantity) },
      },
      create: {
        userId,
        productId: parseInt(productId),
        quantity: parseInt(quantity),
      },
      include: { Product: true },
    });

    return NextResponse.json(cartItem);
  } catch (err) {
    console.error("Error adding to cart:", err);
    return NextResponse.json(
      { error: "خطا در افزودن به سبد خرید" },
      { status: 500 }
    );
  }
}

// 🔴 DELETE: حذف از سبد خرید
export async function DELETE(req) {
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

  const { productId } = await req.json();
  if (!productId)
    return NextResponse.json({ error: "شناسه محصول لازم است" }, { status: 400 });

  try {
    await prisma.cart.delete({
      where: {
        userId_productId: {
          userId: parseInt(userId),
          productId: parseInt(productId),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error removing from cart:", err);
    return NextResponse.json(
      { error: "خطا در حذف محصول از سبد خرید" },
      { status: 500 }
    );
  }
}