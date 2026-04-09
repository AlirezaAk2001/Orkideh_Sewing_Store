import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

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

    // 🔎 کاربر رو از دیتابیس پیدا کن
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "کاربری با این ایمیل یافت نشد." },
        { status: 404 }
      );
    }

    if (!user.password_hash) {
      console.error("❌ کاربر بدون password_hash:", user);
      return NextResponse.json(
        { error: "این کاربر رمز عبور ندارد." },
        { status: 500 }
      );
    }

    // 🔑 بررسی پسورد
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "رمز عبور اشتباه است." },
        { status: 401 },
      );
    }

    // ✅ بررسی JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET تنظیم نشده");
      return NextResponse.json(
        { error: "مشکل سرور: JWT_SECRET تنظیم نشده است." },
        { status: 500 }
      );
    }

    // 🪙 ساخت توکن
    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return NextResponse.json({
      message: "ورود موفق",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        is_admin: user.is_admin,
        is_verified: user.is_verified,
        role: user.is_admin ? "admin" : "user",
      },
      token,
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور", details: error.message },
      { status: 500 }
    );
  }
}