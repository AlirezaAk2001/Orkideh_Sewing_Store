import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import { hit, limitByIp, tooManyRequests } from "@/lib/rateLimit";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "ایمیل الزامی است." },
        { status: 400 }
      );
    }

    // جلوی ایمیل‌ریزی: ۳ بار در ساعت برای هر ایمیل و ۱۰ بار در ساعت برای هر IP (چه حساب وجود داشته باشد چه نه)
    const byEmail = hit(`forgot:${email.trim().toLowerCase().slice(0, 200)}`, 3, 60 * 60);
    if (byEmail.limited) {
      return tooManyRequests(byEmail.retryAfter, "تعداد درخواست بازیابی رمز برای این ایمیل زیاد است.");
    }
    const byIp = limitByIp(req, "forgot", 10, 60 * 60);
    if (byIp) return tooManyRequests(byIp.retryAfter, "تعداد درخواست بازیابی رمز از این شبکه زیاد است.");

    // بررسی وجود کاربر
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "کاربری با این ایمیل یافت نشد." },
        { status: 404 }
      );
    }

    // ایجاد توکن بازیابی منحصر به فرد
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 دقیقه اعتبار

    // ذخیره توکن در دیتابیس
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        expires_at: expiresAt,
        userId: user.id,
        used: false,
      },
    });

    // ساخت لینک بازیابی
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

    // ارسال ایمیل
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"پشتیبانی سایت" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'بازیابی رمز عبور',
      text: `برای بازیابی رمز عبور روی لینک زیر کلیک کنید: ${resetLink}`,
      html: `
        <div dir="rtl">
          <p>سلام ${user.name} عزیز،</p>
          <p>برای بازیابی رمز عبور حساب کاربری خود، روی لینک زیر کلیک کنید:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetLink}" 
               style="background-color: #4CAF50; 
                      color: white; 
                      padding: 12px 24px; 
                      text-decoration: none; 
                      border-radius: 5px;
                      font-weight: bold;
                      display: inline-block;">
              بازیابی رمز عبور
            </a>
          </div>
          <p>یا می‌توانید لینک زیر را کپی کرده و در مرورگر خود باز کنید:</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all;">
            ${resetLink}
          </p>
          <p style="color: #666; font-size: 14px;">
            این لینک به مدت ۳۰ دقیقه اعتبار دارد.
          </p>
          <p style="color: #ff0000; font-size: 12px;">
            توجه: اگر شما این درخواست را انجام نداده‌اید، این ایمیل را نادیده بگیرید.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">
            این ایمیل به صورت خودکار ارسال شده است. لطفاً به آن پاسخ ندهید.
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      message: "لینک بازیابی رمز عبور به ایمیل شما ارسال شد.",
      success: true,
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور", details: error.message },
      { status: 500 }
    );
  }
}