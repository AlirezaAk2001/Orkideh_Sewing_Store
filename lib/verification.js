import { randomInt } from "crypto";
import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

/**
 * کد تأیید ایمیل (فقط سمت سرور)؛ هم موقع ثبت‌نام و هم برای «ارسال مجدد کد» استفاده می‌شود.
 */

// مدت اعتبار کد (هم‌خوان با متن ایمیل)
const CODE_TTL_MS = 5 * 60 * 1000;

export const normalizeEmail = (email) => String(email).trim().toLowerCase().slice(0, 200);

// شمارندهٔ حدس‌های اشتباه کد برای یک ایمیل (در route تأیید و «ارسال مجدد کد» مشترک است)
export const verifyAttemptsKey = (email) => `verify:${normalizeEmail(email)}`;

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// یک کد ۶ رقمی تازه می‌سازد و کدهای قبلی کاربر را باطل می‌کند (همیشه فقط یک کد معتبر است)
export async function issueVerificationCode(userId) {
  const code = String(randomInt(100000, 1000000)); // crypto، نه Math.random
  await prisma.$transaction([
    prisma.verificationCode.deleteMany({ where: { userId } }),
    prisma.verificationCode.create({
      data: { code, expires_at: new Date(Date.now() + CODE_TTL_MS), userId },
    }),
  ]);
  return code;
}

export async function sendVerificationEmail({ to, name, code }) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"پشتیبانی سایت" <${process.env.EMAIL_USER}>`,
    to,
    subject: "کد تأیید حساب کاربری",
    text: `کد تأیید شما: ${code}`,
    html: `<p>سلام ${escapeHtml(name)} عزیز،</p>
           <p>کد تأیید شما:</p>
           <h2>${code}</h2>
           <p>این کد فقط ۵ دقیقه اعتبار دارد.</p>`,
  });
}
