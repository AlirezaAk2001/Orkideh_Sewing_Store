import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminEmail } from "@/lib/auth";

export async function POST(req) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "ایمیل و کد الزامی است" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    const verification = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        code: code,
      },
      orderBy: { created_at: "desc" },
    });

    if (!verification) {
      return NextResponse.json({ error: "کد یافت نشد" }, { status: 400 });
    }

    if (new Date() > verification.expires_at) {
      return NextResponse.json({ error: "کد منقضی شده است" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { is_verified: true, ...(isAdminEmail(user.email) ? { is_admin: true } : {}) },
    });

    return NextResponse.json({ message: "ایمیل با موفقیت تأیید شد" }, { status: 200 });
  } catch (err) {
    console.error("Verify error:", err.message, err.stack);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}