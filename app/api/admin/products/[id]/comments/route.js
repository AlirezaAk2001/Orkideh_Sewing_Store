import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { requireAdmin } from "@/lib/auth";

// GET: دریافت کامنت‌های تأیید شده محصول (همراه با adminReply)
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const productIdNum = parseInt(id, 10);

    if (isNaN(productIdNum)) {
      return NextResponse.json({ error: "شناسه محصول نامعتبر است" }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { productId: productIdNum, approved: true },
      orderBy: { createdAt: "desc" },
      include: {
        User: { select: { id: true, name: true, username: true } },
        Product: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("خطا در دریافت نظرات:", error);
    return NextResponse.json(
      { error: "مشکل در دریافت نظرات", details: error.message },
      { status: 500 }
    );
  }
}

// POST: ثبت کامنت جدید با بررسی خرید محصول
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const productIdNum = parseInt(id, 10);

    if (isNaN(productIdNum)) {
      return NextResponse.json({ error: "شناسه محصول نامعتبر است" }, { status: 400 });
    }

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "توکن موجود نیست" }, { status: 401 });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch {
      return NextResponse.json({ error: "توکن نامعتبر" }, { status: 401 });
    }

    const { text, rating } = await req.json();

    if (!text || !text.trim() || text.trim().length < 3) {
      return NextResponse.json(
        { error: "متن نظر باید حداقل ۳ کاراکتر باشد" },
        { status: 400 }
      );
    }

    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "امتیاز باید بین ۱ تا ۵ باشد" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({ where: { id: productIdNum } });
    if (!product) {
      return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
    }

    const deliveredOrder = await prisma.order.findFirst({
      where: {
        userId: parseInt(userId),
        status: "delivered",
        OrderItems: { some: { productId: productIdNum } },
      },
      include: {
        OrderItems: { where: { productId: productIdNum } },
      },
    });

    if (!deliveredOrder) {
      return NextResponse.json(
        {
          error: "شما فقط می‌توانید روی محصولاتی که خریداری کرده‌ید و تحویل گرفته‌ید نظر دهید",
          code: "PURCHASE_REQUIRED",
        },
        { status: 403 }
      );
    }

    const existingComment = await prisma.comment.findFirst({
      where: { userId: parseInt(userId), productId: productIdNum },
    });

    if (existingComment) {
      return NextResponse.json(
        { error: "شما قبلاً برای این محصول نظر داده‌اید", code: "ALREADY_COMMENTED" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        text: text.trim(),
        rating: parseInt(rating),
        productId: productIdNum,
        userId: parseInt(userId),
        approved: false,
      },
      include: {
        User: { select: { id: true, name: true, username: true } },
        Product: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      comment,
      message: "نظر شما با موفقیت ثبت شد و پس از تأیید مدیریت نمایش داده خواهد شد",
      orderId: deliveredOrder.id,
    });
  } catch (error) {
    console.error("خطا در ثبت نظر:", error);
    return NextResponse.json(
      { error: "مشکل در ثبت نظر", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: حذف کامنت (فقط توسط ادمین)
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const productIdNum = parseInt(id, 10);

    if (isNaN(productIdNum)) {
      return NextResponse.json({ error: "شناسه محصول نامعتبر است" }, { status: 400 });
    }

    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const { commentId } = await req.json();
    if (!commentId) {
      return NextResponse.json({ error: "شناسه نظر الزامی است" }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({ where: { id: parseInt(commentId) } });
    if (!comment || comment.productId !== productIdNum) {
      return NextResponse.json({ error: "نظر یافت نشد یا متعلق به این محصول نیست" }, { status: 404 });
    }

    await prisma.comment.delete({ where: { id: parseInt(commentId) } });

    return NextResponse.json({ message: "نظر با موفقیت حذف شد" });
  } catch (error) {
    console.error("خطا در حذف نظر:", error);
    return NextResponse.json(
      { error: "مشکل در حذف نظر", details: error.message },
      { status: 500 }
    );
  }
}