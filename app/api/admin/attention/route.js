import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getTotals } from "@/lib/adminStats";
import { getShippingMethods } from "@/lib/shippingConfig";

// شمارنده‌های سبک سایدبار پنل (فقط ادمین): «منتظر شما» (سفارش‌های جاری و نظرهای تأییدنشده؛ همان شمارش‌های کارت «نیازمند توجه» داشبورد) و تعداد کل هر بخش
// (بنر، دسته‌بندی، محصول، روش ارسال، نظر، سفارش؛ همان عددهای کارت‌های میان‌بر داشبورد). همه count ساده‌اند؛ سایدبار هر دقیقه و با رفتن به صفحهٔ دیگر آن را
// می‌پرسد، پس نباید آمار کامل بسازد.
export async function GET(req) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const [processingOrders, pendingComments, totals, shippingMethods] = await Promise.all([
      prisma.order.count({ where: { status: "processing" } }),
      prisma.comment.count({ where: { approved: false } }),
      getTotals(),
      getShippingMethods(),
    ]);
    return NextResponse.json({ processingOrders, pendingComments, ...totals, shipping: shippingMethods.length }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error counting admin attention:", { message: error.message });
    return NextResponse.json({ error: "خطا در دریافت شمارنده‌ها" }, { status: 500 });
  }
}
