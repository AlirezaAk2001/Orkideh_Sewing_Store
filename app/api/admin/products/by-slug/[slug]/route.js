import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function toLatinSlug(input) {
  const persianToLatin = {
    'س': 's', 'ر': 'r', 'د': 'd', 'و': 'oo', 'ز': 'z',
    'آ': 'a', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't',
    'ث': 's', 'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh',
    'ذ': 'z', 'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a',
    'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ک': 'k', 'گ': 'g',
    'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'ی': 'y',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };
  return input
    .split('')
    .map(char => persianToLatin[char] || char)
    .join('')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug); // دی‌کد کردن slug
    const latinSlug = toLatinSlug(decodedSlug); // تبدیل به لاتین
    console.log("Received slug:", slug, "Decoded slug:", decodedSlug, "Latin slug:", latinSlug);
    if (!latinSlug) {
      console.warn("No valid slug provided");
      return NextResponse.json({ error: "Slug نامعتبر است" }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { slug: latinSlug },
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
      console.warn("Product not found for slug:", latinSlug);
      return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
    }

    const normalizedProduct = {
      ...product,
      Category: product.Category || null,
      comments: product.Comment || [],
      discount: product.discount != null ? product.discount : null,
      finalPrice: product.finalPrice != null ? parseFloat(product.finalPrice) : product.discount != null ? parseFloat(product.price * (1 - product.discount / 100)) : parseFloat(product.price),
      weight: product.weight || null,
      material: product.material || null,
      size: product.size || null,
      color: product.color || null,
      suitableFor: product.suitableFor || null,
      additionalFeatures: product.additionalFeatures || null,
      image: product.image ? product.image.replace(/\/$/, '') : null,
    };

    console.log("Product data for slug:", latinSlug, normalizedProduct);
    return NextResponse.json(normalizedProduct);
  } catch (error) {
    console.error("Error fetching product by slug:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return NextResponse.json(
      { error: "خطا در دریافت محصول", details: error.message || "خطای ناشناخته" },
      { status: error.code === 'P2025' ? 404 : 500 }
    );
  }
}