import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

// متد GET - برای دریافت اطلاعات کاربر با توکن
export async function GET(req) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  const role = auth.user.is_admin ? "admin" : "user";
  return NextResponse.json({
    user: { ...auth.user, role },
  });
}

// متد PUT - برای به‌روزرسانی اطلاعات کاربر (مثل username)
export async function PUT(req) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;

  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json({ error: "نام کاربری الزامی است." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: auth.user.id },
      data: { username },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        is_admin: true,
        is_verified: true,
      },
    });

    return NextResponse.json({
      user: { ...user, role: user.is_admin ? "admin" : "user" },
    });
  } catch (error) {
    console.error("❌ PUT User Error:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی اطلاعات کاربر", details: error.message },
      { status: 500 }
    );
  }
}