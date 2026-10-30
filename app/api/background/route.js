import prisma from "@/lib/prisma";
import { LOGO } from "@/lib/siteLogo";

// مقدارهای پیش‌فرض قدیمی (seed قدیمی /image/logo.png را در دیتابیس گذاشته)؛ بدون دست‌زدن به دیتابیس هم به لوگوی جدید می‌رسند
const LEGACY_LOGOS = new Set(["/image/logo.png", "/image/logo-orkideh.png"]);

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "background_image" }, // کلید برای تصویر پس‌زمینه
    });
    const stored = setting?.background_image;
    const backgroundImage = !stored || LEGACY_LOGOS.has(stored) ? LOGO : stored; // پیش‌فرض اگه null بود
    return new Response(JSON.stringify({ data: backgroundImage }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("خطا در دریافت تنظیمات:", error);
    return new Response(JSON.stringify({ error: "خطای سرور در دریافت تنظیمات" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}