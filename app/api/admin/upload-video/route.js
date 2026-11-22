import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { saveVideoUpload } from "@/lib/uploads";
import { MAX_VIDEO_BYTES } from "@/lib/productVideo";

// آپلود ویدیوی کوتاه محصول (فقط ادمین): فیلد فرم «file» (یک فایل MP4 یا WebM تا MAX_VIDEO_BYTES).
// نوع فایل از خود بایت‌ها تشخیص داده می‌شود، نه از پسوند یا Content-Type ارسالی. پاسخ: { url } یا { error } با ۴۰۰.
// مسیر زیر /api است، پس از proxy.js (و سقف ۱۰ مگابایتیِ بافر بدنهٔ آن) رد می‌شود.
export async function POST(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  let form;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "درخواست آپلود نامعتبر است" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "فایلی ارسال نشده است" }, { status: 400 });
  if (file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: `حجم ویدیو بیشتر از ${MAX_VIDEO_BYTES / 1024 / 1024} مگابایت است` }, { status: 400 });
  }

  try {
    const saved = await saveVideoUpload(Buffer.from(await file.arrayBuffer()));
    if (!saved) return NextResponse.json({ error: "فقط ویدیوی MP4 یا WebM پذیرفته می‌شود" }, { status: 400 });
    return NextResponse.json({ url: saved.url });
  } catch (error) {
    console.error("Error saving video upload:", { message: error.message, code: error.code });
    return NextResponse.json({ error: "ذخیرهٔ ویدیو روی سرور ناموفق بود" }, { status: 500 });
  }
}
