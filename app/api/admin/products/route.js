import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const verifyAdmin = async (req) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("No token provided in authorization header");
    return { error: "توکن ارائه نشده است", status: 401 };
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.is_admin) {
      console.error("Unauthorized access: User is not admin or not found", { userId: decoded.id });
      return { error: "دسترسی غیرمجاز", status: 403 };
    }
    return { user };
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return { error: "توکن نامعتبر یا منقضی شده", status: 401 };
  }
};

function toLatinSlug(name) {
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
  return name
    .split('')
    .map(char => persianToLatin[char] || char)
    .join('')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
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

    const validProducts = products.map((product) => ({
      ...product,
      categoryName: product.Category?.name || null,
      categoryId: product.categoryId || null,
      Category: product.Category || null,
      discount: product.discount != null ? product.discount : null,
      finalPrice: product.finalPrice != null
        ? parseFloat(product.finalPrice)
        : product.discount != null
        ? parseFloat(product.price * (1 - product.discount / 100))
        : parseFloat(product.price),
      image: product.image ? product.image.replace(/\/$/, "") : null,
      weight: product.weight || null,
      voltage: product.voltage || null,
      powerConsumption: product.powerConsumption || null, // اضافه کردن توان مصرفی
      material: product.material || null,
      size: product.size || null,
      color: product.color || null,
      suitableFor: product.suitableFor || null,
      additionalFeatures: product.additionalFeatures || null,
    }));

    console.log("Products from API:", validProducts);
    return NextResponse.json(validProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "خطا در دریافت محصولات", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req) {
  const auth = await verifyAdmin(req);
  if (auth.error) {
    console.error("Authentication error in POST:", auth.error);
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  console.log("Received payload for POST:", body);
  const { name, price, stock, categoryId, image, additionalFeatures, material, size, weight, color, suitableFor, discount, voltage, powerConsumption } = body;
  const latinSlug = toLatinSlug(name);
  const slug = `${latinSlug}-${Date.now()}`;

  if (!name || !price || isNaN(parseFloat(price))) {
    console.warn("Invalid input in POST:", { name, price });
    return NextResponse.json({ error: "نام و قیمت محصول الزامی و معتبر هستند" }, { status: 400 });
  }

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
        stock: stock ? parseInt(stock) : null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        categoryName: categoryId ? (await prisma.category.findUnique({ where: { id: parseInt(categoryId) } }))?.name : null,
        image: image ? image.replace(/\/$/, '') : null,
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
    console.log("Created product:", product);
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", { message: error.message, stack: error.stack, code: error.code });
    return NextResponse.json({ error: "خطا در افزودن محصول", details: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(req) {
  const auth = await verifyAdmin(req);
  if (auth.error) {
    console.error("Authentication error in PUT:", auth.error);
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const productId = parseInt(body.id, 10);

    if (isNaN(productId)) {
      return NextResponse.json({ error: "شناسه محصول نامعتبر است" }, { status: 400 });
    }

    const { name, price, stock, categoryId, image, additionalFeatures, material, size, weight, color, suitableFor, discount, voltage, powerConsumption } = body;
    const parsedPrice = parseFloat(price);
    const parsedDiscount = discount && !isNaN(parseInt(discount)) ? parseInt(discount) : null;
    const finalPrice = parsedDiscount ? parsedPrice * (1 - parsedDiscount / 100) : parsedPrice;
    const latinSlug = toLatinSlug(name);
    const slug = `${latinSlug}-${Date.now()}`;

    const updateData = {
      name,
      price: parsedPrice,
      stock: stock ? parseInt(stock) : null,
      image: image ? image.replace(/\/$/, '') : null,
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
    };

    if (categoryId) {
      updateData.categoryId = parseInt(categoryId);
      updateData.categoryName = (await prisma.category.findUnique({ where: { id: parseInt(categoryId) } }))?.name || null;
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    console.log("Updated product:", updatedProduct);
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", { message: error.message, stack: error.stack, code: error.code });
    return NextResponse.json(
      { error: "خطا در بروزرسانی محصول", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(req) {
  const auth = await verifyAdmin(req);
  if (auth.error) {
    console.error("Authentication error in DELETE:", auth.error);
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  console.log("Received payload for DELETE:", body);
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

    await prisma.product.delete({ where: { id: parseInt(id) } });
    console.log("Deleted product with id:", id);
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
  } finally {
    await prisma.$disconnect();
  }
}