import { NextResponse } from "next/server";
import { readUpload } from "@/lib/uploads";

// سرو تصویرهای آپلودشدهٔ ادمین (lib/uploads.js). نام فایل تصادفی و یکتاست و هیچ‌وقت عوض نمی‌شود، پس کش بلندمدت امن است.
export async function GET(req, { params }) {
  const { name } = await params;
  const file = await readUpload(name);
  if (!file) return new NextResponse("Not Found", { status: 404 });
  return new NextResponse(file.buffer, {
    headers: {
      "Content-Type": file.type,
      "Content-Length": String(file.buffer.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
