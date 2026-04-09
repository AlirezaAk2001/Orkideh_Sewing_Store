import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// 📌 GET → گرفتن همه‌ی کامنت‌ها
export async function GET(req) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "توکن موجود نیست" }, { status: 401 });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.is_admin) {
        return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "توکن نامعتبر" }, { status: 401 });
    }

    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        User: { select: { id: true, name: true, email: true } },
        Product: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(comments);
  } catch (error) {
    console.error("❌ Error fetching comments:", error);
    return NextResponse.json(
      { error: "مشکل در گرفتن لیست نظرات" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 📌 DELETE → حذف یک کامنت با id
export async function DELETE(req) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "توکن موجود نیست" }, { status: 401 });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.is_admin) {
        return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "توکن نامعتبر" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "شناسه (id) الزامی است" }, { status: 400 });
    }

    await prisma.comment.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "نظر با موفقیت حذف شد" });
  } catch (error) {
    console.error("❌ Error deleting comment:", error);
    return NextResponse.json(
      { error: "مشکل در حذف نظر" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 📌 PUT → تأیید یک کامنت
export async function PUT(req) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "توکن موجود نیست" }, { status: 401 });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.is_admin) {
        return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "توکن نامعتبر" }, { status: 401 });
    }

    const { id, approved } = await req.json();
    if (!id || typeof approved !== "boolean") {
      return NextResponse.json(
        { error: "شناسه و وضعیت تأیید الزامی است" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.update({
      where: { id: Number(id) },
      data: { approved },
      include: {
        User: { select: { id: true, name: true } },
        Product: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      comment,
      message: approved ? "نظر تأیید شد" : "نظر از حالت تأیید خارج شد",
    });
  } catch (error) {
    console.error("❌ Error updating comment:", error);
    return NextResponse.json(
      { error: "مشکل در به‌روزرسانی نظر" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}