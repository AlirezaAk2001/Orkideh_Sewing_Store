import { NextResponse } from "next/server";
import { limitByIp, tooManyRequests } from "@/lib/rateLimit";
import { NeshanError, mapEnabled, neshanStaticImage, verifyCoords } from "@/lib/neshan";

// تصویر واقعی نقشهٔ کارت‌های آدرس. با <img src> گرفته می‌شود و هدر Authorization ندارد، پس به‌جای ورود کاربر، امضای مختصات (withMapUrl در lib/neshan.js)
// را می‌سنجد: فقط مختصاتی که سرور برای آدرس ثبت‌شده امضا کرده معتبر است. جواب برای هفت روز در مرورگر می‌ماند و درخواست تکراری به نشان نمی‌رسد
export async function GET(req) {
  const params = new URL(req.url).searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  const sig = params.get("s") || "";
  if (!params.get("lat") || !params.get("lng") || !Number.isFinite(lat) || !Number.isFinite(lng) || !verifyCoords(lat, lng, sig)) {
    return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 403 });
  }

  if (!mapEnabled()) {
    return NextResponse.json({ error: "سرویس نقشه تنظیم نشده است", code: "MAP_DISABLED" }, { status: 503 });
  }

  const rl = limitByIp(req, "map-static", 120, 60);
  if (rl) return tooManyRequests(rl.retryAfter);

  try {
    const { body, type } = await neshanStaticImage(lat, lng);
    return new Response(body, { headers: { "Content-Type": type, "Cache-Control": "public, max-age=604800, immutable" } });
  } catch (err) {
    if (!(err instanceof NeshanError)) throw err;
    console.error("Neshan static map failed:", err.code);
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
  }
}
