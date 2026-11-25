"use client";

import { Fragment } from "react";
import { toLatinDigits } from "@/lib/productQuery";

export const CODE_LENGTH = 6;

const FA = "۰۱۲۳۴۵۶۷۸۹";

// رقم فارسی و عربی هم پذیرفته می‌شود (کیبورد فارسی) و هر چیز غیر رقم (فاصله، نوشتهٔ دور کدِ چسبانده‌شده) کنار می‌رود
const clean = (text) => toLatinDigits(text).replace(/\D/g, "").slice(0, CODE_LENGTH);

// کد تأیید در شش خانه (استایل vf-otp در verify.css). زیر ظاهر خانه‌ها فقط یک input واقعی و شفاف روی همه‌شان است، پس چسباندن کد، پر کردن خودکار گوشی
// (one-time-code) و صفحه‌خوان مثل یک فیلد معمولی کار می‌کنند. مکان‌نما همیشه ته کد می‌ماند (مگر «انتخاب همه») و خانهٔ بعدی با :focus-within مشخص می‌شود
export default function OtpInput({ value, onChange, invalid = false, shake = false, ...props }) {
  const next = Math.min(value.length, CODE_LENGTH - 1);

  const keepCaretAtEnd = (e) => {
    const el = e.currentTarget;
    const end = el.value.length;
    const all = el.selectionStart === 0 && el.selectionEnd === end;
    if (!all && (el.selectionStart !== end || el.selectionEnd !== end)) el.setSelectionRange(end, end);
  };

  // کد کاملِ چسبانده‌شده جای هرچه بود می‌نشیند؛ تکهٔ کوتاه به ته کد اضافه می‌شود
  const handlePaste = (e) => {
    const digits = clean(e.clipboardData.getData("text"));
    e.preventDefault();
    if (digits) onChange(digits.length === CODE_LENGTH ? digits : clean(value + digits));
  };

  return (
    <div className="vf-otp" dir="ltr" data-invalid={invalid || undefined} data-shake={shake || undefined}>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-invalid={invalid || undefined}
        className="vf-otp-input"
        value={value}
        onChange={(e) => onChange(clean(e.target.value))}
        onPaste={handlePaste}
        onSelect={keepCaretAtEnd}
        {...props}
      />
      {Array.from({ length: CODE_LENGTH }, (_, i) => (
        <Fragment key={i}>
          {i === CODE_LENGTH / 2 && <span className="vf-sep" aria-hidden="true" />}
          <span className="vf-cell" aria-hidden="true" data-filled={i < value.length || undefined} data-next={i === next || undefined}>
            {value[i] && (
              <span key={value[i]} className="vf-digit">
                {FA[value[i]]}
              </span>
            )}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
