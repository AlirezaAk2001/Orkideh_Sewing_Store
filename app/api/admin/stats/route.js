import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminStats, getTotals } from "@/lib/adminStats";
import { demoAllowed } from "@/lib/demoFlag";
import { getDemoStats } from "@/lib/demoStats";
import { RANGES } from "@/lib/statsMath";

// آمار داشبورد: ?days=7|30|90 (پیش‌فرض ۳۰). فقط ادمین؛ همیشه تازه از دیتابیس.
// ?demo=1 آمار ساختگی می‌دهد (فقط وقتی lib/demoFlag.js اجازه بدهد، یعنی در توسعه): چیزی نمی‌نویسد و فقط شمارش بخش‌ها واقعی است
export async function GET(req) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const url = new URL(req.url);
    const raw = url.searchParams.get("days");
    const days = raw === null ? 30 : Number(raw);
    if (!RANGES.includes(days)) {
      return NextResponse.json({ error: "بازهٔ زمانی نامعتبر است" }, { status: 400 });
    }

    const demo = url.searchParams.get("demo") === "1" && demoAllowed();
    const stats = demo ? getDemoStats(days, await getTotals()) : await getAdminStats(days);
    return NextResponse.json(stats, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error building admin stats:", { message: error.message, stack: error.stack });
    return NextResponse.json({ error: "خطا در دریافت آمار" }, { status: 500 });
  }
}
