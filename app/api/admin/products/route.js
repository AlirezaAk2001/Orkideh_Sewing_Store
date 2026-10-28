import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseStock } from "@/lib/stock";
import { toLatinSlug } from "@/lib/slug";
import { shapeProduct } from "@/lib/products";
import { MAX_PRODUCT_IMAGES, parseImageList, productImages } from "@/lib/productImages";
import { removeUnusedUploads } from "@/lib/uploads";

// گالری ارسالی ادمین را بررسی می‌کند: { gallery } (undefined = فرستاده نشده) یا { error } برای پاسخ ۴۰۰
function checkGallery(image, images) {
  const gallery = parseImageList(images, image);
  if (gallery === null) return { error: "فهرست تصویرها نامعتبر است" };
  if ((image ? 1 : 0) + (gallery?.length ?? 0) > MAX_PRODUCT_IMAGES) {
    return { error: `هر محصول حداکثر ${MAX_PRODUCT_IMAGES} تصویر می‌تواند داشته باشد` };
  }
  return { gallery };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");

    let whereClause = {};
    if (categorySlug) {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
      });

      if (category) {
        whereClause.categoryId = category.id;
      } else {
        return NextResponse.json([]);
      }
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { id: "desc" },
      include: {
        Category: { select: { id: true, name: true, slug: true } },
      },
    });

    const validProducts = products.map(shapeProduct);

    return NextResponse.json(validProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "خطا در دریافت محصولات", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const body = await req.json();
  const { name, price, stock, categoryId, image, images, additionalFeatures, material, size, weight, color, suitableFor, discount, voltage, powerConsumption } = body;

  if (!name || !price || isNaN(parseFloat(price))) {
    console.warn("Invalid input in POST:", { name, price });
    return NextResponse.json({ error: "نام و قیمت محصول الزامی و معتبر هستند" }, { status: 400 });
  }

  const galleryCheck = checkGallery(image, images);
  if (galleryCheck.error) return NextResponse.json({ error: galleryCheck.error }, { status: 400 });

  const slug = `${toLatinSlug(name)}-${Date.now()}`;

  if (categoryId && isNaN(parseInt(categoryId))) {
    console.warn("Invalid categoryId in POST:", categoryId);
    return NextResponse.json({ error: "شناسه دسته‌بندی نامعتبر است" }, { status: 400 });
  }

  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: parseInt(categoryId) } });
    if (!category) {
      console.warn("Category not found for categoryId in POST:", categoryId);
      return NextResponse.json({ error: "دسته‌بندی یافت نشد" }, { status: 400 });
    }
  }

  const parsedPrice = parseFloat(price);
  const parsedDiscount = discount && !isNaN(parseInt(discount)) ? parseInt(discount) : null;
  const finalPrice = parsedDiscount ? parsedPrice * (1 - parsedDiscount / 100) : parsedPrice;

  try {
    const product = await prisma.product.create({
      data: {
        name,
        price: parsedPrice,
        stock: parseStock(stock),
        categoryId: categoryId ? parseInt(categoryId) : null,
        categoryName: categoryId ? (await prisma.category.findUnique({ where: { id: parseInt(categoryId) } }))?.name : null,
        image: image ? image.replace(/\/$/, '') : null,
        ...(galleryCheck.gallery && { images: galleryCheck.gallery }),
        additionalFeatures,
        material,
        size,
        weight: weight ? String(weight) : null,
        color,
        suitableFor,
        discount: parsedDiscount,
        voltage: voltage || null,
        powerConsumption: powerConsumption || null, // اضافه کردن توان مصرفی
        finalPrice,
        slug,
      },
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", { message: error.message, stack: error.stack, code: error.code });
    return NextResponse.json({ error: "خطا در افزودن محصول", details: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const productId = parseInt(body.id, 10);

    if (isNaN(productId)) {
      return NextResponse.json({ error: "شناسه محصول نامعتبر است" }, { status: 400 });
    }

    const { name, price, stock, categoryId, image, images, additionalFeatures, material, size, weight, color, suitableFor, discount, voltage, powerConsumption } = body;
    const parsedPrice = parseFloat(price);
    if (!name || isNaN(parsedPrice)) {
      return NextResponse.json({ error: "نام و قیمت محصول الزامی و معتبر هستند" }, { status: 400 });
    }
    // images فرستاده نشده باشد (فرم‌ها و درخواست‌های قدیمی) گالری همان می‌ماند
    const galleryCheck = checkGallery(image, images);
    if (galleryCheck.error) return NextResponse.json({ error: galleryCheck.error }, { status: 400 });
    const parsedDiscount = discount && !isNaN(parseInt(discount)) ? parseInt(discount) : null;
    const finalPrice = parsedDiscount ? parsedPrice * (1 - parsedDiscount / 100) : parsedPrice;

    const existing = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true, image: true, images: true } });
    if (!existing) {
      return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
    }

    const updateData = {
      name,
      price: parsedPrice,
      stock: parseStock(stock),
      image: image ? image.replace(/\/$/, '') : null,
      ...(galleryCheck.gallery && { images: galleryCheck.gallery }),
      additionalFeatures,
      material,
      size,
      weight: weight ? String(weight) : null,
      color,
      suitableFor,
      discount: parsedDiscount,
      voltage: voltage || null,
      powerConsumption: powerConsumption || null, // اضافه کردن توان مصرفی
      finalPrice,
      // آدرس (slug) محصول با ویرایش عوض نمی‌شود تا لینک‌ها و نتایج جست‌وجو از کار نیفتند
      slug: existing.slug || `${toLatinSlug(name)}-${Date.now()}`,
    };

    if (categoryId) {
      updateData.categoryId = parseInt(categoryId);
      updateData.categoryName = (await prisma.category.findUnique({ where: { id: parseInt(categoryId) } }))?.name || null;
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    // تصویرهای آپلودشده‌ای که از محصول برداشته شده‌اند (و جای دیگری استفاده نمی‌شوند) از دیسک هم پاک می‌شوند
    const kept = new Set(productImages(updatedProduct));
    await removeUnusedUploads(productImages(existing).filter((src) => !kept.has(src)));

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", { message: error.message, stack: error.stack, code: error.code });
    return NextResponse.json(
      { error: "خطا در بروزرسانی محصول", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const body = await req.json();
  const { id } = body;

  if (!id || isNaN(parseInt(id))) {
    console.warn("Invalid id in DELETE:", id);
    return NextResponse.json({ error: "شناسه محصول الزامی و معتبر است" }, { status: 400 });
  }

  try {
    const existingProduct = await prisma.product.findUnique({ where: { id: parseInt(id) } });
    if (!existingProduct) {
      console.warn("Product not found for id in DELETE:", id);
      return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
    }

    // محصولی که در سفارش‌های ثبت‌شده آمده را نمی‌شود حذف کرد (تاریخچهٔ سفارش‌ها خراب می‌شود)
    const productId = parseInt(id);
    const usedInOrders = await prisma.orderItem.count({ where: { productId } });
    if (usedInOrders > 0) {
      return NextResponse.json(
        { error: "این محصول در سفارش‌های ثبت‌شده استفاده شده و قابل حذف نیست. برای فروش‌نرفتن آن، موجودی را روی ۰ بگذارید." },
        { status: 409 }
      );
    }

    // سبد خرید، علاقه‌مندی‌ها و نظرات این محصول هم با آن پاک می‌شوند (بدون این، کلید خارجی حذف را رد می‌کرد)
    await prisma.$transaction([
      prisma.cart.deleteMany({ where: { productId } }),
      prisma.favorite.deleteMany({ where: { productId } }),
      prisma.comment.deleteMany({ where: { productId } }),
      prisma.product.delete({ where: { id: productId } }),
    ]);
    await removeUnusedUploads(productImages(existingProduct));
    return NextResponse.json({ message: "محصول حذف شد" });
  } catch (error) {
    console.error("Error deleting product:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return NextResponse.json(
      { error: "خطا در حذف محصول", details: error.message || "خطای ناشناخته" },
      { status: error.code === 'P2025' ? 404 : 500 }
    );
  }
}