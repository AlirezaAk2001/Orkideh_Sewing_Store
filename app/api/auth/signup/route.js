import { NextResponse } from 'next/server'; 
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { isAcceptablePassword, PASSWORD_RULE_MESSAGE } from '@/lib/validation';
import { issueVerificationCode, sendVerificationEmail } from '@/lib/verification';
import { limitByIp, tooManyRequests } from '@/lib/rateLimit';

export async function POST(req) {
  // هر ثبت‌نام یک ایمیل از طرف سایت می‌فرستد؛ جلوی استفاده از سایت برای ایمیل‌ریزی گرفته می‌شود
  const limited = limitByIp(req, 'signup', 10, 60 * 60);
  if (limited) return tooManyRequests(limited.retryAfter, 'تعداد درخواست‌های ثبت‌نام از این شبکه زیاد است.');

  try {
    const body = await req.json();
    const { email, username, password, firstName, lastName } = body;

    if (!email || !username || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'تمامی فیلدها الزامی است.' }, { status: 400 });
    }

    if (!isAcceptablePassword(password)) {
      return NextResponse.json({ error: PASSWORD_RULE_MESSAGE }, { status: 400 });
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
        is_verified: false, // ادمین‌شدنِ ایمیل‌های مجاز بعد از تأیید ایمیل انجام می‌شود (api/auth/verify)
        profileImageUrl: '', // مقدار پیش‌فرض
      },
    });

    // ساخت کد تأیید ۶ رقمی (اعتبار ۵ دقیقه) و ارسال ایمیل؛ اگر ایمیل نرسید، کاربر از «ارسال مجدد کد» استفاده می‌کند
    const code = await issueVerificationCode(newUser.id);
    await sendVerificationEmail({ to: email, name: firstName, code });

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