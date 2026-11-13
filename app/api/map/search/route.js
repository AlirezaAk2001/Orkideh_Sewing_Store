import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { hit, tooManyRequests } from "@/lib/rateLimit";
import { NeshanError, mapEnabled, neshanJson } from "@/lib/neshan";

// جستجوی مکان برای فرم آدرس (نشان v3 search). نتیجه‌ها بر اساس نزدیکی به center مرتب می‌شوند و نشان center را اجباری می‌خواهد؛
// پس مرکز فعلی نقشه از کلاینت می‌آید و بدون آن مرکز تهران گذاشته می‌شود
const TEHRAN = { lat: 35.6892, lng: 51.389 };
const MAX_ITEMS = 8;

const inRange = (n, max) => Number.isFinite(n) && Math.abs(n) <= max;

export async function GET(req) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  if (!mapEnabled()) {
    return NextResponse.json({ error: "سرویس نقشه تنظیم نشده است", code: "MAP_DISABLED" }, { status: 503 });
  }

  const rl = hit(`map:search:${auth.user.id}`, 30, 60);
  if (rl.limited) return tooManyRequests(rl.retryAfter);

  const params = new URL(req.url).searchParams;
  const term = (params.get("term") || "").replace(/\s+/g, " ").trim().slice(0, 100);
  if (term.length < 2) return NextResponse.json({ error: "عبارت جستجو را کامل‌تر بنویسید" }, { status: 400 });

  const lat = params.has("lat") ? Number(params.get("lat")) : TEHRAN.lat;
  const lng = params.has("lng") ? Number(params.get("lng")) : TEHRAN.lng;
  if (!inRange(lat, 90) || !inRange(lng, 180)) return NextResponse.json({ error: "مختصات نامعتبر است" }, { status: 400 });

  try {
    const data = await neshanJson("/v3/search", { q: JSON.stringify({ term, center: { latitude: lat, longitude: lng } }) });
    const items = (Array.isArray(data?.items) ? data.items : [])
      .map((it) => ({
        title: String(it?.title ?? ""),
        address: String(it?.address ?? ""),
        region: it?.region ? String(it.region) : "",
        neighbourhood: it?.neighbourhood ? String(it.neighbourhood) : "",
        // نشان: location.x = طول جغرافیایی، location.y = عرض جغرافیایی
        lat: Number(it?.location?.y),
        lng: Number(it?.location?.x),
      }))
      .filter((it) => it.title && inRange(it.lat, 90) && inRange(it.lng, 180))
      .slice(0, MAX_ITEMS);
    return NextResponse.json({ items });
  } catch (err) {
    if (!(err instanceof NeshanError)) throw err;
    console.error("Neshan search failed:", err.code);
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
  }
}
