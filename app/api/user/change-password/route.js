import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req) {
  try {
    const { userId, currentPassword, newPassword } = await req.json();

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
    }

    // پیدا کردن کاربر
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "کاربر پیدا نشد" }, { status: 404 });
    }

    // بررسی پسورد فعلی
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: "پسورد فعلی اشتباه است" }, { status: 400 });
    }

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