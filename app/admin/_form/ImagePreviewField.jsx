"use client";

import { CircleCheck, ImageOff, ImagePlus, Loader2 } from "lucide-react";
import AppImage from "@/app/components/AppImage";
import { getImagePath } from "@/app/utils/getImagePath";
import { TextInput } from "./Fields";

// پیش‌نمایش زندهٔ تصویر بنر یا دسته‌بندی کنار فیلد نام/آدرس فایل (نتیجهٔ useImagePreview). چهار حالت دارد: خالی (راهنما)، در حال بررسی، پیدا نشد (قرمز، با راهنمای
// اصلاح) و آماده (تصویر + چیپ «تصویر پیدا شد»). بنر همان نسبت اسلایدر صفحهٔ اصلی را دارد (۵ به ۲ روی دسکتاپ) و عنوان و توضیحش مثل خود اسلایدر روی تصویر
// می‌افتد (overlay)، پس مدیر نتیجه را همان‌جا که تایپ می‌کند می‌بیند. aria-live وضعیت را برای صفحه‌خوان اعلام می‌کند
const FRAMES = {
  banner: "aspect-[16/10] sm:aspect-[2/1] lg:aspect-[5/2]",
  category: "aspect-[4/3]",
};

export default function ImagePreviewField({ kind = "banner", preview: p, label, placeholder, hint, overlay, emptyText, className = "" }) {
  const { value, change, preview, loading, error, onLoad, onError } = p;
  const ready = preview && !error && !loading;

  return (
    <div className={className}>
      <div
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

        {loading && (
          <div className="absolute inset-0 grid place-content-center justify-items-center gap-2 text-sm font-medium text-gray-500">
            <Loader2 className="h-7 w-7 animate-spin text-brand-600 motion-reduce:animate-none" aria-hidden="true" />
            در حال بررسی تصویر...
          </div>
        )}

        {!loading && error && (
          <div className="absolute inset-0 grid place-content-center justify-items-center gap-1.5 px-4 text-center">
            <ImageOff className="h-8 w-8 text-red-400" aria-hidden="true" />
            <span className="text-sm font-bold text-red-600">تصویر یافت نشد</span>
            <span className="text-xs text-gray-500">نام فایل یا آدرس را بررسی کنید</span>
          </div>
        )}

        {!loading && !error && !preview && (
          <div className="absolute inset-0 grid place-content-center justify-items-center gap-2 px-4 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-brand-100">
              <ImagePlus className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-gray-600">{emptyText}</span>
          </div>
        )}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {loading ? "در حال بررسی تصویر" : error ? "تصویر یافت نشد" : preview ? "تصویر پیدا شد" : ""}
      </p>

      <TextInput
        className="mt-4"
        ltr
        label={label}
        placeholder={placeholder}
        hint={hint}
        value={value}
        onChange={(e) => change(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
}
