import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { shapeProduct } from "@/lib/products";

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

    return NextResponse.json(shapeProduct(product));
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