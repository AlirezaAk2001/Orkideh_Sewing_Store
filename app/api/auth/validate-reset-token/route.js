import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { limitByIp, tooManyRequests } from "@/lib/rateLimit";

export async function GET(req) {
  const limited = limitByIp(req, "reset-token", 30, 15 * 60);
  if (limited) return tooManyRequests(limited.retryAfter);

  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "توکن الزامی است." },
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

    return NextResponse.json({
      valid: true,
      email: resetToken.user.email,
      userId: resetToken.userId,
    });

  } catch (error) {
    console.error("Validate Token Error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور", details: error.message },
      { status: 500 }
    );
  }
}