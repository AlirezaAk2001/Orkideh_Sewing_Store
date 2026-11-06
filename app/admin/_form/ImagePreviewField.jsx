"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheck, ImageOff, Loader2, Trash2, Upload } from "lucide-react";
import AppImage from "@/app/components/AppImage";
import { getImagePath } from "@/app/utils/getImagePath";
import { TextInput } from "./Fields";
import { IMAGE_ACCEPT, MAX_IMAGE_BYTES, useImageUpload } from "./useImageUpload";

// تصویر بنر یا دسته‌بندی در فرم: کادر پیش‌نمایش زنده (نتیجهٔ useImagePreview) که هم محل رها کردن فایل است، دکمهٔ آپلود، و زیرش فیلد نام/آدرس فایل برای تصویرهای
// داخل public/image یا آدرس بیرونی. کادر چهار حالت دارد: خالی (دعوت به آپلود، کلیک‌پذیر)، در حال بررسی، پیدا نشد (قرمز، با راهنمای اصلاح) و آماده (تصویر + چیپ
// «تصویر پیدا شد»)؛ هنگام آپلود لایهٔ پیشرفت و هنگام کشیدن فایل لایهٔ «رها کنید» روی آن می‌آید. بنر همان نسبت اسلایدر صفحهٔ اصلی را دارد (۵ به ۲ روی دسکتاپ)
// و عنوان و توضیحش مثل خود اسلایدر روی تصویر می‌افتد (overlay)، پس مدیر نتیجه را همان‌جا که کار می‌کند می‌بیند.
// فایل آپلودشده /uploads/… می‌شود و در فیلد آدرس می‌نشیند؛ onBusyChange(true) تا پایان آپلود تا صفحه دکمهٔ ذخیره را قفل کند؛ removable دکمهٔ «حذف تصویر»
// می‌دهد (برای دسته‌بندی که تصویرش اختیاری است). aria-live وضعیت را برای صفحه‌خوان اعلام می‌کند
const FRAMES = {
  banner: "aspect-[16/10] sm:aspect-[2/1] lg:aspect-[5/2]",
  category: "aspect-[4/3]",
};

const fa = (n) => Number(n).toLocaleString("fa-IR");

const ACTION =
  "inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-50";

