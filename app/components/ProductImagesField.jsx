"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowLeft, ArrowRight, ImagePlus, Plus, Star } from "lucide-react";
import { TrashCan } from "./ActionIcons";
import AppImage from "./AppImage";
import { MAX_PRODUCT_IMAGES, isAcceptableImageRef } from "@/lib/productImages";

// گالری تصویر محصول در فرم‌های افزودن و ویرایش ادمین. value آرایهٔ تصویرهاست و اولین مورد تصویر اصلی (کاور) است؛
// onChange مثل setState کار می‌کند (آرایه یا تابع). چند فایل با انتخاب یا کشیدن‌ورها کردن آپلود می‌شوند (یکی‌یکی به /api/admin/upload،
// تا هر فایل جدا پیشرفت و خطا داشته باشد) و تصویرهای پوشهٔ public/image را هم می‌شود با نام فایل اضافه کرد.
// onBusyChange(true) تا وقتی آپلودی در جریان است، تا فرم دکمهٔ ذخیره را قفل کند.
// ظاهر (مرحلهٔ فرم‌ها): ناحیهٔ رها کردن با آیکون، شمارندهٔ پرشونده، برچسب «تصویر اصلی» برند، کاشی‌های در حال آپلود با نوار پیشرفت؛ هیچ‌کدام منطق بالا را عوض نمی‌کنند.
const ACCEPT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ACCEPT_EXT = /\.(jpe?g|png|webp|avif)$/i;
const MAX_BYTES = 5 * 1024 * 1024; // همان سقف سرور (lib/uploads.js)

const fa = (n) => Number(n).toLocaleString("fa-IR");

const tileButton =
  "grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-gray-600 transition hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-gray-600";

