import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { hit, tooManyRequests } from "@/lib/rateLimit";
import { issueToken } from "@/lib/session";

// تمدید نشست: با یک توکن معتبر توکن تازه می‌دهد (سایت این را خودش در زمان فعالیت کاربر صدا می‌زند، نه موقع هر کلیک).
// نقش (ادمین یا کاربر) از دیتابیس خوانده می‌شود، نه از ادعای توکن؛ و از «سقف عمر ورود» (lib/session.js) رد نمی‌شود
const MAX_PER_HOUR = 30;

export async function POST(req) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;
  const { user, claims } = auth;

  const rl = hit(`refresh:${user.id}`, MAX_PER_HOUR, 3600);
  if (rl.limited) return tooManyRequests(rl.retryAfter);

  // توکن‌های قدیمی (قبل از این قابلیت) auth_time ندارند؛ زمان صدورشان همان زمان ورود است
  const authTime = Number.isInteger(claims.auth_time) ? claims.auth_time : claims.iat;
  const issued = issueToken(user, { authTime });
  if (!issued) {
    return NextResponse.json({ error: "نشست شما به پایان رسید. دوباره وارد شوید." }, { status: 401 });
  }

  return NextResponse.json({ token: issued.token, expiresAt: issued.exp }, { headers: { "Cache-Control": "no-store" } });
}