export default function ImagePreviewField({ kind = "banner", preview: p, label, placeholder, hint, overlay, removable = false, disabled = false, onBusyChange, className = "" }) {
  const { value, change, apply, preview, loading, error, onLoad, onError } = p;
  const { uploading, name, progress, upload } = useImageUpload(apply);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);
  const locked = uploading || disabled;
  const ready = preview && !error && !loading;
  const hasImage = Boolean(value.trim());

  useEffect(() => {
    onBusyChange?.(uploading);
  }, [uploading, onBusyChange]);

  const pick = () => fileInput.current?.click();
  const onFiles = (event) => {
    upload(event.target.files);
    event.target.value = ""; // همان فایل را دوباره هم بشود انتخاب کرد
  };
  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (!locked) upload(event.dataTransfer?.files);
  };

  return (
    <div className={className}>
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          if (!locked) setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!locked) setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
        }}
        onDrop={onDrop}
        data-dropzone=""
        className={`relative w-full overflow-hidden rounded-2xl ring-1 transition-colors ${FRAMES[kind]} ${
          error ? "bg-red-50/60 ring-red-200" : ready ? "bg-gray-900 ring-gray-200" : "bg-gray-50 ring-gray-200"
        }`}
      >
        {!error && preview && (
          <AppImage
            key={preview}
            src={getImagePath(preview)}
            alt={kind === "banner" ? "پیش‌نمایش بنر" : "پیش‌نمایش دسته‌بندی"}
            fill
            sizes="(max-width: 1000px) 100vw, 640px"
            priority
            className={kind === "banner" ? "object-cover" : "object-contain p-3"}
            style={{ opacity: loading ? 0 : 1, transition: "opacity .3s ease" }}
            onLoad={onLoad}
            onError={onError}
          />
        )}

        {ready && overlay && (overlay.title || overlay.desc) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end gap-0.5 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4 sm:p-5">
            {overlay.title && <span className="truncate text-sm font-extrabold text-white drop-shadow sm:text-base">{overlay.title}</span>}
            {overlay.desc && <span className="truncate text-xs text-white/85 sm:text-sm">{overlay.desc}</span>}
          </div>
        )}

        {ready && (
          <span className="pointer-events-none absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-emerald-700 shadow-sm ring-1 ring-emerald-100">
            <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
            تصویر پیدا شد
          </span>
        )}

        {loading && !uploading && (
          <div className="absolute inset-0 grid place-content-center justify-items-center gap-2 text-sm font-medium text-gray-500">
            <Loader2 className="h-7 w-7 animate-spin text-brand-600 motion-reduce:animate-none" aria-hidden="true" />
            در حال بررسی تصویر...
          </div>
        )}

        {!loading && error && (
          <div className="absolute inset-0 grid place-content-center justify-items-center gap-1.5 px-4 text-center">
            <ImageOff className="h-8 w-8 text-red-400" aria-hidden="true" />
            <span className="text-sm font-bold text-red-600">تصویر یافت نشد</span>
            <span className="text-xs text-gray-500">نام فایل یا آدرس را بررسی کنید، یا تصویر را آپلود کنید</span>
          </div>
        )}

        {!loading && !error && !preview && !uploading && (
          <button
            type="button"
            onClick={pick}
            disabled={locked}
            aria-label="انتخاب تصویر برای آپلود"
            className="btn-flat absolute inset-0 grid cursor-pointer place-content-center justify-items-center gap-2 px-4 text-center transition-colors hover:bg-brand-50/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-brand-100 disabled:cursor-not-allowed"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-brand-100">
              <Upload className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="text-sm font-bold text-gray-700">تصویر را اینجا بکشید و رها کنید</span>
            <span className="text-xs text-gray-500">یا برای انتخاب فایل کلیک کنید</span>
          </button>
        )}

        {dragging && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-content-center justify-items-center gap-2 bg-brand-50/90 ring-2 ring-inset ring-brand-500">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white shadow-sm">
              <Upload className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="text-sm font-bold text-brand-700">برای آپلود، فایل را رها کنید</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 z-20 grid place-content-center justify-items-center gap-3 bg-white/90 px-6 text-center backdrop-blur-[2px]">
            <Loader2 className="h-7 w-7 animate-spin text-brand-600 motion-reduce:animate-none" aria-hidden="true" />
            <span className="text-sm font-bold text-gray-700">در حال آپلود تصویر...</span>
            <span dir="ltr" className="max-w-[16rem] truncate text-xs text-gray-500">
              {name}
            </span>
            <span
              role="progressbar"
              aria-label="پیشرفت آپلود"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="block h-2 w-52 max-w-full overflow-hidden rounded-full bg-gray-200"
            >
              <span className="block h-full rounded-full bg-brand-600 transition-[width] duration-200 ease-out" style={{ width: `${Math.max(progress, 4)}%` }} />
            </span>
            <span className="text-xs font-semibold tabular-nums text-gray-600">{fa(progress)}٪</span>
          </div>
        )}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {uploading ? "در حال آپلود تصویر" : loading ? "در حال بررسی تصویر" : error ? "تصویر یافت نشد" : preview ? "تصویر پیدا شد" : ""}
      </p>

      <input ref={fileInput} type="file" accept={IMAGE_ACCEPT} onChange={onFiles} tabIndex={-1} aria-hidden="true" className="hidden" data-image-input="" />

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2">
        <button type="button" onClick={pick} disabled={locked} className={`${ACTION} border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100`}>
          <Upload className="h-4 w-4" aria-hidden="true" />
          {hasImage ? "جایگزینی با تصویر دیگر" : "آپلود تصویر"}
        </button>
        {removable && hasImage && (
          <button type="button" onClick={() => change("")} disabled={locked} className={`${ACTION} text-red-600 hover:bg-red-50`}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            حذف تصویر
          </button>
        )}
        <span className="text-xs leading-5 text-gray-500">
          <bdi dir="ltr">JPG, PNG, WebP, AVIF</bdi>؛ حداکثر {fa(MAX_IMAGE_BYTES / 1024 / 1024)} مگابایت
        </span>
      </div>

      <TextInput
        className="mt-4"
        ltr
        label={label}
        placeholder={placeholder}
        hint={hint}
        value={value}
        onChange={(e) => change(e.target.value)}
        disabled={uploading}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
}
