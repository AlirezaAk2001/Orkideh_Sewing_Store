import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET → لیست بنرها
export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, desc: true, img: true, link: true }, // اضافه کردن link
    });
    return NextResponse.json(banners, { status: 200 });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json({ error: "خطا در دریافت بنرها", details: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST → افزودن بنر جدید
export async function POST(req) {
  try {
    const { title, desc, img, link } = await req.json();
    if (!title || !desc || !img) {
      return NextResponse.json({ error: "عنوان، توضیحات و تصویر الزامی است" }, { status: 400 });
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        desc,
        img,
        link: link || "/products", // پیش‌فرض برای link
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json({ error: "خطا در افزودن بنر", details: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT → ویرایش بنر
export async function PUT(req) {
  try {
    const { id, title, desc, img, link } = await req.json();
    if (!id || !title || !desc || !img) {
      return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
    }

    const banner = await prisma.banner.update({
      where: { id: parseInt(id) },
      data: {
        title,
        desc,
        img,
        link: link || "/products",
      },
    });

    return NextResponse.json(banner, { status: 200 });
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json({ error: "خطا در ویرایش بنر", details: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE → حذف بنر
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id الزامی است" }, { status: 400 });

    await prisma.banner.delete({ where: { id: parseInt(id) } });

    return NextResponse.json({ message: "بنر حذف شد" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json({ error: "خطا در حذف بنر", details: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}