export default function ProductImagesField({ value, onChange, onBusyChange, disabled = false }) {
  const [pending, setPending] = useState([]); // آپلودهای در جریان: [{ id, name }]
  const [dragging, setDragging] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    onBusyChange?.(pending.length > 0);
  }, [pending.length, onBusyChange]);

  const room = MAX_PRODUCT_IMAGES - value.length - pending.length;
  const full = room <= 0;

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length || disabled) return;

    let slots = room;
    const accepted = [];
    for (const file of files) {
      if (!ACCEPT_TYPES.includes(file.type) && !ACCEPT_EXT.test(file.name)) {
        toast.error(`${file.name}: فقط تصویر JPG، PNG، WebP یا AVIF`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: حجم فایل بیشتر از ${fa(MAX_BYTES / 1024 / 1024)} مگابایت است`);
        continue;
      }
      if (slots <= 0) {
        toast.error(`هر محصول حداکثر ${fa(MAX_PRODUCT_IMAGES)} تصویر می‌تواند داشته باشد`);
        break;
      }
      slots--;
      accepted.push({ id: `${Date.now()}-${accepted.length}-${Math.random().toString(36).slice(2, 7)}`, file });
    }
    if (!accepted.length) return;

    setPending((prev) => [...prev, ...accepted.map(({ id, file }) => ({ id, name: file.name }))]);
    for (const { id, file } of accepted) {
      try {
        const body = new FormData();
        body.append("files", file);
        const { data } = await axios.post("/api/admin/upload", body, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const result = data.files?.[0];
        if (result?.url) onChange((prev) => [...prev, result.url]);
        else toast.error(`${file.name}: ${result?.error || "آپلود ناموفق بود"}`);
      } catch (error) {
        toast.error(`${file.name}: ${error.response?.data?.error || "آپلود ناموفق بود"}`);
      } finally {
        setPending((prev) => prev.filter((item) => item.id !== id));
      }
    }
  };

  const addByName = () => {
    const ref = nameInput.trim();
    if (!ref) return;
    if (!isAcceptableImageRef(ref)) return toast.error("نام فایل یا آدرس تصویر معتبر نیست");
    if (value.includes(ref)) return toast.error("این تصویر قبلاً اضافه شده است");
    if (full) return toast.error(`هر محصول حداکثر ${fa(MAX_PRODUCT_IMAGES)} تصویر می‌تواند داشته باشد`);
    onChange((prev) => [...prev, ref]);
    setNameInput("");
  };

  const move = (from, to) =>
    onChange((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  const remove = (index) => onChange((prev) => prev.filter((_, i) => i !== index));

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer?.files);
  };

  const used = value.length + pending.length;

  return (
    <div dir="rtl" role="group" aria-labelledby="product-images-title" className="font-[inherit]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 id="product-images-title" className="sr-only">
          تصاویر محصول
        </h3>
        <div className="flex items-center gap-2.5" aria-hidden="true">
          <span className="h-2 w-28 overflow-hidden rounded-full bg-gray-100">
            <span className="block h-full rounded-full bg-brand-600 transition-[width] duration-500" style={{ width: `${(used / MAX_PRODUCT_IMAGES) * 100}%` }} />
          </span>
          <span className="text-xs font-semibold text-gray-600">
            {fa(used)} از {fa(MAX_PRODUCT_IMAGES)} تصویر
          </span>
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <Star className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
          اولین تصویر، تصویر اصلی است (کارت‌ها، سبد خرید و پیش‌نمایش لینک)
        </p>
      </div>

      <label
        onDragOver={(event) => {
          event.preventDefault();
          if (!full && !disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`group flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-100 ${
          full || disabled
            ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
            : dragging
            ? "border-brand-500 bg-brand-50 text-brand-700"
            : "border-gray-300 bg-gray-50/70 text-gray-600 hover:border-brand-500 hover:bg-brand-50/60"
        }`}
      >
        <span
          className={`grid h-12 w-12 place-items-center rounded-2xl ring-1 transition duration-300 ${
            full || disabled
              ? "bg-gray-100 text-gray-400 ring-gray-200"
              : dragging
              ? "scale-110 bg-brand-600 text-white ring-brand-600"
              : "bg-white text-brand-600 ring-brand-100 group-hover:scale-105"
          }`}
        >
          <ImagePlus className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="text-sm font-bold">
          {full ? "به سقف تعداد تصویر رسیده‌اید" : dragging ? "رها کنید تا آپلود شود" : "تصاویر را اینجا رها کنید یا برای انتخاب کلیک کنید"}
        </span>
        <span className="text-xs text-gray-500">JPG، PNG، WebP یا AVIF؛ هر فایل تا {fa(MAX_BYTES / 1024 / 1024)} مگابایت؛ انتخاب چند فایل با هم ممکن است</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_TYPES.join(",")}
          disabled={full || disabled}
          aria-label="انتخاب تصاویر محصول"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
          className="sr-only"
        />
      </label>

      {(value.length > 0 || pending.length > 0) && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {value.map((src, index) => (
            <li key={src} className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
              <div className="relative aspect-square bg-gray-50">
                <AppImage src={src} alt={index === 0 ? "تصویر اصلی محصول" : `تصویر ${fa(index + 1)} محصول`} fill sizes="200px" className="object-contain p-2" />
              </div>
              {index === 0 ? (
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white shadow">
                  <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                  تصویر اصلی
                </span>
              ) : (
                <span aria-hidden="true" className="absolute right-2 top-2 grid h-5 min-w-5 place-items-center rounded-full bg-white/90 px-1.5 text-[11px] font-bold text-gray-600 shadow-sm ring-1 ring-gray-200">
                  {fa(index + 1)}
                </span>
              )}
              <div className="flex items-center justify-between border-t border-gray-100 p-1">
                <div className="flex">
                  <button type="button" onClick={() => move(index, index - 1)} disabled={disabled || index === 0} aria-label={`جابه‌جایی تصویر ${fa(index + 1)} به قبل`} className={tileButton}>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => move(index, index + 1)} disabled={disabled || index === value.length - 1} aria-label={`جابه‌جایی تصویر ${fa(index + 1)} به بعد`} className={tileButton}>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => move(index, 0)} disabled={disabled || index === 0} aria-label={`تبدیل تصویر ${fa(index + 1)} به تصویر اصلی`} className={tileButton}>
                    <Star className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <button type="button" onClick={() => remove(index)} disabled={disabled} aria-label={`حذف تصویر ${fa(index + 1)}`} className={`${tileButton} hover:!bg-red-50 hover:!text-red-600`}>
                  <TrashCan className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
          {pending.map((item) => (
            <li key={item.id} className="flex aspect-[1/1.18] flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 p-3 text-center" role="status">
              <ImagePlus className="h-6 w-6 text-brand-600" aria-hidden="true" />
              <span className="line-clamp-2 break-all text-[11px] text-gray-600" dir="ltr">{item.name}</span>
              <span className="upload-bar relative block h-1.5 w-full overflow-hidden rounded-full bg-brand-100" aria-hidden="true" />
              <span className="text-[11px] font-medium text-brand-700">در حال آپلود…</span>
            </li>
          ))}
        </ul>
      )}

      <details className="mt-4 rounded-xl bg-gray-50 px-3.5 py-2.5 text-sm text-gray-600 ring-1 ring-gray-100">
        <summary className="cursor-pointer select-none text-xs font-medium text-gray-600 hover:text-gray-900">افزودن با نام فایل (تصویرهایی که از قبل داخل پوشهٔ public/image گذاشته‌اید)</summary>
        <div className="mt-3 flex gap-2">
          <input
            dir="ltr"
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addByName();
              }
            }}
            placeholder="مثال: janome1.jpeg"
            aria-label="نام فایل تصویر"
            disabled={disabled}
            className="h-10 min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 text-left text-sm outline-none transition hover:border-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
          <button
            type="button"
            onClick={addByName}
            disabled={disabled || !nameInput.trim()}
            className="inline-flex h-10 cursor-pointer items-center gap-1 rounded-xl bg-gray-800 px-4 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            افزودن
          </button>
        </div>
      </details>
    </div>
  );
}
