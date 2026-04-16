import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// تابع کمکی: بررسی توکن ادمین
async function verifyAdmin(req) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.is_admin) return null;
    return user;
  } catch {
    return null;
  }
}

// 📌 GET → گرفتن همه‌ی کامنت‌ها
export async function GET(req) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        User: { select: { id: true, name: true, email: true, username: true } },
        Product: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(comments);
  } catch (error) {
    console.error("❌ Error fetching comments:", error);
    return NextResponse.json({ error: "مشکل در گرفتن لیست نظرات" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// 📌 PUT → تأیید یا رد تأیید یا پاسخ ادمین
export async function PUT(req) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const body = await req.json();
    const { id, approved, adminReply } = body;

    if (!id) {
      return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
    }

    const updateData = {};

    if (typeof approved === "boolean") {
      updateData.approved = approved;
      // اگر رد تایید شد، adminReply هم پاک بشه
      if (!approved) {
        updateData.adminReply = null;
        updateData.adminReplyAt = null;
      }
    }

    if (typeof adminReply === "string") {
      updateData.adminReply = adminReply.trim() || null;
      updateData.adminReplyAt = adminReply.trim() ? new Date() : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "داده‌ای برای به‌روزرسانی ارسال نشده" }, { status: 400 });
    }

    updateData.updatedAt = new Date();

    const comment = await prisma.comment.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        User: { select: { id: true, name: true, username: true } },
        Product: { select: { id: true, name: true } },
      },
    });

    let message = "نظر به‌روزرسانی شد";
    if (typeof approved === "boolean") {
      message = approved ? "نظر تأیید شد" : "نظر از حالت تأیید خارج شد";
    } else if (typeof adminReply === "string") {
      message = adminReply.trim()
        ? "پاسخ ادمین ثبت/ویرایش شد"
        : "پاسخ ادمین حذف شد";
    }

    return NextResponse.json({ comment, message });
  } catch (error) {
    console.error("❌ Error updating comment:", error);
    return NextResponse.json({ error: "مشکل در به‌روزرسانی نظر" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}