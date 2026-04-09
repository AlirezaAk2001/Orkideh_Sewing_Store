import { NextResponse } from "next/server";
import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { trackId } = body;

    console.log("🟢 Received verify request. Body:", body);

    if (!trackId) {
      console.error("❌ No trackId provided");
      return NextResponse.json({ error: "شناسه تراکنش الزامی است" }, { status: 400 });
    }

    const merchant = process.env.ZIBAL_MERCHANT_ID || "zibal";
    console.log("🔹 Using merchant:", merchant);

    // مرحله درخواست به زیبال
    const verifyResponse = await axios.post("https://gateway.zibal.ir/v1/verify", {
      merchant,
      trackId,
    });

    console.log("✅ Zibal verify response:", verifyResponse.data);

    const result = verifyResponse.data.result;
    const message = verifyResponse.data.message || "بدون پیام";

    // در صورتی که تراکنش موفق بود
    if (result === 100) {
  // سفارش رو به processing تغییر بده
  const updatedOrder = await prisma.order.updateMany({
    where: { paymentTrackId: String(trackId) },
    data: { status: "processing" },
  });

  // سبد خرید کاربر رو خالی کن
  if (updatedOrder.count > 0) {
    const order = await prisma.order.findFirst({
      where: { paymentTrackId: String(trackId) },
    });
    if (order) {
      await prisma.cart.deleteMany({ where: { userId: order.userId } });
    }
  }

  return NextResponse.json({ result: 100, message: "پرداخت موفق ✅" });
}

    // اگر پرداخت موفق نبود، جزئیات خطا را چاپ کنیم
    console.warn("⚠️ Payment verification failed:", { result, message });

    return NextResponse.json(
      {
        result,
        error: message,
        zibalResponse: verifyResponse.data, // لاگ کامل پاسخ زیبال برای بررسی دقیق
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("💥 Verify error:", error.response?.data || error.message);

    return NextResponse.json(
      {
        error: "خطا در بررسی تراکنش",
        details: error.response?.data || error.message,
      },
      { status: error.response?.status || 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}