import { NextResponse } from 'next/server'; 
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, username, password, firstName, lastName } = body;

    if (!email || !username || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'تمامی فیلدها الزامی است.' }, { status: 400 });
    }

    // بررسی کاربر تکراری
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'ایمیل یا نام کاربری قبلاً ثبت شده است.' }, { status: 400 });
    }

    // هش پسورد
    const hashedPassword = await bcrypt.hash(password, 10);

    // ایجاد کاربر
    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        name: `${firstName} ${lastName}`,
        password_hash: hashedPassword,
        is_admin: email === "poshtibani.orkideh@gmail.com" ? true : false, // ایمیل ادمین
        is_verified: false,
        profileImageUrl: '', // مقدار پیش‌فرض
      },
    });

    // ساخت کد تأیید ۶ رقمی + زمان انقضا (۵ دقیقه)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.verificationCode.create({
      data: {
        code,
        expires_at: expiresAt,
        userId: newUser.id,
      },
    });

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
      subject: 'کد تأیید حساب کاربری',
      text: `کد تأیید شما: ${code}`,
      html: `<p>سلام ${firstName} عزیز،</p>
             <p>کد تأیید شما:</p>
             <h2>${code}</h2>
             <p>این کد فقط ۵ دقیقه اعتبار دارد.</p>`,
    });

    return NextResponse.json(
      {
        message: 'ثبت‌نام موفق بود. لطفاً ایمیل خود را بررسی کنید.',
        email: newUser.email,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup Error:', error);
    return NextResponse.json({ error: 'خطای داخلی سرور', details: error.message }, { status: 500 });
  }
}