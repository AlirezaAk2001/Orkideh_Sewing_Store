import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { hit, tooManyRequests } from "@/lib/rateLimit";
import { NeshanError, mapEnabled, neshanJson } from "@/lib/neshan";

// مختصات → آدرس نوشتاری (نشان v5 reverse)؛ فرم آدرس با آن کادر «آدرس» را خودکار پر می‌کند
const inRange = (n, max) => Number.isFinite(n) && Math.abs(n) <= max;

export async function GET(req) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  if (!mapEnabled()) {
    return NextResponse.json({ error: "سرویس نقشه تنظیم نشده است", code: "MAP_DISABLED" }, { status: 503 });
  }

  const rl = hit(`map:reverse:${auth.user.id}`, 60, 60);
  if (rl.limited) return tooManyRequests(rl.retryAfter);

  const params = new URL(req.url).searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  if (!params.get("lat") || !params.get("lng") || !inRange(lat, 90) || !inRange(lng, 180)) {
    return NextResponse.json({ error: "مختصات نامعتبر است" }, { status: 400 });
  }

  try {
    const data = await neshanJson("/v5/reverse", { lat, lng });
    // مکان بی‌آدرس (وسط بیابان، دریا) status غیر OK یا آدرس خالی دارد؛ خطا نیست، فقط چیزی برای پر کردن نیست
    const ok = !data?.status || data.status === "OK";
    return NextResponse.json({
      address: ok ? String(data?.formatted_address ?? "").trim() : "",
      city: ok ? String(data?.city ?? "") : "",
      neighbourhood: ok ? String(data?.neighbourhood ?? "") : "",
    });
  } catch (err) {
    if (!(err instanceof NeshanError)) throw err;
    console.error("Neshan reverse failed:", err.code);
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
  }
}
