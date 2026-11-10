import { NextResponse } from "next/server";
import { getShippingMethods } from "@/lib/shippingConfig";
import { activeMethods } from "@/lib/shipping";

// روش‌های ارسالِ فعال با هزینه، برای سبد خرید (عمومی؛ چیزی محرمانه در آن نیست). هزینهٔ نهایی سفارش را همیشه سرور از همین تنظیمات می‌سازد، نه از مقدار ارسالیِ مرورگر
export async function GET() {
  try {
    const methods = activeMethods(await getShippingMethods()).map(({ id, label, description, cost }) => ({ id, label, description, cost }));
    return NextResponse.json({ methods }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET shipping error:", error.message);
    return NextResponse.json({ error: "خطا در دریافت روش‌های ارسال" }, { status: 500 });
  }
}
