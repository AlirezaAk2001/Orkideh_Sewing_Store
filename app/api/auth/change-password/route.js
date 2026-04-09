import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const { token, newPassword, confirmPassword } = await req.json();

    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "تمام فیلدها الزامی هستند." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "رمز عبور و تأیید رمز عبور مطابقت ندارند." },
        { status: 400 }
      );
    }

    // بررسی وجود توکن
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: token,
        used: false,
      },
      include: {
        user: true,
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "توکن معتبر نیست یا قبلاً استفاده شده است." },
        { status: 404 }
      );
    }

    // بررسی انقضای توکن
    if (new Date() > resetToken.expires_at) {
      return NextResponse.json(
        { error: "توکن منقضی شده است." },
        { status: 400 }
      );
    }

    // هش کردن رمز عبور جدید
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // آپدیت رمز عبور کاربر
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password_hash: hashedPassword },
    });

    // علامت‌گذاری توکن به عنوان استفاده شده
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // حذف سایر توکن‌های استفاده نشده برای این کاربر
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: resetToken.userId,
        used: false,
      },
    });

    return NextResponse.json({
      message: "رمز عبور با موفقیت تغییر کرد.",
      success: true,
    });

  } catch (error) {
    console.error("Change Password Error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور", details: error.message },
      { status: 500 }
    );
  }
}