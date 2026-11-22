import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { openVideo, readUpload, videoInfo } from "@/lib/uploads";

const HEADERS = { "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" };

// بازهٔ یک‌تکه‌ای «bytes=start-end» (یا «bytes=start-» و «bytes=-n» برای n بایت آخر) را به { start, end } تبدیل می‌کند؛ بدون هدر: null (کل فایل)، نامعتبر: "invalid"
function parseRange(header, size) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (match[1] === "" && match[2] === "")) return "invalid";
  let start;
  let end;
  if (match[1] === "") {
    const last = Number(match[2]);
    if (last === 0) return "invalid";
    start = Math.max(size - last, 0);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
  }
  return start > end || start >= size ? "invalid" : { start, end };
}

// ویدیو: جریان تکه‌تکه با پشتیبانی از Range (۲۰۶)، تا پخش سریع شروع شود و جلو و عقب بردن کار کند
async function serveVideo(req, name) {
  const info = await videoInfo(name);
  if (!info) return new NextResponse("Not Found", { status: 404 });

  const range = parseRange(req.headers.get("range"), info.size);
  if (range === "invalid") {
    return new NextResponse(null, { status: 416, headers: { ...HEADERS, "Content-Range": `bytes */${info.size}` } });
  }
  const start = range ? range.start : 0;
  const end = range ? range.end : info.size - 1;
  // فایل خالی: جریان بی‌بایت نمی‌شود ساخت
  if (info.size === 0) return new NextResponse(null, { headers: { ...HEADERS, "Content-Type": info.type, "Content-Length": "0", "Accept-Ranges": "bytes" } });

  const stream = Readable.toWeb(openVideo(name, start, end));
  return new NextResponse(stream, {
    status: range ? 206 : 200,
    headers: {
      ...HEADERS,
      "Content-Type": info.type,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
      ...(range && { "Content-Range": `bytes ${start}-${end}/${info.size}` }),
    },
  });
}

// سرو فایل‌های آپلودشدهٔ ادمین (lib/uploads.js): تصویر یک‌جا و ویدیو با Range. نام فایل تصادفی و یکتاست و هیچ‌وقت عوض نمی‌شود، پس کش بلندمدت امن است.
export async function GET(req, { params }) {
  const { name } = await params;
  if (typeof name === "string" && /\.(mp4|webm)$/.test(name)) return serveVideo(req, name);

  const file = await readUpload(name);
  if (!file) return new NextResponse("Not Found", { status: 404 });
  return new NextResponse(file.buffer, {
    headers: {
      ...HEADERS,
      "Content-Type": file.type,
      "Content-Length": String(file.buffer.length),
    },
  });
}
