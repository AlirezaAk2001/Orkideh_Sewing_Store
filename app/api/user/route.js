import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

// متد GET - برای دریافت اطلاعات کاربر با توکن
export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "توکن ارائه نشده است." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        is_admin: true,
        is_verified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
    }

    const role = user.is_admin ? "admin" : "user";
    return NextResponse.json({
      user: { ...user, role },
    });
  } catch (error) {
    console.error("❌ GET User Error:", error);
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return NextResponse.json({ error: "توکن نامعتبر یا منقضی شده است." }, { status: 401 });
    }
    return NextResponse.json(
      { error: "خطای داخلی سرور", details: error.message },
      { status: 500 }
    );
  }
}

// متد PUT - برای به‌روزرسانی اطلاعات کاربر (مثل username)
export async function PUT(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "توکن ارائه نشده است." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json({ error: "نام کاربری الزامی است." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: decoded.id },
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
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return NextResponse.json({ error: "توکن نامعتبر یا منقضی شده است." }, { status: 401 });
    }
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی اطلاعات کاربر", details: error.message },
      { status: 500 }
    );
  }
}