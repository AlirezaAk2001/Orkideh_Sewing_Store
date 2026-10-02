import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * بررسی مرکزی توکن برای routeهای API (فقط سمت سرور).
 *
 *   const auth = await requireAdmin(req);
 *   if (auth.error) return auth.error; // پاسخ آمادهٔ 401 / 403 / 500
 *   const { user } = auth;             // کاربر از دیتابیس، بدون password_hash
 *
 * - توکن باید در هدر `Authorization: Bearer <token>` باشد.
 * - 401: توکن نیست، نامعتبر یا منقضی است، یا کاربرش دیگر وجود ندارد.
 * - 403: توکن معتبر است ولی کاربر ادمین نیست (فقط در requireAdmin).
 * - ادمین‌بودن از دیتابیس خوانده می‌شود، نه از ادعای داخل توکن؛ پس اگر
 *   دسترسی ادمینی برداشته شود، همان لحظه اعمال می‌شود.
 */

const fail = (message, status) => ({
  error: NextResponse.json({ error: message }, { status }),
});

export async function requireUser(req) {
  const header = req.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return fail("توکن ارائه نشده است", 401);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET تنظیم نشده است");
    return fail("مشکل سرور: JWT_SECRET تنظیم نشده است", 500);
  }

  let decoded;
  try {
    decoded = jwt.verify(header.slice(7).trim(), secret, { algorithms: ["HS256"] });
  } catch {
    return fail("توکن نامعتبر یا منقضی شده", 401);
  }

  // فقط توکن‌هایی که با id عددی کاربر ساخته شده‌اند پذیرفته می‌شوند
  if (!Number.isInteger(decoded?.id)) {
    return fail("توکن نامعتبر یا منقضی شده", 401);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        is_admin: true,
        is_verified: true,
      },
    });
    if (!user) return fail("توکن نامعتبر یا منقضی شده", 401);
    return { user };
  } catch (error) {
    console.error("خطا در بررسی کاربر توکن:", error.message);
    return fail("خطای داخلی سرور", 500);
  }
}

// ایمیل‌هایی که بعد از «تأیید ایمیل» ادمین می‌شوند (ADMIN_EMAILS با کاما جدا می‌شود).
// ادمین‌شدن عمداً موقع ثبت‌نام نیست؛ وگرنه هر کسی می‌توانست با ایمیل ادمین ثبت‌نام کند و بدون مالکیت آن ایمیل ادمین شود.
export function isAdminEmail(email) {
  const list = (process.env.ADMIN_EMAILS || "poshtibani.orkideh@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(String(email || "").toLowerCase());
}

export async function requireAdmin(req) {
  const auth = await requireUser(req);
  if (auth.error) return auth;
  if (!auth.user.is_admin) return fail("دسترسی غیرمجاز", 403);
  return auth;
}
