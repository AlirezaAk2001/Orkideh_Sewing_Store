"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Plus, Star, Trash2 } from "lucide-react";
import AppImage from "./AppImage";
import { MAX_PRODUCT_IMAGES, isAcceptableImageRef } from "@/lib/productImages";

// گالری تصویر محصول در فرم‌های افزودن و ویرایش ادمین. value آرایهٔ تصویرهاست و اولین مورد تصویر اصلی (کاور) است؛
// onChange مثل setState کار می‌کند (آرایه یا تابع). چند فایل با انتخاب یا کشیدن‌ورها کردن آپلود می‌شوند (یکی‌یکی به /api/admin/upload،
// تا هر فایل جدا پیشرفت و خطا داشته باشد) و تصویرهای پوشهٔ public/image را هم می‌شود با نام فایل اضافه کرد.
// onBusyChange(true) تا وقتی آپلودی در جریان است، تا فرم دکمهٔ ذخیره را قفل کند.
const ACCEPT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ACCEPT_EXT = /\.(jpe?g|png|webp|avif)$/i;
const MAX_BYTES = 5 * 1024 * 1024; // همان سقف سرور (lib/uploads.js)

const fa = (n) => Number(n).toLocaleString("fa-IR");

const tileButton =
  "grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-gray-600";

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

  return (
    <section dir="rtl" aria-labelledby="product-images-title" className="my-2 font-[inherit]">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id="product-images-title" className="text-sm font-bold text-gray-800">
          تصاویر محصول <span className="font-normal text-gray-500">({fa(value.length + pending.length)} از {fa(MAX_PRODUCT_IMAGES)})</span>
        </h3>
        <p className="text-xs text-gray-500">اولین تصویر، تصویر اصلی محصول است (کارت‌ها، سبد خرید و پیش‌نمایش لینک).</p>
      </div>

      <label
        onDragOver={(event) => {
          event.preventDefault();
          if (!full && !disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500 ${
          full || disabled
            ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
            : dragging
            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
            : "border-gray-300 bg-gray-50 text-gray-600 hover:border-indigo-400 hover:bg-indigo-50/50"
        }`}
      >
        <ImagePlus className="h-7 w-7" aria-hidden="true" />
        <span className="text-sm font-medium">{full ? "به سقف تعداد تصویر رسیده‌اید" : "تصاویر را اینجا رها کنید یا برای انتخاب کلیک کنید"}</span>
        <span className="text-xs text-gray-500">JPG، PNG، WebP یا AVIF؛ هر فایل تا {fa(MAX_BYTES / 1024 / 1024)} مگابایت؛ انتخاب چند فایل با هم ممکن است</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_TYPES.join(",")}
          disabled={full || disabled}
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
          className="sr-only"
        />
      </label>

      {(value.length > 0 || pending.length > 0) && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {value.map((src, index) => (
            <li key={src} className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="relative aspect-square bg-gray-50">
                <AppImage src={src} alt={index === 0 ? "تصویر اصلی محصول" : `تصویر ${fa(index + 1)} محصول`} fill sizes="200px" className="object-contain p-2" />
              </div>
              {index === 0 && (
                <span className="absolute right-2 top-2 rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-bold text-white shadow">تصویر اصلی</span>
              )}
              <div className="flex items-center justify-between border-t border-gray-100 p-1">
                <div className="flex">
                  <button type="button" onClick={() => move(index, index - 1)} disabled={disabled || index === 0} aria-label={`جابه‌جایی تصویر ${fa(index + 1)} به قبل`} className={tileButton}>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => move(index, index + 1)} disabled={disabled || index === value.length - 1} aria-label={`جابه‌جایی تصویر ${fa(index + 1)} به بعد`} className={tileButton}>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => move(index, 0)} disabled={disabled || index === 0} aria-label={`تبدیل تصویر ${fa(index + 1)} به تصویر اصلی`} title="تبدیل به تصویر اصلی" className={tileButton}>
                    <Star className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <button type="button" onClick={() => remove(index)} disabled={disabled} aria-label={`حذف تصویر ${fa(index + 1)}`} title="حذف" className={`${tileButton} hover:!bg-red-50 hover:!text-red-600`}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
          {pending.map((item) => (
            <li key={item.id} className="flex aspect-[1/1.18] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 p-2 text-center" role="status">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500 motion-reduce:animate-none" aria-hidden="true" />
              <span className="line-clamp-2 break-all text-[11px] text-gray-600" dir="ltr">{item.name}</span>
              <span className="text-[11px] text-indigo-600">در حال آپلود…</span>
            </li>
          ))}
        </ul>
      )}

      <details className="mt-3 text-sm text-gray-600">
        <summary className="cursor-pointer select-none text-xs text-gray-500 hover:text-gray-700">افزودن با نام فایل (تصویرهایی که از قبل داخل پوشهٔ public/image گذاشته‌اید)</summary>
        <div className="mt-2 flex gap-2">
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
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="button"
            onClick={addByName}
            disabled={disabled || !nameInput.trim()}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            افزودن
          </button>
        </div>
      </details>
    </section>
  );
}
