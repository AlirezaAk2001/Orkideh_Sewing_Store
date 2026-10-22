import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

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

    // کاربر مهمان یا توکن نامعتبر: پاسخ نرم (نه خطا) که می‌گوید هنوز نمی‌تواند نظر بدهد
    const auth = await requireUser(req);
    if (auth.error) {
      return NextResponse.json({
        canComment: false,
        hasPurchased: false,
        hasCommented: false,
        message: "لطفاً ابتدا وارد حساب کاربری خود شوید",
      });
    }
    const userId = auth.user.id;

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