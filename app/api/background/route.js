import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "background_image" }, // کلید برای تصویر پس‌زمینه
    });
    const backgroundImage = setting?.background_image || "/image/logo.png"; // پیش‌فرض اگه null بود
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