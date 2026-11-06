"use client";

import { useId } from "react";
import { ChevronDown } from "lucide-react";

// فیلدهای فرم‌های پنل (جای TextField مواد): برچسب همیشه بالای فیلد (نه شناور، که در راست‌به‌چپ جابه‌جا می‌شد)، ستارهٔ الزامی، یک خط راهنما یا خطا زیر فیلد
// و پسوند داخل فیلد (تومان، ٪، گرم). برچسب با htmlFor به فیلد وصل است و راهنما با aria-describedby. فیلد فوکوس‌شده حلقهٔ صورتی برند می‌گیرد.
// عدد، آدرس و نام فایل لاتین‌اند، پس dir="ltr" می‌گیرند و از چپ شروع می‌شوند؛ باقی متن فارسی و راست‌به‌چپ است
const INPUT =
  "block w-full rounded-xl border bg-white px-3.5 text-sm text-gray-900 transition placeholder:text-gray-400 hover:border-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 read-only:bg-gray-50 read-only:text-gray-600 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]";

function Shell({ id, label, required, hint, error, className = "", children }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label}
        {required && (
          <span aria-hidden="true" className="ms-0.5 text-brand-600">
            *
          </span>
        )}
      </label>
      {children}
      {(error || hint) && (
        <p id={`${id}-hint`} className={`mt-1.5 text-xs leading-5 ${error ? "text-red-600" : "text-gray-500"}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

// suffix: نوشتهٔ کوچک ته فیلد (واحد)، همیشه سمت چپِ فیلد (پایان در صفحهٔ راست‌به‌چپ) با فاصلهٔ فیزیکی pl-16؛ فیلد ltr دارای واحد، عدد را راست‌چین می‌کند تا به واحد نخورد.
// ltr: برای عدد، اسلاگ و نام فایل (بدون واحد از چپ شروع می‌شود)
export function TextInput({ label, hint, error, required, suffix, ltr = false, className = "", inputClassName = "", ...props }) {
  const id = useId();
  return (
    <Shell id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <div className="relative">
        <input
          id={id}
          required={required}
          dir={ltr ? "ltr" : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-hint` : undefined}
          className={`${INPUT} h-11 ${error ? "border-red-400" : "border-gray-300"} ${ltr ? (suffix ? "text-right" : "text-left") : ""} ${suffix ? "pl-16" : ""} ${inputClassName}`}
          {...props}
        />
        {suffix && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-medium text-gray-400">
            {suffix}
          </span>
        )}
      </div>
    </Shell>
  );
}

export function TextArea({ label, hint, error, required, rows = 3, className = "", ...props }) {
  const id = useId();
  return (
    <Shell id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-hint` : undefined}
        className={`${INPUT} resize-y py-2.5 leading-7 ${error ? "border-red-400" : "border-gray-300"}`}
        {...props}
      />
    </Shell>
  );
}

// select بومی مرورگر (روی گوشی منوی خود دستگاه را باز می‌کند) با فلش سفارشی؛ گزینهٔ اول خالی است و نقش راهنما را دارد
export function SelectInput({ label, hint, error, required, placeholder, className = "", children, ...props }) {
  const id = useId();
  return (
    <Shell id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <div className="relative">
        <select
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-hint` : undefined}
          className={`${INPUT} h-11 cursor-pointer appearance-none pe-10 ${error ? "border-red-400" : "border-gray-300"}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {children}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-gray-400" />
      </div>
    </Shell>
  );
}
