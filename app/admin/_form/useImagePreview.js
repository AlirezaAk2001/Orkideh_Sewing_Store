"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// منطق مشترک پیش‌نمایش تصویر در فرم بنر و دسته‌بندی (قبلاً در چهار صفحه کپی شده بود): value مقدار فیلد است و بلادرنگ عوض می‌شود، ولی preview (آنچه تصویر از آن
// بارگیری می‌شود) نیم ثانیه بعد از آخرین تایپ به‌روز می‌شود تا با هر حرف درخواست نرود. loading از تایپ تا رسیدن onLoad/onError روشن است و error یعنی تصویر باز نشد.
// init(val) برای صفحهٔ ویرایش است: مقدار ذخیره‌شده را بی‌تأخیر و بدون «در حال بررسی» می‌گذارد.
// خطا به آدرسی که باز نشد وصل است (failed)، نه یک پرچم جدا: اگر با هر حرف پرچم پاک می‌شد، تصویر خراب دوباره سوار می‌شد، دوباره خطا می‌داد و بعد از نیم ثانیه
// آدرس درست هم هرگز بارگیری نمی‌شد. حالا تا وقتی آدرس نیم‌ثانیه‌ای عوض نشده، «در حال بررسی» دیده می‌شود و با آدرس تازه خطا خودبه‌خود بی‌اثر است.
// اگر کاربر مقدار را عوض کند و سریع به همان مقدار قبلی برگردد، preview تغییری نمی‌کند و onLoad دوباره نمی‌آید؛ پس در این حالت loading همان‌جا خاموش می‌شود
export function useImagePreview() {
  const [value, setValue] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(""); // آخرین آدرسی که باز نشد؛ error یعنی آدرس فعلی همان است
  const timer = useRef(null);
  const previewRef = useRef("");

  useEffect(() => () => clearTimeout(timer.current), []);

  const change = useCallback((next) => {
    setValue(next);
    clearTimeout(timer.current);
    const trimmed = next.trim();
    if (!trimmed) {
      previewRef.current = "";
      setPreview("");
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(() => {
      if (previewRef.current === trimmed) setLoading(false);
      previewRef.current = trimmed;
      setPreview(trimmed);
    }, 600);
  }, []);

  // apply(val): مقدار تازه بی‌تأخیر (بدون نیم‌ثانیه صبر) پیش‌نمایش داده می‌شود؛ برای تصویری که همین الان آپلود شده و وجودش قطعی است. «در حال بررسی» تا رسیدن onLoad می‌ماند
  const apply = useCallback((next) => {
    clearTimeout(timer.current);
    const trimmed = next.trim();
    setValue(next);
    setPreview(trimmed);
    setLoading(Boolean(trimmed) && previewRef.current !== trimmed);
    previewRef.current = trimmed;
  }, []);

  const init = useCallback((next) => {
    clearTimeout(timer.current);
    previewRef.current = next.trim();
    setValue(next);
    setPreview(next.trim());
    setFailed("");
    setLoading(false);
  }, []);

  const onLoad = useCallback(() => {
    setLoading(false);
    setFailed("");
  }, []);
  const onError = useCallback(() => {
    setLoading(false);
    setFailed(previewRef.current);
  }, []);

  return { value, change, apply, init, preview, loading, error: Boolean(preview) && failed === preview, onLoad, onError };
}
