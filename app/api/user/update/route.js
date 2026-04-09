import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    return NextResponse.json({ exists: !!existingUser });
  } catch (err) {
    console.error("Error checking username:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const { userId, username } = await req.json();

    if (!userId || !username) {
      return NextResponse.json(
        { error: "userId and username are required" },
        { status: 400 }
      );
    }

    // بروزرسانی کاربر
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { username },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (err) {
    console.error("Update user error:", err);

    // اگر خطای unique constraint باشد
    if (err.code === "P2002" && err.meta?.target?.includes("username")) {
      return NextResponse.json(
        { error: "این نام کاربری قبلاً ثبت شده است." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}