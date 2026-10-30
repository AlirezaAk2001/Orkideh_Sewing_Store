import jwt from "jsonwebtoken";

/**
 * عمر نشست ورود (فقط سمت سرور).
 *
 * - idle: مدت اعتبار هر توکن. تا وقتی کاربر فعال است سایت توکن را خودکار تمدید می‌کند (POST /api/auth/refresh)،
 *   پس این عدد در عمل «مدت بی‌فعالیتی تا خروج خودکار» است.
 * - max: حداکثر عمر یک ورود، حتی با فعالیت دائم؛ بعد از آن باید دوباره رمز وارد شود. auth_time لحظهٔ ورود
 *   واقعی است و در تمدیدها ثابت می‌ماند.
 * ادمین کوتاه‌تر است چون توکنش دسترسی بیشتری دارد.
 */
const HOUR = 60 * 60;
const DAY = 24 * HOUR;

export const SESSION = {
  user: { idle: 7 * DAY, max: 30 * DAY },
  admin: { idle: 12 * HOUR, max: 7 * DAY },
};

// توکن تازه می‌سازد؛ authTime فقط در تمدید داده می‌شود. اگر عمر مجاز نشست تمام شده باشد null برمی‌گرداند
export function issueToken(user, { authTime, now = Math.floor(Date.now() / 1000) } = {}) {
  const life = user.is_admin ? SESSION.admin : SESSION.user;
  const start = Number.isInteger(authTime) && authTime <= now ? authTime : now;
  const exp = Math.min(now + life.idle, start + life.max);
  if (exp <= now) return null;

  const token = jwt.sign(
    { id: user.id, email: user.email, is_admin: user.is_admin, auth_time: start, iat: now, exp },
    process.env.JWT_SECRET
  );
  return { token, exp };
}
