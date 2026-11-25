"use client";

import { useEffect, useId, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Clapperboard, Video, X } from "lucide-react";
import { TrashCan } from "./ActionIcons";
import VideoPlayer from "./VideoPlayer";
import { MAX_VIDEO_BYTES, VIDEO_EXT, VIDEO_TYPES } from "@/lib/productVideo";

// ویدیوی کوتاه محصول در فرم‌های افزودن و ویرایش ادمین (کنار ProductImagesField). value مسیر ویدیوی آپلودشده (/uploads/…) یا رشتهٔ خالی است
// و onChange مسیر تازه یا "" را می‌گیرد. فایل با انتخاب یا کشیدن‌ورها کردن به /api/admin/upload-video می‌رود؛ نوار پیشرفت واقعی است (axios onUploadProgress)
// و آپلود در جریان قابل لغو است. onBusyChange(true) تا وقتی آپلودی در جریان است، تا فرم دکمهٔ ذخیره را قفل کند.
// حذف یا جایگزینی فقط در فرم اعمال می‌شود؛ فایل قبلی هنگام «ذخیره» روی سرور پاک می‌شود (app/api/admin/products).
const ACCEPT = [...VIDEO_TYPES, ".mp4", ".webm"].join(",");

const fa = (n) => Number(n).toLocaleString("fa-IR");

// آیکون «جایگزینی ویدیو»: همان ترکیب آیکون «جایگزینی با تصویر دیگر» (mdiImageSyncOutline در admin/_form/ImagePreviewField) با آیکون Video لوسید به‌جای تصویر.
// نشان هم‌گام‌سازی گوشهٔ پایین-راست عیناً همان زیرمسیرهای آخر mdiImageSyncOutline است (همان اندازه و جا). ویدیو کمی کوچک‌تر و بالا-چپ می‌نشیند و دایرهٔ ماسک (شعاع ۶٫۳ دور مرکز نشان)
// دور نشان را از خط‌های ویدیو خالی می‌کند، مثل بریدگیِ قاب تصویر در آیکون MDI؛ ماسک شفاف است، پس روی هر زمینه‌ای (سفید، صورتی کم‌رنگ) درست دیده می‌شود
const SYNC_BADGE =
  "M19 13.5V12L16.75 14.25L19 16.5V15C20.38 15 21.5 16.12 21.5 17.5C21.5 17.9 21.41 18.28 21.24 18.62L22.33 19.71C22.75 19.08 23 18.32 23 17.5C23 15.29 21.21 13.5 19 13.5M19 20C17.62 20 16.5 18.88 16.5 17.5C16.5 17.1 16.59 16.72 16.76 16.38L15.67 15.29C15.25 15.92 15 16.68 15 17.5C15 19.71 16.79 21.5 19 21.5V23L21.25 20.75L19 18.5V20Z";

