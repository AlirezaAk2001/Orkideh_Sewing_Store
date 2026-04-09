import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

// متد POST (لاگین)
export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "ایمیل و رمز عبور الزامی است." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        password_hash: true,
        is_admin: true,
        is_verified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "کاربری با این ایمیل یافت نشد." },
        { status: 404 }
      );
    }

    if (!user.password_hash) {
      return NextResponse.json(
        { error: "این کاربر رمز عبور ندارد." },
        { status: 500 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "رمز عبور اشتباه است." },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: "مشکل سرور: JWT_SECRET تنظیم نشده است." },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" } // افزایش زمان انقضا برای تست
    );

    const role = user.is_admin ? "admin" : "user";

    return NextResponse.json({
      message: "ورود موفق",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        is_admin: user.is_admin,
        is_verified: user.is_verified,
        role,
      },
      token,
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

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
  } finally {
    await prisma.$disconnect();
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
  } finally {
    await prisma.$disconnect();
  }
}