import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { tracksStock } from "@/lib/stock";
import { getMerchant, zibalVerify } from "@/lib/zibal";
import { limitByIp, tooManyRequests } from "@/lib/rateLimit";

/**
 * POST /api/payment/verify  { trackId }
 * سفارش فقط وقتی تکمیل می‌شود که:
 *  - trackId را خود سرور موقع شروع پرداخت روی همان سفارش ثبت کرده باشد،
 *  - زیبال پرداخت را تأیید کند و مبلغ تأییدشده دقیقاً برابر مبلغ سفارش باشد.
 * تکمیل سفارش (تغییر وضعیت، کم‌کردن موجودی، خالی‌کردن سبد) فقط یک بار اتفاق می‌افتد؛
 * رفرش صفحه یا درخواست هم‌زمان دوباره چیزی را عوض نمی‌کند.
 */
export async function POST(req) {
  // این route عمومی است و برای سفارش‌های pending به زیبال می‌رود؛ سقف سخاوتمندانه (پشت NAT چند مشتری یک IP دارند)
  const limited = limitByIp(req, "pay-verify", 120, 10 * 60);
  if (limited) return tooManyRequests(limited.retryAfter);

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 400 });
  }

  const trackId = String(body?.trackId ?? "").trim();
  if (!/^\d{1,20}$/.test(trackId)) {
    return NextResponse.json({ error: "شناسه تراکنش الزامی است" }, { status: 400 });
  }

  const alreadyDone = () =>
    NextResponse.json({ result: 100, message: "این پرداخت قبلاً تأیید شده است", already: true });

  try {
    const order = await prisma.order.findUnique({
      where: { paymentTrackId: trackId },
      include: { OrderItems: { include: { Product: { include: { Category: true } } } } },
    });

    if (!order) {
      return NextResponse.json({ error: "تراکنشی با این شناسه یافت نشد" }, { status: 404 });
    }

    // قبلاً تکمیل شده (رفرش صفحه، کلیک دوباره، ...): بدون هیچ اثر جانبی موفق برمی‌گردد
    if (order.status !== "pending") return alreadyDone();

    // اگر وسط کار درخواست هم‌زمان دیگری سفارش را تکمیل کرده باشد، خطا نیست
    const completedMeanwhile = async () => {
      const fresh = await prisma.order.findUnique({ where: { id: order.id }, select: { status: true } });
      return fresh && fresh.status !== "pending";
    };

    const merchant = getMerchant();
    if (!merchant) {
      console.error("ZIBAL_MERCHANT_ID تنظیم نشده است");
      return NextResponse.json({ error: "درگاه پرداخت پیکربندی نشده است" }, { status: 500 });
    }

    const data = await zibalVerify({ merchant, trackId });

    // 100 = تأیید شد، 201 = قبلاً (توسط خود ما) تأیید شده؛ در هر دو حالت باید با سفارش بخواند
    if (data.result !== 100 && data.result !== 201) {
      if (await completedMeanwhile()) return alreadyDone();
      return NextResponse.json(
        { result: data.result, error: data.message || "پرداخت تأیید نشد" },
        { status: 400 }
      );
    }

    const expected = Math.round(order.totalPrice * 10); // تومان → ریال
    const paid = Number(data.amount);
    const sameOrder =
      data.orderId === undefined || data.orderId === null || String(data.orderId) === String(order.id);

    if (paid !== expected || !sameOrder) {
      if (await completedMeanwhile()) return alreadyDone();
      console.error("⚠️ مبلغ یا شناسهٔ سفارش پرداخت با سفارش نمی‌خواند؛ سفارش تکمیل نشد:", {
        orderId: order.id,
        trackId,
        expected,
        paid,
        zibalOrderId: data.orderId,
      });
      return NextResponse.json(
        { result: 0, error: "مبلغ پرداخت‌شده با مبلغ سفارش مطابقت ندارد. لطفاً با پشتیبانی تماس بگیرید." },
        { status: 400 }
      );
    }

    const completed = await prisma.$transaction(async (tx) => {
      const { count } = await tx.order.updateMany({
        where: { id: order.id, status: "pending" },
        data: { status: "processing" },
      });
      if (count === 0) return false; // درخواست هم‌زمان دیگری سفارش را تکمیل کرد

      for (const item of order.OrderItems) {
        if (!tracksStock(item.Product)) continue;

        const decremented = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (decremented.count === 0) {
          // موجودی بین ثبت سفارش و پرداخت کم شده؛ پول گرفته شده پس سفارش را رد نمی‌کنیم،
          // فقط موجودی را روی صفر می‌گذاریم تا منفی نشود
          await tx.product.updateMany({
            where: { id: item.productId, stock: { gt: 0 } },
            data: { stock: 0 },
          });
          console.warn("⚠️ موجودی کمتر از تعداد سفارش بود:", {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
          });
        }
      }

      await tx.cart.deleteMany({ where: { userId: order.userId } });
      return true;
    });

    if (!completed) return alreadyDone();
    return NextResponse.json({ result: 100, message: "پرداخت موفق ✅", orderId: order.id });
  } catch (error) {
    console.error("Verify error:", error.response?.data || error.message);
    const gatewayDown = Boolean(error.isAxiosError);
    return NextResponse.json(
      { error: gatewayDown ? "ارتباط با درگاه پرداخت برقرار نشد. کمی بعد دوباره تلاش کنید." : "خطا در بررسی تراکنش" },
      { status: gatewayDown ? 502 : 500 }
    );
  }
}
