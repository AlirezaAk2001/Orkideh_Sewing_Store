"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheck, FileImage, ImageOff, Loader2, Upload } from "lucide-react";
import Icon from "@mdi/react";
import { mdiImageSyncOutline } from "@mdi/js";
import { TrashCan } from "@/app/components/ActionIcons";
import AppImage from "@/app/components/AppImage";
import { getImagePath } from "@/app/utils/getImagePath";
import { tip } from "@/lib/tip";
import CollapseCard from "./CollapseCard";
import { TextInput } from "./Fields";
import { IMAGE_ACCEPT, MAX_IMAGE_BYTES, useImageUpload } from "./useImageUpload";

// تصویر بنر یا دسته‌بندی در فرم: کادر پیش‌نمایش زنده (نتیجهٔ useImagePreview) که هم محل رها کردن فایل است، دکمهٔ آپلود، و زیرش فیلد نام/آدرس فایل برای تصویرهای
// داخل public/image یا آدرس بیرونی. کادر چهار حالت دارد: خالی (دعوت به آپلود، کلیک‌پذیر)، در حال بررسی، پیدا نشد (قرمز، با راهنمای اصلاح) و آماده (تصویر + چیپ
// «تصویر پیدا شد»)؛ هنگام آپلود لایهٔ پیشرفت و هنگام کشیدن فایل لایهٔ «رها کنید» روی آن می‌آید. بنر همان نسبت اسلایدر صفحهٔ اصلی را دارد (۵ به ۲ روی دسکتاپ)
// و عنوان و توضیحش مثل خود اسلایدر روی تصویر می‌افتد (overlay)، پس مدیر نتیجه را همان‌جا که کار می‌کند می‌بیند.
// فایل آپلودشده /uploads/… می‌شود و در فیلد آدرس می‌نشیند؛ onBusyChange(true) تا پایان آپلود تا صفحه دکمهٔ ذخیره را قفل کند؛ removable دکمهٔ «حذف تصویر»
// می‌دهد (برای دسته‌بندی که تصویرش اختیاری است). aria-live وضعیت را برای صفحه‌خوان اعلام می‌کند
// فیلد نام فایل یا آدرس در کارت جمع‌شوندهٔ «ثبت با نام فایل یا آدرس» است (همان CollapseCard فرم محصول؛ راه اصلی آپلود است و این راه فرعی)؛ پیش‌فرض بسته، و زیرعنوانِ بستهٔ آن
// مسیر فعلی تصویر را نشان می‌دهد تا چیزی پنهان نماند. با خطای «تصویر یافت نشد» کارت خودش باز می‌شود؛ با باز کردنِ دستی، فیلد فوکوس می‌گیرد. فیلد مثل قبل زنده است (بی دکمهٔ «افزودن»).
// کادر بنر از lg به بعد به ارتفاع ناحیهٔ محتوا (cqh؛ container-type:size در layout.jsx) بسته است تا صفحهٔ افزودن/ویرایش بی‌اسکرول جا شود: پهنا
// min(کل کارت، (ارتفاع محتوا − ۲۰٫۲۵rem که سهم بقیهٔ صفحه است) × ۲٫۵)، پس نسبت ۵ به ۲ اسلایدر همان می‌ماند و فقط روی پنجرهٔ کوتاه کادر وسط‌چین و کوچک‌تر می‌شود
// (کوچک‌تر از ۲۰rem نمی‌شود). ۲۰٫۲۵rem = سربرگ و فاصله‌های کارت + ردیف آدرس و آپلود (راهنما یک خط است) + نوار ذخیره. سربرگ صفحه دیگر داخل main نیست (جایگاه ثابت بالای آن،
// layout.jsx) و ارتفاعش از cqh کم شده است؛ پیش‌تر ۲۶rem بود و ۵٫۷۵rem (۹۳px) آن سهم سربرگ بود.
// کادر دسته‌بندی به خواست مالک دقیقاً همان کادر بنر است (همان نسبت و اندازه)، و تصویر هر دو با object-cover تمام کادر را می‌پوشاند (عکس ۴ به ۳ در کادر ۵ به ۲
// بالا و پایینش بریده می‌شود؛ با object-contain دو طرفش نوار خالی می‌ماند و مالک آن را نمی‌خواست). زمینهٔ آمادهٔ دسته‌بندی روشن است تا اگر تصویر دیر آمد تیره نباشد
// --img-extra (روی ریشهٔ کامپوننت): ارتفاعِ بدنهٔ کارتِ بازِ فیلد آدرس (OPEN_EXTRA)؛ با باز شدن کارت از ۰ به این مقدار می‌رود و کادر همزمان (گذار ۰٫۳ ثانیه با همان منحنی باز شدن کارت)
// همان‌قدر کوتاه می‌شود تا مجموع ارتفاع ثابت بماند و صفحه اسکرول نگیرد. کادر فقط به اندازهٔ لازم کوچک می‌شود (در پنجرهٔ بلند که هنوز جا دارد تغییری نمی‌کند)
const BANNER_FRAME =
  "aspect-[16/10] transition-[background-color,width] duration-300 ease-out motion-reduce:transition-none sm:aspect-[2/1] lg:mx-auto lg:aspect-[5/2] lg:w-[min(100%,max(20rem,calc((100cqh_-_20.25rem_-_var(--img-extra,0rem))*2.5)))]";
