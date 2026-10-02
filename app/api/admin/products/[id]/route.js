import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      console.warn("Invalid product id:", id);
      return NextResponse.json({ error: "شناسه محصول نامعتبر است" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        Category: { select: { id: true, name: true, slug: true } },
        Comment: {
          where: { approved: true },
          select: {
            id: true,
            rating: true,
            text: true,
            approved: true,
            createdAt: true,
            User: { select: { name: true } },
          },
        },
      },
    });

    if (!product) {
      console.warn("Product not found for id:", productId);
      return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
    }

    const normalizedProduct = {
      ...product,
      categoryId: product.categoryId || null,
      categoryName: product.Category?.name || null,
      Category: product.Category || null,
      discount: product.discount != null ? product.discount : null,
      finalPrice: product.finalPrice != null ? parseFloat(product.finalPrice) : product.discount != null ? parseFloat(product.price * (1 - product.discount / 100)) : parseFloat(product.price),
      weight: product.weight || null,
      voltage: product.voltage || null,
      powerConsumption: product.powerConsumption || null, // اضافه کردن توان مصرفی
      material: product.material || null,
      size: product.size || null,
      color: product.color || null,
      suitableFor: product.suitableFor || null,
      additionalFeatures: product.additionalFeatures || null,
      image: product.image ? product.image.replace(/\/$/, '') : null,
    };

    console.log("Product data:", normalizedProduct);
    return NextResponse.json(normalizedProduct);
  } catch (error) {
    console.error("Error fetching product:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return NextResponse.json(
      { error: "خطا در دریافت محصول", details: error.message || "خطای ناشناخته" },
      { status: 500 }
    );
  }
}