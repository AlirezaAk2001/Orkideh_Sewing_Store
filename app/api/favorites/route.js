import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

// ---------------------------
// GET: دریافت علاقه‌مندی‌ها
// ---------------------------
export async function GET(req) {
  // کاربر مهمان یا توکن نامعتبر: فهرست خالی (نه خطا) تا رابط کاربری علاقه‌مندی‌ها را بی‌سروصدا خالی نشان دهد
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ favorites: [] }, { status: 200 });
  const userId = auth.user.id;

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: { Product: true },
    });

    // فقط مواردی که Product حذف نشده دارند
    const liveFavorites = (favorites || []).filter(f => f.Product);

    const formatted = liveFavorites.map((f) => ({
      id: f.productId,
      name: f.Product.name,
      price: f.Product.finalPrice || f.Product.price,
      image: f.Product.image,
    }));

    return NextResponse.json({ favorites: formatted }, { status: 200 });
  } catch (err) {
    console.error("Error loading favorites:", err);
    return NextResponse.json({ favorites: [] }, { status: 500 });
  }
}

// ---------------------------
// POST: افزودن علاقه‌مندی
// ---------------------------
export async function POST(req) {
  try {
    let { productId } = await req.json();
    if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

    // اگر یک آبجکت ارسال شده بود، فقط id بگیر
    if (typeof productId === "object" && productId.id) productId = productId.id;

    const auth = await requireUser(req);
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    // بررسی وجود محصول
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // بررسی اینکه قبلاً اضافه نشده باشد
    const existing = await prisma.favorite.findFirst({ where: { userId, productId } });
    if (existing) return NextResponse.json({ message: "Already in favorites" }, { status: 200 });

    await prisma.favorite.create({ data: { userId, productId } });

    return NextResponse.json({ message: "Added to favorites" }, { status: 201 });
  } catch (err) {
    console.error("Error adding favorite:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ---------------------------
// DELETE: حذف علاقه‌مندی
// ---------------------------
export async function DELETE(req) {
  try {
    let { productId } = await req.json();
    if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

    // اگر یک آبجکت ارسال شده بود، فقط id بگیر
    if (typeof productId === "object" && productId.id) productId = productId.id;

    const auth = await requireUser(req);
    if (auth.error) return auth.error;
    const userId = auth.user.id;

    await prisma.favorite.deleteMany({ where: { userId, productId } });

    return NextResponse.json({ message: "Removed from favorites" }, { status: 200 });
  } catch (err) {
    console.error("Error deleting favorite:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}