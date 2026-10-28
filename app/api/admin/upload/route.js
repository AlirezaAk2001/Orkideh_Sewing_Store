import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { MAX_FILES_PER_REQUEST, MAX_UPLOAD_BYTES, saveUpload } from "@/lib/uploads";

// آپلود تصویر محصول (فقط ادمین): فیلد فرم «files» (یک یا چند فایل).
// پاسخ: { files: [{ name, url } | { name, error }], error? }؛ اگر هیچ‌کدام ذخیره نشود ۴۰۰ است و error پیام اولین خطا را دارد.
export async function POST(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  let form;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "درخواست آپلود نامعتبر است" }, { status: 400 });
  }

  const files = form.getAll("files").filter((file) => typeof file !== "string");
  if (files.length === 0) return NextResponse.json({ error: "فایلی ارسال نشده است" }, { status: 400 });
  if (files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json({ error: `در هر درخواست حداکثر ${MAX_FILES_PER_REQUEST} فایل` }, { status: 400 });
  }

  const results = [];
  for (const file of files) {
    const name = String(file.name || "").slice(0, 120);
    if (file.size > MAX_UPLOAD_BYTES) {
      results.push({ name, error: `حجم فایل بیشتر از ${MAX_UPLOAD_BYTES / 1024 / 1024} مگابایت است` });
      continue;
    }
    try {
      const saved = await saveUpload(Buffer.from(await file.arrayBuffer()));
      results.push(saved ? { name, url: saved.url } : { name, error: "فقط تصویر JPG، PNG، WebP یا AVIF پذیرفته می‌شود" });
    } catch (error) {
      console.error("Error saving upload:", { message: error.message, code: error.code });
      results.push({ name, error: "ذخیرهٔ فایل روی سرور ناموفق بود" });
    }
  }

  const failed = results.find((result) => result.error);
  const anySaved = results.some((result) => result.url);
  return NextResponse.json(anySaved ? { files: results } : { files: results, error: failed?.error }, { status: anySaved ? 200 : 400 });
}
