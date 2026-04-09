import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// ---------------------------
// GET: دریافت علاقه‌مندی‌ها
// ---------------------------
export async function GET(req) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ favorites: [] }, { status: 200 });

  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.id;
  } catch {
    return NextResponse.json({ favorites: [] }, { status: 200 });
  }

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

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

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

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    await prisma.favorite.deleteMany({ where: { userId, productId } });

    return NextResponse.json({ message: "Removed from favorites" }, { status: 200 });
  } catch (err) {
    console.error("Error deleting favorite:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}