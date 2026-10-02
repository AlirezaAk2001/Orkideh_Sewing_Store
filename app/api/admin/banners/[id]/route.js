import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET: دریافت یک بنر با id
export async function GET(req, { params }) {
  const { id } = await params;
  try {
    const banner = await prisma.banner.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, title: true, desc: true, img: true, link: true }, // اضافه کردن link
    });
    if (!banner) {
      return NextResponse.json({ error: "بنر پیدا نشد" }, { status: 404 });
    }
    return NextResponse.json(banner, { status: 200 });
  } catch (error) {
    console.error("Error fetching banner:", error);
    return NextResponse.json({ error: "خطا در دریافت بنر", details: error.message }, { status: 500 });
  }
}

// PUT: ویرایش بنر
export async function PUT(req, { params }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const { title, desc, img, link } = await req.json();
    if (!title || !desc || !img) {
      return NextResponse.json({ error: "عنوان، توضیحات و تصویر الزامی است" }, { status: 400 });
    }

    const banner = await prisma.banner.update({
      where: { id: parseInt(id) },
      data: { title, desc, img, link: link || "/products" },
    });

    return NextResponse.json(banner, { status: 200 });
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json({ error: "خطا در ویرایش بنر", details: error.message }, { status: 500 });
  }
}

// DELETE: حذف بنر
export async function DELETE(req, { params }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    await prisma.banner.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ message: "بنر حذف شد" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json({ error: "خطا در حذف بنر", details: error.message }, { status: 500 });
  }
}