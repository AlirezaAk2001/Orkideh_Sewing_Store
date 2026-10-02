import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { tracksStock } from "@/lib/stock";
import { getMerchant, siteUrl, payUrl, zibalRequest } from "@/lib/zibal";
import { hit, tooManyRequests } from "@/lib/rateLimit";

/**
 * POST /api/payment  { orderId }
 * شروع پرداخت یک سفارش «pending» متعلق به همین کاربر.
 * مبلغ و آدرس برگشت از درگاه را خود سرور می‌سازد؛ از کلاینت فقط شناسهٔ سفارش گرفته می‌شود
 * و trackId هم همین‌جا روی سفارش ذخیره می‌شود.
 */
export async function POST(req) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  // هر درخواست یک تماس با درگاه است؛ برای هر کاربر ۱۰ بار در ۱۰ دقیقه کافی است
  const rl = hit(`payment:${auth.user.id}`, 10, 10 * 60);
  if (rl.limited) return tooManyRequests(rl.retryAfter, "تعداد درخواست‌های پرداخت زیاد است.");

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 400 });
  }

  const orderId = Number(body?.orderId);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "شناسه سفارش نامعتبر است" }, { status: 400 });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: auth.user.id },
      include: { OrderItems: { include: { Product: { include: { Category: true } } } } },
    });

    if (!order) {
      return NextResponse.json({ error: "سفارش یافت نشد" }, { status: 404 });
    }
    if (order.status !== "pending") {
      return NextResponse.json({ error: "این سفارش قبلاً پرداخت شده یا بسته شده است" }, { status: 409 });
    }

    const short = order.OrderItems.filter(
      (item) => tracksStock(item.Product) && item.quantity > item.Product.stock
    );
    if (short.length) {
      return NextResponse.json(
        {
          error: `موجودی کافی نیست: ${short.map((item) => item.Product.name).join("، ")}`,
          code: "OUT_OF_STOCK",
        },
        { status: 409 }
      );
    }

    const amount = Math.round(order.totalPrice * 10); // تومان → ریال
    if (amount < 1000) {
      return NextResponse.json({ error: "مبلغ سفارش کمتر از حداقل مجاز درگاه (۱۰۰ تومان) است" }, { status: 400 });
    }

    const merchant = getMerchant();
    const base = siteUrl(req);
    if (!merchant || !base) {
      console.error("تنظیمات پرداخت ناقص است: ZIBAL_MERCHANT_ID و NEXT_PUBLIC_BASE_URL را بررسی کنید.");
      return NextResponse.json({ error: "درگاه پرداخت پیکربندی نشده است" }, { status: 500 });
    }

    const data = await zibalRequest({
      merchant,
      amount,
      orderId: String(order.id),
      callbackUrl: `${base}/payment-result`,
    });

    if (data.result !== 100) {
      console.error("Zibal payment request failed:", data);
      return NextResponse.json(
        { error: data.message || "خطا در درخواست پرداخت", result: data.result },
        { status: 502 }
      );
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentTrackId: String(data.trackId) },
    });

    return NextResponse.json({ result: 100, trackId: data.trackId, payUrl: payUrl(data.trackId) });
  } catch (error) {
    console.error("Payment error:", error.response?.data || error.message);
    const gatewayDown = Boolean(error.isAxiosError);
    return NextResponse.json(
      { error: gatewayDown ? "ارتباط با درگاه پرداخت برقرار نشد. کمی بعد دوباره تلاش کنید." : "خطا در شروع پرداخت" },
      { status: gatewayDown ? 502 : 500 }
    );
  }
}
