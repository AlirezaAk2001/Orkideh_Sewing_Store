"use client";

import { useCallback, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

// آپلود یک تصویر برای فرم بنر و دسته‌بندی (همان /api/admin/upload فرم محصول). اعتبارسنجی سمت کاربر با سقف و نوع‌های سرور (lib/uploads.js) یکی است تا
// فایل بد بدون رفت‌وبرگشت رد شود؛ سرور هر بار نوع را از خود بایت‌ها دوباره بررسی می‌کند. هم‌زمان فقط یک آپلود؛ فایل دوم تا پایان اولی نادیده گرفته می‌شود.
// progress تا وقتی پاسخ سرور نرسیده سقف ۹۹٪ دارد (بایت‌ها فرستاده شده‌اند ولی ذخیره هنوز تمام نشده)
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const ACCEPT_TYPES = IMAGE_ACCEPT.split(",");
const ACCEPT_EXT = /\.(jpe?g|png|webp|avif)$/i;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const fa = (n) => Number(n).toLocaleString("fa-IR");

export function useImageUpload(onUploaded) {
  const [current, setCurrent] = useState(null); // null | { name, progress }
  const busy = useRef(false);

  const upload = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []);
      if (!files.length || busy.current) return;
      const file = files[0];
      if (!ACCEPT_TYPES.includes(file.type) && !ACCEPT_EXT.test(file.name)) {
        toast.error(`${file.name}: فقط تصویر JPG، PNG، WebP یا AVIF`);
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`${file.name}: حجم فایل بیشتر از ${fa(MAX_IMAGE_BYTES / 1024 / 1024)} مگابایت است`);
        return;
      }

      busy.current = true;
      setCurrent({ name: file.name, progress: 0 });
      try {
        const body = new FormData();
        body.append("files", file);
        const { data } = await axios.post("/api/admin/upload", body, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          onUploadProgress: (event) => {
            if (event.total) setCurrent((prev) => prev && { ...prev, progress: Math.min(99, Math.round((event.loaded / event.total) * 100)) });
          },
        });
        const result = data.files?.[0];
        if (result?.url) onUploaded(result.url);
        else toast.error(`${file.name}: ${result?.error || "آپلود ناموفق بود"}`);
      } catch (error) {
        toast.error(`${file.name}: ${error.response?.data?.error || "آپلود ناموفق بود"}`);
      } finally {
        busy.current = false;
        setCurrent(null);
      }
    },
    [onUploaded]
  );

  return { uploading: current !== null, name: current?.name ?? "", progress: current?.progress ?? 0, upload };
}
