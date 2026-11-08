"use client";

import { useEffect, useRef, useState } from "react";
import { avatarLetter, avatarType, presetOf } from "@/lib/avatar";
import { AVATAR_ICONS } from "./avatarIcons";

// طرح آماده: دایرهٔ گرادیانی (در CSS: .av[data-type="preset"]) با حلقهٔ «بخیهٔ گلدوزی» و آیکون سفید
function PresetFace({ keyName }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="43" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.7" strokeDasharray="3.4 3.6" strokeLinecap="round" />
      <svg x="27" y="27" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {AVATAR_ICONS[keyName]}
      </svg>
    </svg>
  );
}

/**
 * آواتار گرد کاربر، یک کامپوننت برای همهٔ جاها (هدر، پنل، تنظیمات، نظرها).
 *   value  مقدار نمایشی (lib/avatar.js): "" = حرف اول نام | "preset:<کلید>" | "/uploads/<فایل>" | آدرس عکس گوگل
 *   name   نام کاربر (حرف اولش برای حالت پیش‌فرض)
 *   size   اندازه به پیکسل (متغیر --s)؛ بدون آن، اندازه از CSS می‌آید (مثلاً کلاس‌های واکنش‌گرا)
 *   label  اگر باشد آواتار برای صفحه‌خوان «تصویر» با همین نام است؛ وگرنه تزئینی است (کنار نام نوشته شده)
 * عکسی که بارگذاری نشود (فایل پاک‌شده، آدرس گوگل منقضی) بی‌صدا به حرف اول برمی‌گردد.
 */
export default function Avatar({ value = "", name = "", size, label, className = "", style, ...rest }) {
  const wanted = avatarType(value);
  const preset = wanted === "preset" ? presetOf(value.slice(7)) : null;
  const [failed, setFailed] = useState(null); // مقداری که عکسش بالا نیامد (با عوض‌شدن value خودبه‌خود بی‌اثر می‌شود)
  const img = useRef(null);

  // خطای بارگذاری اگر پیش از هیدراته‌شدن رخ داده باشد onError را از دست می‌دهد؛ اینجا دوباره بررسی می‌شود
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(value);
  }, [value]);

  let type = wanted;
  if (wanted === "preset" && !preset) type = "initial";
  if ((wanted === "photo" || wanted === "google") && failed === value) type = "initial";

  const css = { ...style };
  if (size) css["--s"] = `${size}px`;
  if (type === "preset") {
    css["--c0"] = preset.c[0];
    css["--c1"] = preset.c[1];
  }
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": "true" };

  return (
    <span className={`av ${className}`.trim()} data-type={type} style={css} {...a11y} {...rest}>
      {type === "preset" && <PresetFace keyName={preset.key} />}
      {(type === "photo" || type === "google") && (
        // <img> عادی: عکس ۲۵۶ پیکسلی است و آدرس گوگل از دامنهٔ بیرونی؛ referrer فرستاده نمی‌شود تا گوگل عکس را رد نکند
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={img} src={value} alt="" loading="lazy" decoding="async" draggable={false} referrerPolicy="no-referrer" onError={() => setFailed(value)} />
      )}
      {type === "initial" && <b>{avatarLetter(name)}</b>}
    </span>
  );
}
