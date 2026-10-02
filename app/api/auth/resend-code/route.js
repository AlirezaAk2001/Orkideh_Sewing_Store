import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { issueVerificationCode, sendVerificationEmail, normalizeEmail, verifyAttemptsKey } from "@/lib/verification";
import { hit, limitByIp, reset, tooManyRequests } from "@/lib/rateLimit";

// جلوی ایمیل‌ریزی: بین دو ارسال برای یک ایمیل ۶۰ ثانیه فاصله، حداکثر ۵ بار در ساعت برای هر ایمیل و ۱۰ بار در ساعت برای هر IP
const COOLDOWN_SEC = 60;
const MAX_PER_EMAIL_PER_HOUR = 5;
const MAX_PER_IP_PER_HOUR = 10;

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "ایمیل الزامی است." }, { status: 400 });
    }

    // شمارنده‌ها بدون توجه به وجود حساب اعمال می‌شوند و پاسخ همیشه یکی است، پس وجود حساب لو نمی‌رود
    const normalized = normalizeEmail(email);
    const cooldown = hit(`resend-cooldown:${normalized}`, 1, COOLDOWN_SEC);
    if (cooldown.limited) return tooManyRequests(cooldown.retryAfter, "کد تأیید به‌تازگی ارسال شده است.");
    const hourly = hit(`resend:${normalized}`, MAX_PER_EMAIL_PER_HOUR, 60 * 60);
    if (hourly.limited) return tooManyRequests(hourly.retryAfter, "تعداد درخواست ارسال کد برای این ایمیل زیاد است.");
    const byIp = limitByIp(req, "resend", MAX_PER_IP_PER_HOUR, 60 * 60);
    if (byIp) return tooManyRequests(byIp.retryAfter, "تعداد درخواست ارسال کد از این شبکه زیاد است.");

    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: "insensitive" } },
    });

    if (user && !user.is_verified) {
      const code = await issueVerificationCode(user.id);
      reset(verifyAttemptsKey(email)); // حدس‌های اشتباهِ کد قبلی به کد جدید ربطی ندارند

      try {
        await sendVerificationEmail({ to: user.email, name: user.name, code });
      } catch (mailError) {
        console.error("Resend verification mail error:", mailError.message);
        return NextResponse.json(
          { error: "ارسال ایمیل ناموفق بود. چند دقیقه بعد دوباره تلاش کنید." },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ message: "اگر این ایمیل در انتظار تأیید باشد، کد جدید برایش ارسال شد." });
  } catch (error) {
    console.error("Resend code error:", error.message);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}
