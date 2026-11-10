import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getShippingMethods, saveShippingMethods } from "@/lib/shippingConfig";
import { parseMethods } from "@/lib/shipping";

// تنظیم روش‌ها و هزینهٔ ارسال (فقط مدیر). نقش مدیر از دیتابیس خوانده می‌شود، نه از ادعای داخل توکن
export async function GET(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;
  try {
    return NextResponse.json({ methods: await getShippingMethods() });
  } catch (error) {
    console.error("GET admin shipping error:", error.message);
    return NextResponse.json({ error: "خطا در دریافت تنظیمات ارسال" }, { status: 500 });
  }
}

export async function PUT(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 400 });
  }

  const parsed = parseMethods(body?.methods, { strict: true });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    await saveShippingMethods(parsed.methods);
    return NextResponse.json({ methods: parsed.methods });
  } catch (error) {
    console.error("PUT admin shipping error:", error.message);
    return NextResponse.json({ error: "خطا در ذخیرهٔ تنظیمات ارسال" }, { status: 500 });
  }
}
