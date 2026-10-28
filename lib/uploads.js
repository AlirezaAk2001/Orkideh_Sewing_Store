// تصویرهای آپلودشدهٔ ادمین (فقط سمت سرور). فایل‌ها در پوشهٔ UPLOAD_DIR (پیش‌فرض uploads/ کنار پروژه، بیرون از public) ذخیره می‌شوند
// و از مسیر /uploads/<نام> (app/uploads/[name]/route.js) سرو می‌شوند؛ نکست فایل‌هایی را که بعد از build به public اضافه شوند سرو نمی‌کند.
// این پوشه مثل دیتابیس باید پشتیبان‌گیری شود و روی سرور پایدار باشد (روی هاست‌های فقط‌خواندنی مثل ورسل کار نمی‌کند).

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import prisma from "@/lib/prisma";
import { UPLOADS_PREFIX } from "@/lib/productImages";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_FILES_PER_REQUEST = 10;

// نام فایل ذخیره‌شده همیشه از این الگو می‌آید؛ هر نام دیگری (مسیر بالا رفتن، پسوند اجرایی، ...) اصلاً به دیسک نمی‌رسد
const NAME_PATTERN = /^[a-z0-9]{6,12}-[a-f0-9]{16}\.(jpg|png|webp|avif)$/;
const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };

// turbopackIgnore: مسیر در زمان اجرا از env/cwd می‌آید؛ بدون این، Turbopack هنگام build کل پروژه را «ردیابی» و در خروجی سرور می‌گذارد
export const uploadDir = () =>
  process.env.UPLOAD_DIR ? path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR) : path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads");
const filePath = (name) => path.join(/*turbopackIgnore: true*/ uploadDir(), name);

// نوع تصویر از خود بایت‌ها تشخیص داده می‌شود، نه از پسوند یا Content-Type که کاربر می‌فرستد. SVG عمداً پذیرفته نمی‌شود (می‌تواند اسکریپت داشته باشد)
export function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buffer.toString("latin1", 0, 4) === "RIFF" && buffer.toString("latin1", 8, 12) === "WEBP") return "webp";
  if (buffer.toString("latin1", 4, 8) === "ftyp" && ["avif", "avis"].includes(buffer.toString("latin1", 8, 12))) return "avif";
  return null;
}

// فایل را ذخیره می‌کند و { name, url } برمی‌گرداند؛ نوع نامعتبر: null
export async function saveUpload(buffer) {
  const ext = detectImageType(buffer);
  if (!ext) return null;
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
  await fs.mkdir(uploadDir(), { recursive: true });
  await fs.writeFile(filePath(name), buffer, { flag: "wx" });
  return { name, url: `${UPLOADS_PREFIX}${name}` };
}

// { buffer, type } یا null (نام نامعتبر یا فایل نبود)
export async function readUpload(name) {
  if (typeof name !== "string" || !NAME_PATTERN.test(name)) return null;
  try {
    const buffer = await fs.readFile(filePath(name));
    return { buffer, type: TYPES[name.split(".").pop()] };
  } catch {
    return null;
  }
}

const nameFromRef = (ref) => {
  if (typeof ref !== "string" || !ref.startsWith(UPLOADS_PREFIX)) return null;
  const name = ref.slice(UPLOADS_PREFIX.length);
  return NAME_PATTERN.test(name) ? name : null;
};

// بعد از ویرایش یا حذف محصول: فایل‌های آپلودشده‌ای که دیگر هیچ محصولی به آن‌ها اشاره نمی‌کند پاک می‌شوند تا دیسک پر از فایل بی‌صاحب نشود.
// خطا هیچ‌وقت ذخیرهٔ اصلی را خراب نمی‌کند؛ بدترین حالت یک فایل اضافه روی دیسک است.
export async function removeUnusedUploads(refs) {
  for (const ref of new Set(refs)) {
    const name = nameFromRef(ref);
    if (!name) continue;
    try {
      const inUse = await prisma.product.count({ where: { OR: [{ image: ref }, { images: { has: ref } }] } });
      if (!inUse) await fs.unlink(filePath(name));
    } catch (error) {
      if (error?.code !== "ENOENT") console.warn("Could not remove unused upload:", name, error?.message);
    }
  }
}
