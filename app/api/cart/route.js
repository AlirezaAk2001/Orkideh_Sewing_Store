import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { tracksStock } from "@/lib/stock";

// 🟢 GET: دریافت سبد خرید کاربر
export async function GET(req) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  try {
    // Category لازم است تا قاعدهٔ موجودی («لوازم جانبی» معاف است) سمت کلاینت درست اعمال شود
    // ترتیب ثابت: بدون orderBy بعد از هر UPDATE (مثل تغییر تعداد) ردیف به‌روزشده در خروجی جابه‌جا می‌شد
    const cart = await prisma.cart.findMany({
      where: { userId },
      orderBy: { id: "asc" },
      include: { Product: { include: { Category: true } } },
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
  const auth = await requireUser(req);
  if (auth.error) return auth.error;
  const userId = auth.user.id;

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
      include: { Product: { include: { Category: true } } },
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

// 🔵 PATCH: تعیین تعداد یک محصول سبد (مقدار مطلق، برای گام‌شمار صفحهٔ سبد؛ POST فقط اضافه می‌کند)
const MAX_CART_QUANTITY = 999;

export async function PATCH(req) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;
  const userId = auth.user.id;

  const { productId, quantity } = await req.json().catch(() => ({}));
  const pid = Number(productId);
  const qty = Number(quantity);
  if (!Number.isInteger(pid) || !Number.isInteger(qty) || qty < 1 || qty > MAX_CART_QUANTITY) {
    return NextResponse.json({ error: "اطلاعات ناقص یا نامعتبر است" }, { status: 400 });
  }

  try {
    const key = { userId_productId: { userId, productId: pid } };
    const current = await prisma.cart.findUnique({
      where: key,
      include: { Product: { include: { Category: true } } },
    });
    if (!current) {
      return NextResponse.json({ error: "این محصول در سبد خرید شما نیست" }, { status: 404 });
    }

    // همان بررسی موجودی POST (فقط برای محصولاتی که موجودی‌شان پیگیری می‌شود)؛ کم‌کردن همیشه مجاز است،
    // وگرنه وقتی موجودی بعد از افزودن به سبد کم شده کاربر نمی‌تواند تعداد را به‌تدریج پایین بیاورد
    if (tracksStock(current.Product) && qty > current.Product.stock && qty > current.quantity) {
      return NextResponse.json({ error: "تعداد درخواستی بیش از موجودی است" }, { status: 400 });
    }

    const updated = await prisma.cart.update({
      where: key,
      data: { quantity: qty },
      include: { Product: { include: { Category: true } } },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating cart quantity:", err);
    return NextResponse.json({ error: "خطا در تغییر تعداد" }, { status: 500 });
  }
}

// 🔴 DELETE: حذف از سبد خرید
export async function DELETE(req) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;
  const userId = auth.user.id;

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