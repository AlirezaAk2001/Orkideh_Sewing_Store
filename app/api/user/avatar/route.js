import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { hit, tooManyRequests } from "@/lib/rateLimit";
import { AVATAR_MAX_BYTES, AVATAR_SIZE, avatarFields, googleImageOf, isGoogleImage, isUploadRef, storedValueFor } from "@/lib/avatar";
import { detectImageType, imageDimensions, removeUnusedUploads, saveUpload } from "@/lib/uploads";

// آواتار کاربر واردشده. هر دو متد { avatar, googleAvatar } (مقدار نمایشی تازه، lib/avatar.js) برمی‌گردانند.
//   PUT  JSON { type: "initial" | "google" | "preset", key? }  ← حرف اول، عکس گوگل یا یکی از طرح‌های آماده
//   POST multipart با فیلد «file»                                ← عکس شخصی (مرورگر آن را دایره‌ای برش داده و به ۲۵۶×۲۵۶ کوچک کرده است؛ سرور دوباره همه‌چیز را بررسی می‌کند)
// عکسی که دیگر انتخاب کاربر نیست (با تعویض یا برگشت به طرح دیگر) از دیسک پاک می‌شود.

const PHOTO_TYPES = ["jpg", "png", "webp"];
const MAX_SIDE = AVATAR_SIZE * 4; // کلاینت ۲۵۶ می‌فرستد؛ تا این اندازه پذیرفته می‌شود و بیشتر از آن رد (جلوی عکس‌های غول‌پیکر کوچک‌حجم)

const bad = (error, status = 400) => NextResponse.json({ error }, { status });

const selectAvatar = { profileImageUrl: true, googleImageUrl: true };

// عکس گوگلِ کاربرانی که آدرسش هنوز داخل profileImageUrl است (قبل از ستون googleImageUrl) هنگام اولین تغییر به ستون خودش منتقل می‌شود
const keepGoogle = (row) => (!isGoogleImage(row.googleImageUrl) && isGoogleImage(row.profileImageUrl) ? { googleImageUrl: row.profileImageUrl } : {});

const limited = (userId) => {
  const rl = hit(`avatar:user:${userId}`, 20, 60 * 60);
  return rl.limited ? tooManyRequests(rl.retryAfter, "تعداد تغییر آواتار زیاد است.") : null;
};

export async function PUT(req) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;
  const tooMany = limited(auth.user.id);
  if (tooMany) return tooMany;

  let body;
  try {
    body = await req.json();
  } catch {
    return bad("درخواست نامعتبر است.");
  }

  const value = storedValueFor(body?.type, body?.key);
  if (value === undefined) return bad("آواتار انتخاب‌شده نامعتبر است.");

  try {
    const row = await prisma.user.findUnique({ where: { id: auth.user.id }, select: selectAvatar });
    if (!row) return bad("کاربر پیدا نشد.", 404);
    if (body.type === "google" && !googleImageOf(row)) return bad("برای حساب شما عکس گوگل ثبت نشده است.");

    const updated = await prisma.user.update({
      where: { id: auth.user.id },
      data: { profileImageUrl: value, ...keepGoogle(row) },
      select: selectAvatar,
    });
    if (isUploadRef(row.profileImageUrl)) await removeUnusedUploads([row.profileImageUrl]);
    return NextResponse.json({ ...avatarFields(updated), removedPhoto: isUploadRef(row.profileImageUrl) });
  } catch (error) {
    console.error("Error saving avatar choice:", { message: error.message, code: error.code });
    return bad("ذخیرهٔ آواتار انجام نشد.", 500);
  }
}

export async function POST(req) {
  const auth = await requireUser(req);
  if (auth.error) return auth.error;
  const tooMany = limited(auth.user.id);
  if (tooMany) return tooMany;

  let file;
  try {
    file = (await req.formData()).get("file");
  } catch {
    return bad("درخواست آپلود نامعتبر است.");
  }
  if (!file || typeof file === "string") return bad("فایلی ارسال نشده است.");
  if (file.size > AVATAR_MAX_BYTES) return bad(`حجم عکس بیشتر از ${AVATAR_MAX_BYTES / 1024 / 1024} مگابایت است.`);

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!PHOTO_TYPES.includes(detectImageType(buffer))) return bad("فقط عکس JPG، PNG یا WebP پذیرفته می‌شود.");
  const size = imageDimensions(buffer);
  if (!size || size.width < 1 || size.height < 1 || size.width > MAX_SIDE || size.height > MAX_SIDE) {
    return bad("ابعاد عکس نامعتبر است.");
  }

  let saved = null;
  try {
    const row = await prisma.user.findUnique({ where: { id: auth.user.id }, select: selectAvatar });
    if (!row) return bad("کاربر پیدا نشد.", 404);

    saved = await saveUpload(buffer);
    if (!saved) return bad("فقط عکس JPG، PNG یا WebP پذیرفته می‌شود.");

    const updated = await prisma.user.update({
      where: { id: auth.user.id },
      data: { profileImageUrl: saved.url, ...keepGoogle(row) },
      select: selectAvatar,
    });
    if (isUploadRef(row.profileImageUrl)) await removeUnusedUploads([row.profileImageUrl]);
    return NextResponse.json({ ...avatarFields(updated), removedPhoto: false });
  } catch (error) {
    console.error("Error saving avatar photo:", { message: error.message, code: error.code });
    // فایل ذخیره شده ولی ثبتش در دیتابیس نشد: بی‌صاحب روی دیسک نماند
    if (saved) await removeUnusedUploads([saved.url]);
    return bad("ذخیرهٔ عکس انجام نشد.", 500);
  }
}