// بدنهٔ کارتِ باز = pt-3 (۱۲) + فیلد h-11 (۴۴) + pb-3.5 (۱۴) = ۷۰px، بی‌راهنمای زیر فیلد (همین مقدار ثابت است)
const OPEN_EXTRA = "4.375rem";
// فاصلهٔ بالای دکمهٔ آپلود از بالای ردیف (lg): بسته، دکمهٔ ۴۴px وسط سر کارت (۶۸px) می‌نشیند: ۱۲ (فاصلهٔ بالای کارت) + (۶۸ − ۴۴) ÷ ۲ = ۲۴px؛ باز، هم‌ردیف خود فیلد:
// ۱۲ + سر کارت ۶۸ + pt-3 بدنه ۱۲ = ۹۲px (۵٫۷۵rem)، پس دکمه و فیلد (هر دو ۴۴px) از یک خط شروع می‌شوند و کنار هم‌اند
const BUTTON_CLOSED = "1.5rem";
const BUTTON_OPEN = "5.75rem";
const FRAMES = {
  banner: BANNER_FRAME,
  category: BANNER_FRAME,
};

const fa = (n) => Number(n).toLocaleString("fa-IR");

const ACTION =
  "inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-50";

export default function ImagePreviewField({ kind = "banner", preview: p, label, placeholder, overlay, removable = false, disabled = false, onBusyChange, className = "" }) {
  const { value, change, apply, preview, loading, error, onLoad, onError } = p;
  const { uploading, name, progress, upload } = useImageUpload(apply);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);
  const [open, setOpen] = useState(false); // کارت «ثبت با نام فایل یا آدرس» باز است
  const [seenError, setSeenError] = useState(false);
  const nameRef = useRef(null);
  const focusOnOpen = useRef(false); // فقط باز کردنِ دستی فوکوس می‌دهد، نه بازشدن خودکار با خطا
  const locked = uploading || disabled;
  const ready = preview && !error && !loading;
  const hasImage = Boolean(value.trim());
  // بنر و دسته‌بندی هر دو زیر کادر چینش فشردهٔ lg را دارند (فیلد آدرس و دکمهٔ آپلود در یک ردیف، نوشتهٔ فرمت در راهنمای دکمه و کادرِ خالی)
  const compact = kind === "banner" || kind === "category";
  const formats = (
    <>
      <bdi dir="ltr">JPG, PNG, WebP, AVIF</bdi>؛ حداکثر {fa(MAX_IMAGE_BYTES / 1024 / 1024)} مگابایت
    </>
  );

  // لحظهٔ رسیدن خطا (نه تا وقتی خطا هست): کارت باز می‌شود تا فیلد و راه اصلاح دیده شود؛ بعدش مدیر می‌تواند ببندد (تنظیم state هنگام رندر، بدون effect)
  if (error !== seenError) {
    setSeenError(error);
    if (error) setOpen(true);
  }

  useEffect(() => {
    onBusyChange?.(uploading);
  }, [uploading, onBusyChange]);

  // با باز کردنِ دستی، فیلد فوکوس می‌گیرد (بعد از شروع انیمیشن تا inert برداشته شده باشد)؛ preventScroll تا صفحه نپرد
  useEffect(() => {
    if (!open || !focusOnOpen.current) return undefined;
    focusOnOpen.current = false;
    const t = setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 120);
    return () => clearTimeout(t);
  }, [open]);

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
    <div className={className} style={{ "--img-extra": open ? OPEN_EXTRA : "0rem", "--img-btn": open ? BUTTON_OPEN : BUTTON_CLOSED }}>
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
        className={`relative w-full overflow-hidden rounded-2xl ring-1 ${FRAMES[kind]} ${
          error ? "bg-red-50/60 ring-red-200" : ready ? `${kind === "banner" ? "bg-gray-900" : "bg-gray-50"} ring-gray-200` : "bg-gray-50 ring-gray-200"
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
            className="object-cover"
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
            {compact && <span className="text-[11px] text-gray-400">{formats}</span>}
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

      {/* زیر کادر: دکمهٔ آپلود و نوشتهٔ فرمت، و کارت جمع‌شوندهٔ فیلد آدرس. بنر و دسته‌بندی از lg به بعد برای کم‌کردن ارتفاع صفحه، کارت را با دکمهٔ آپلود در یک ردیف می‌گذارند
          (کارت سمت شروع، دکمه کنارش: بسته وسط سر کارت می‌نشیند و با باز شدن کارت نرم پایین می‌آید و هم‌ردیف خود فیلد می‌شود؛ --img-btn، با همان مدت و منحنی باز شدن کارت). نوشتهٔ فرمت در این حالت جا ندارد،
          پس در راهنمای دکمهٔ آپلود و در خط آخر کادرِ خالی نوشته می‌شود؛ عرض‌های کم همان چینش زیر هم قبلی را دارند */}
      <div className={compact ? "lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-x-3" : undefined}>
        <div className={`mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 ${compact ? "lg:order-2 lg:mt-[var(--img-btn,1.5rem)] lg:transition-[margin-top] lg:duration-300 lg:ease-out motion-reduce:transition-none" : ""}`}>
          <button
            type="button"
            onClick={pick}
            disabled={locked}
            {...(compact ? tip(`JPG, PNG, WebP, AVIF؛ حداکثر ${fa(MAX_IMAGE_BYTES / 1024 / 1024)} مگابایت`, "top") : {})}
            className={`${ACTION} border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 ${compact ? "lg:h-11" : ""}`}
          >
            {/* با تصویر موجود («جایگزینی با تصویر دیگر») آیکون هم‌گام‌سازی تصویر می‌آید */}
            {hasImage ? (
              <Icon path={mdiImageSyncOutline} size="22px" className="shrink-0" aria-hidden="true" />
            ) : (
              <Upload className="h-4 w-4" aria-hidden="true" />
            )}
            {hasImage ? "جایگزینی با تصویر دیگر" : "آپلود تصویر"}
          </button>
          {removable && hasImage && (
            <button type="button" onClick={() => change("")} disabled={locked} className={`${ACTION} text-red-600 hover:bg-red-50`}>
              <TrashCan className="h-4 w-4" />
              حذف تصویر
            </button>
          )}
          <span className={`text-xs leading-5 text-gray-500 ${compact ? "lg:hidden" : ""}`}>{formats}</span>
        </div>

        <CollapseCard
          className={`mt-4 ${compact ? "lg:order-1 lg:mt-3" : ""}`}
          icon={FileImage}
          title="ثبت با نام فایل یا آدرس"
          subtitle={
            hasImage ? (
              <bdi dir="ltr" className="block truncate text-right">
                {value.trim()}
              </bdi>
            ) : (
              <>
                نام فایلی از پوشهٔ <bdi dir="ltr">public/image</bdi> یا آدرس کامل
              </>
            )
          }
          open={open}
          onToggle={() => {
            if (!open) focusOnOpen.current = true;
            setOpen(!open);
          }}
        >
          <TextInput
            ref={nameRef}
            ltr
            label={label}
            placeholder={placeholder}
            value={value}
            onChange={(e) => change(e.target.value)}
            disabled={uploading}
            autoComplete="off"
            spellCheck={false}
          />
        </CollapseCard>
      </div>
    </div>
  );
}
