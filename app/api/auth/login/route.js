import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { clientIp, hit, peek, reset, tooManyRequests } from "@/lib/rateLimit";

// فقط تلاش‌های ناموفق شمرده می‌شوند. قفل برای «حساب + IP» است، پس کسی نمی‌تواند از جای دیگر
// حساب دیگران (مثلاً ادمین) را قفل کند؛ سقف جداگانه‌ای هم برای کل IP هست (پشت NAT چند کاربر یک IP دارند).
const MAX_FAILS_PER_ACCOUNT = 5;
const MAX_FAILS_PER_IP = 50;
const FAIL_WINDOW_SEC = 15 * 60;

export async function POST(req) {
  try {
    const body = await req.json();
    // به جای email، یک متغیر کلی به نام identifier دریافت می‌کنیم
    const { identifier, password } = body;

    if (!identifier || !password || typeof identifier !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "ایمیل/نام کاربری و رمز عبور الزامی است." },
        { status: 400 }
      );
    }

    const ip = clientIp(req);
    const accountKey = `login:${identifier.trim().toLowerCase().slice(0, 200)}|${ip || "unknown"}`;
    const ipKey = ip ? `login-ip:${ip}` : null;

    const accountLock = peek(accountKey, MAX_FAILS_PER_ACCOUNT);
    const ipLock = ipKey ? peek(ipKey, MAX_FAILS_PER_IP) : { limited: false, retryAfter: 0 };
    if (accountLock.limited || ipLock.limited) {
      return tooManyRequests(
        Math.max(accountLock.retryAfter, ipLock.retryAfter),
        "تعداد تلاش‌های ناموفق برای ورود زیاد است."
      );
    }

    const recordFailure = () => {
      hit(accountKey, MAX_FAILS_PER_ACCOUNT, FAIL_WINDOW_SEC);
      if (ipKey) hit(ipKey, MAX_FAILS_PER_IP, FAIL_WINDOW_SEC);
    };

    // 🔎 کاربر رو از دیتابیس با ایمیل یا نام کاربری پیدا کن
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      },
    });

    if (!user) {
      recordFailure();
      return NextResponse.json(
        { error: "کاربری با این مشخصات یافت نشد." },
        { status: 404 }
      );
    }

    if (!user.password_hash) {
      console.error("❌ کاربر بدون password_hash:", user);
      return NextResponse.json(
        { error: "این کاربر رمز عبور ندارد." },
        { status: 500 }
      );
    }

    // 🔑 بررسی پسورد
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      recordFailure();
      return NextResponse.json(
        { error: "رمز عبور اشتباه است." },
        { status: 401 },
      );
    }
    reset(accountKey);

    // ایمیل تأییدنشده: بعد از درست‌بودن رمز اعلام می‌شود (تا وضعیت حساب برای رمز اشتباه لو نرود)
    if (!user.is_verified) {
      return NextResponse.json(
        {
          error: "ایمیل شما هنوز تأیید نشده است. کد تأیید را وارد کنید.",
          code: "EMAIL_NOT_VERIFIED",
          email: user.email,
        },
        { status: 403 }
      );
    }

    // ✅ بررسی JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET تنظیم نشده");
      return NextResponse.json(
        { error: "مشکل سرور: JWT_SECRET تنظیم نشده است." },
        { status: 500 }
      );
    }

    // 🪙 ساخت توکن
    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return NextResponse.json({
      message: "ورود موفق",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        is_admin: user.is_admin,
        is_verified: user.is_verified,
        role: user.is_admin ? "admin" : "user",
      },
      token,
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور", details: error.message },
      { status: 500 }
    );
  }
}