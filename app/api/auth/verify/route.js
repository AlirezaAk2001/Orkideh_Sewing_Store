import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminEmail } from "@/lib/auth";
import { verifyAttemptsKey } from "@/lib/verification";
import { clientIp, hit, peek, reset, tooManyRequests } from "@/lib/rateLimit";

// کد ۶ رقمی فقط چند بار قابل حدس‌زدن است. شمارنده برای «ایمیل» است نه IP؛ وگرنه با چند IP می‌شد کد را
// حدس زد و مثلاً با ایمیل ادمین ادمین شد. با کد جدید (resend-code) شمارنده صفر می‌شود.
const MAX_FAILS_PER_EMAIL = 5;
const MAX_FAILS_PER_IP = 30;
const FAIL_WINDOW_SEC = 15 * 60;

export async function POST(req) {
  try {
    const { email, code } = await req.json();

    if (!email || !code || typeof email !== "string") {
      return NextResponse.json({ error: "ایمیل و کد الزامی است" }, { status: 400 });
    }

    const emailKey = verifyAttemptsKey(email);
    const ip = clientIp(req);
    const ipKey = ip ? `verify-ip:${ip}` : null;

    const emailLock = peek(emailKey, MAX_FAILS_PER_EMAIL);
    const ipLock = ipKey ? peek(ipKey, MAX_FAILS_PER_IP) : { limited: false, retryAfter: 0 };
    if (emailLock.limited || ipLock.limited) {
      return tooManyRequests(
        Math.max(emailLock.retryAfter, ipLock.retryAfter),
        "تعداد تلاش‌های ناموفق برای وارد کردن کد زیاد است."
      );
    }

    const recordFailure = () => {
      hit(emailKey, MAX_FAILS_PER_EMAIL, FAIL_WINDOW_SEC);
      if (ipKey) hit(ipKey, MAX_FAILS_PER_IP, FAIL_WINDOW_SEC);
    };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      recordFailure();
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    const verification = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        code: String(code).trim(),
      },
      orderBy: { created_at: "desc" },
    });

    if (!verification) {
      recordFailure();
      return NextResponse.json({ error: "کد یافت نشد" }, { status: 400 });
    }

    if (new Date() > verification.expires_at) {
      recordFailure();
      return NextResponse.json({ error: "کد منقضی شده است" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { is_verified: true, ...(isAdminEmail(user.email) ? { is_admin: true } : {}) },
    });
    reset(emailKey);

    return NextResponse.json({ message: "ایمیل با موفقیت تأیید شد" }, { status: 200 });
  } catch (err) {
    console.error("Verify error:", err.message, err.stack);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}