function VideoSyncIcon({ className }) {
  const maskId = `vsm${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" />
        <circle cx="19" cy="17.5" r="6.3" fill="black" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <Video x="0.5" y="1" width="17" height="17" strokeWidth={2.6} />
      </g>
      <path d={SYNC_BADGE} fill="currentColor" />
    </svg>
  );
}

const actionButton =
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

export default function ProductVideoField({ value, onChange, onBusyChange, disabled = false }) {
  const [upload, setUpload] = useState(null); // آپلود در جریان: { name, progress } یا null
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const inputId = useId();
  const busy = upload !== null;

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  // خروج از صفحه وسط آپلود، آن را لغو می‌کند
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (file) => {
    if (!file || disabled || busy) return;
    if (!VIDEO_TYPES.includes(file.type) && !VIDEO_EXT.test(file.name)) {
      toast.error(`${file.name}: فقط ویدیوی MP4 یا WebM`);
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error(`${file.name}: حجم ویدیو بیشتر از ${fa(MAX_VIDEO_BYTES / 1024 / 1024)} مگابایت است`);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setUpload({ name: file.name, progress: 0 });
    try {
      const body = new FormData();
      body.append("file", file);
      const { data } = await axios.post("/api/admin/upload-video", body, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        signal: controller.signal,
        // تا پاسخ سرور نرسیده روی ۹۹ می‌ماند: بایت‌ها رفته‌اند ولی هنوز ذخیره و بررسی نشده‌اند
        onUploadProgress: (event) => {
          if (event.total) setUpload((cur) => (cur ? { ...cur, progress: Math.min(99, Math.round((event.loaded / event.total) * 100)) } : cur));
        },
      });
      if (data?.url) onChange(data.url);
      else toast.error(`${file.name}: آپلود ناموفق بود`);
    } catch (error) {
      if (!axios.isCancel(error)) toast.error(`${file.name}: ${error.response?.data?.error || "آپلود ویدیو ناموفق بود"}`);
    } finally {
      abortRef.current = null;
      setUpload(null);
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    send(event.dataTransfer?.files?.[0]);
  };

  return (
    <div dir="rtl" role="group" aria-labelledby="product-video-title" className="font-[inherit]">
      <h3 id="product-video-title" className="sr-only">
        ویدیوی محصول
      </h3>

      {busy ? (
        <div role="status" className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-6 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand-600 ring-1 ring-brand-100">
            <Clapperboard className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="max-w-full break-all text-xs text-gray-600" dir="ltr">
            {upload.name}
          </span>
          <span className="block h-2 w-full max-w-sm overflow-hidden rounded-full bg-brand-100" aria-hidden="true">
            <span className="block h-full rounded-full bg-brand-600 transition-[width] duration-300" style={{ width: `${upload.progress}%` }} />
          </span>
          <span className="text-xs font-medium text-brand-700">{upload.progress >= 99 ? "در حال ذخیره و بررسی ویدیو…" : `در حال آپلود… ${fa(upload.progress)}٪`}</span>
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className={`${actionButton} border-gray-300 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            لغو آپلود
          </button>
        </div>
      ) : value ? (
        <div className="grid items-start gap-4 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          {/* پیش‌نمایش با پخش‌کنندهٔ سفارشی سایت (VideoPlayer: دکمهٔ بزرگ پخش، نوار شیشه‌ای، سرعت، تمام‌صفحه، پخش دوباره)؛ فقط اندازه و اولین فریم بار می‌شود، نه کل فایل.
              key: با جایگزینی ویدیو پخش‌کننده از اول ساخته می‌شود (زمان و خطای فایل قبلی نماند) */}
          <VideoPlayer key={value} src={value} label="ویدیوی محصول" className="aspect-video w-full ring-1 ring-gray-200" />
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-7 text-gray-600">این ویدیو در صفحهٔ محصول، در بخش «ویدیوی محصول» و با یک کوچک‌نما کنار تصویرها نمایش داده می‌شود. تغییر بعد از کلیک بر روی دکمۀ «ذخیره» اعمال می‌شود.</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                className={`${actionButton} border-gray-300 bg-white text-gray-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700`}
              >
                <VideoSyncIcon className="h-[22px] w-[22px] shrink-0" />
                جایگزینی ویدیو
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange("")}
                className={`${actionButton} border-gray-300 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600`}
              >
                <TrashCan className="h-4 w-4" />
                حذف ویدیو
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`group flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-100 ${
            disabled
              ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
              : dragging
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-gray-300 bg-gray-50/70 text-gray-600 hover:border-brand-500 hover:bg-brand-50/60"
          }`}
        >
          <span
            className={`grid h-12 w-12 place-items-center rounded-2xl ring-1 transition duration-300 ${
              disabled ? "bg-gray-100 text-gray-400 ring-gray-200" : dragging ? "scale-110 bg-brand-600 text-white ring-brand-600" : "bg-white text-brand-600 ring-brand-100 group-hover:scale-105"
            }`}
          >
            <Clapperboard className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="text-sm font-bold">{dragging ? "رها کنید تا آپلود شود" : "ویدیوی کوتاه محصول را اینجا رها کنید یا برای انتخاب کلیک کنید"}</span>
          <span className="text-xs text-gray-500">MP4 یا WebM؛ تا {fa(MAX_VIDEO_BYTES / 1024 / 1024)} مگابایت؛ یک ویدیو برای هر محصول (اختیاری)</span>
        </label>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        disabled={disabled || busy}
        aria-label="انتخاب ویدیوی محصول"
        onChange={(event) => {
          send(event.target.files?.[0]);
          event.target.value = "";
        }}
        className="sr-only"
      />
    </div>
  );
}
