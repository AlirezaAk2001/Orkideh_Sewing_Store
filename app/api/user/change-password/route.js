import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { isAcceptablePassword, PASSWORD_RULE_MESSAGE } from "@/lib/validation";
import { hit, peek, reset, tooManyRequests } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";

// جلوی حدس‌زدن رمز فعلی با یک توکن دزدیده‌شده: فقط ۵ رمز اشتباه در ۱۵ دقیقه برای هر کاربر
const MAX_FAILS = 5;
const FAIL_WINDOW_SEC = 15 * 60;

export async function PUT(req) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  try {
    // شناسهٔ کاربر از توکن می‌آید؛ userId داخل body نادیده گرفته می‌شود
    const userId = auth.user.id;
    const failKey = `change-password:${userId}`;
    const lock = peek(failKey, MAX_FAILS);
    if (lock.limited) {
      return tooManyRequests(lock.retryAfter, "تعداد تلاش‌های ناموفق برای تغییر رمز زیاد است.");
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
    }
    if (!isAcceptablePassword(newPassword)) {
      return NextResponse.json({ error: PASSWORD_RULE_MESSAGE }, { status: 400 });
    }

    // پیدا کردن کاربر (فقط هش رمز لازم است)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password_hash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "کاربر پیدا نشد" }, { status: 404 });
    }

    // بررسی پسورد فعلی
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      hit(failKey, MAX_FAILS, FAIL_WINDOW_SEC);
      return NextResponse.json({ error: "پسورد فعلی اشتباه است" }, { status: 400 });
    }
    reset(failKey);

    // هش کردن پسورد جدید
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // آپدیت پسورد
    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: hashedPassword },
    });

    return NextResponse.json({ message: "پسورد با موفقیت تغییر کرد" });
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}