import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { limitByIp, tooManyRequests } from "@/lib/rateLimit";

export async function POST(req) {
  const limited = limitByIp(req, "google", 20, 15 * 60);
  if (limited) return tooManyRequests(limited.retryAfter);

  try {
    const { code } = await req.json();

    // تبدیل code به token با Google
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: "http://localhost:3000/auth/google/callback",
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description);

    // گرفتن اطلاعات کاربر از Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();

    // ایمیلی که Google تأیید نکرده نباید جای تأیید مالکیت ایمیل را بگیرد
    if (googleUser.verified_email === false) {
      return NextResponse.json({ error: "ایمیل حساب Google شما تأیید نشده است." }, { status: 403 });
    }

    const email = googleUser.email.toLowerCase();

    // پیدا کردن یا ساختن کاربر در دیتابیس
    let user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: googleUser.name || email.split("@")[0],
          email,
          username: email.split("@")[0] + "_" + Date.now(),
          password_hash: "",
          profileImageUrl: googleUser.picture,
          is_verified: true,
        },
      });
    } else if (!user.is_verified) {
      // Google مالکیت این ایمیل را تأیید کرده؛ حسابی که با رمز ساخته شده و هنوز تأیید نشده بود هم تأیید می‌شود
      user = await prisma.user.update({ where: { id: user.id }, data: { is_verified: true } });
    }

    // ساخت JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        is_admin: user.is_admin,
        is_verified: user.is_verified,
        role: user.is_admin ? "admin" : "user",
      },
    });
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}