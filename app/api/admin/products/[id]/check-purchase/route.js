import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "شناسه محصول نامعتبر است" }, 
        { status: 400 }
      );
    }

    const token = req.headers.get("authorization")?.split(" ")[1];
    
    // اگر توکن وجود ندارد
    if (!token) {
      return NextResponse.json({ 
        canComment: false,
        hasPurchased: false,
        hasCommented: false,
        message: "لطفاً ابتدا وارد حساب کاربری خود شوید"
      });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch {
      return NextResponse.json({ 
        canComment: false,
        hasPurchased: false,
        hasCommented: false,
        message: "توکن نامعتبر"
      });
    }

    // بررسی خرید و مجوز
    const deliveredOrder = await prisma.order.findFirst({
      where: {
        userId: parseInt(userId),
        status: "delivered",
        OrderItems: {
          some: {
            productId: productId,
          },
        },
      },
    });

    const existingComment = await prisma.comment.findFirst({
      where: {
        userId: parseInt(userId),
        productId: productId,
      },
    });

    const canComment = deliveredOrder !== null && existingComment === null;

    return NextResponse.json({
      canComment,
      hasPurchased: deliveredOrder !== null,
      hasCommented: existingComment !== null,
      orderId: deliveredOrder?.id,
      message: canComment 
        ? "شما می‌توانید برای این محصول نظر دهید" 
        : !deliveredOrder 
          ? "شما این محصول را خریداری نکرده‌اید یا هنوز تحویل نگرفته‌اید" 
          : "شما قبلاً برای این محصول نظر داده‌اید"
    });
  } catch (error) {
    console.error("Error in check-purchase:", error);
    
    // در صورت خطا، وضعیت نامشخص بازگردانده می‌شود
    return NextResponse.json({
      canComment: false,
      hasPurchased: false,
      hasCommented: false,
      message: "خطا در بررسی مجوز",
      error: error.message
    }, { status: 500 });
  }
}