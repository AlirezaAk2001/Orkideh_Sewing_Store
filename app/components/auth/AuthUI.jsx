"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { evaluatePassword } from "@/lib/passwordStrength";

// فیلدهای فرم‌های ورود: برچسب بالای فیلد (مثال‌های placeholder همیشه دیده می‌شوند)، حلقهٔ فوکوس به رنگ برند و پیام خطا زیر فیلد
const INPUT =
  "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:outline-none focus:ring-4 disabled:bg-gray-50";
const OK = "border-gray-300 focus:border-brand-500 focus:ring-brand-100";
const BAD = "border-red-400 focus:border-red-500 focus:ring-red-100";

const SHAKE = { x: [0, -10, 10, -8, 8, -5, 5, 0], transition: { duration: 0.4 } };

// رنگ هر درجهٔ قدرت رمز (کلاس‌ها کامل نوشته شده‌اند تا Tailwind آن‌ها را بشناسد)
const BAR = { 1: "bg-red-500", 2: "bg-amber-500", 3: "bg-lime-500", 4: "bg-emerald-600" };
const TEXT = { 1: "text-red-600", 2: "text-amber-600", 3: "text-lime-700", 4: "text-emerald-700" };

// ایمیل، نام کاربری، رمز و کد را چپ‌به‌راست (ltr) می‌نویسیم تا نویسه‌های لاتین و نمادها جابه‌جا نشوند
export function TextInput({ invalid = false, ltr = false, className = "", ...props }) {
  return (
    <input
      dir={ltr ? "ltr" : undefined}
      aria-invalid={invalid || undefined}
      className={`${INPUT} ${ltr ? "text-left" : ""} ${invalid ? BAD : OK} ${className}`}
      {...props}
    />
  );
}

function Mark({ ok }) {
  return (
    <span
      aria-hidden="true"
      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full transition-colors duration-200 ${ok ? "bg-emerald-500 text-white" : "bg-white text-transparent ring-1 ring-inset ring-gray-300"}`}
    >
      <Check className="h-3 w-3" strokeWidth={3.5} />
    </span>
  );
}

// راهنمای زندهٔ رمز: درجهٔ قدرت (چهار پله) و فهرست شرط‌ها که با هر نویسه تیک می‌خورند. بالای فیلد (top) یا زیر آن (bottom) باز می‌شود
function PasswordTips({ id, value, placement }) {
  const { level, label, rules, extras } = evaluatePassword(value);
  const above = placement === "top";

  const row = (r) => (
    <li key={r.id} className={`flex items-center gap-2 text-xs leading-5 transition-colors duration-200 ${r.ok ? "text-gray-800" : "text-gray-500"}`}>
      <Mark ok={r.ok} />
      <span>
        {r.label}
        {r.symbols && (
          <>
            {" "}
            <bdi dir="ltr" className="font-mono text-[11px] text-gray-500">{r.symbols}</bdi>
          </>
        )}
      </span>
      <span className="sr-only">{r.ok ? "رعایت شده" : "رعایت نشده"}</span>
    </li>
  );

  return (
    <div
      id={id}
      role="tooltip"
      className={`auth-pop ${above ? "auth-pop--up bottom-full mb-3" : "auth-pop--down top-full mt-3"} absolute start-0 z-30 w-72 max-w-[calc(100vw-3rem)] rounded-2xl bg-white p-4 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.3)] ring-1 ring-gray-200`}
    >
      <span
        aria-hidden="true"
        className={`absolute start-6 h-3 w-3 rotate-45 bg-white ${above ? "-bottom-1.5 border-b border-r border-gray-200" : "-top-1.5 border-l border-t border-gray-200"}`}
      />
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-gray-700">قدرت رمز عبور</span>
        <span className={`font-bold transition-colors duration-200 ${TEXT[level]}`}>{label}</span>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-1.5 rounded-full transition-colors duration-300 ${i <= level ? BAR[level] : "bg-gray-200"}`} />
        ))}
      </div>
      <span className="sr-only" aria-live="polite">قدرت رمز عبور: {label}</span>

      <ul className="mt-3.5 space-y-1.5">{rules.map(row)}</ul>
      <p className="mt-3 border-t border-gray-100 pt-2.5 text-[11px] font-medium text-gray-400">برای رمز قوی‌تر</p>
      <ul className="mt-1.5 space-y-1.5">{extras.map(row)}</ul>
    </div>
  );
}

// meter: وقتی کاربر در فیلد تایپ می‌کند راهنمای قدرت و شرط‌های رمز را نشان می‌دهد (با Esc بسته می‌شود و با تایپ بعدی برمی‌گردد)
export function PasswordInput({ invalid = false, className = "", meter = false, tipsPlacement = "top", onFocus, onBlur, onKeyDown, ...props }) {
  const [shown, setShown] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissedFor, setDismissedFor] = useState(null);
  const tipsId = useId();
  const value = typeof props.value === "string" ? props.value : "";
  const open = meter && focused && value !== "" && dismissedFor !== value;

  return (
    <div
      className="relative"
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        // فوکوس به دکمهٔ چشم یا خود فیلد می‌رود؛ فقط با خروج از کل مجموعه راهنما بسته شود
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      <TextInput
        ltr
        invalid={invalid}
        type={shown ? "text" : "password"}
        className={`pr-11 ${className}`}
        aria-describedby={open ? tipsId : undefined}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) setDismissedFor(value);
          onKeyDown?.(e);
        }}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        onMouseDown={(e) => e.preventDefault()} // فوکوس در فیلد می‌ماند و راهنما نمی‌پرد
        aria-label={shown ? "پنهان کردن رمز" : "نمایش رمز"}
        aria-pressed={shown}
        className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {shown ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
      </button>
      {open && <PasswordTips id={tipsId} value={value} placement={tipsPlacement} />}
    </div>
  );
}

// برچسب + فیلد + پیام (خطا یا راهنما)؛ shake فیلد را هنگام خطا می‌لرزاند؛ index ترتیب ظاهر شدن تدریجی فیلدهاست.
// فیلدی که فوکوس دارد بالاتر از همسایه‌ها می‌نشیند تا راهنمای بازشونده‌اش زیر فیلد بعدی نرود
export function Field({ id, label, error, hint, shake = false, index = 0, className = "", children }) {
  return (
    <div className={`auth-rise relative focus-within:z-20 ${className}`} style={{ "--i": index }}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <motion.div animate={shake ? SHAKE : {}}>{children}</motion.div>
      {error ? (
        <p role="alert" className="auth-message mt-1.5 text-xs leading-5 text-red-600">
          {error}
        </p>
      ) : (
        hint && <div className="mt-1.5 text-xs leading-5 text-gray-500">{hint}</div>
      )}
    </div>
  );
}

// دکمهٔ اصلی فرم‌ها؛ در حال ارسال قفل می‌شود و چرخان نشان می‌دهد. برق روی hover همان برق چیپ تخفیف است (.auth-sheen در globals.css)
export function SubmitButton({ loading = false, loadingText, icon: Icon, children, ...props }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="auth-sheen inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-600 text-base font-semibold text-white shadow-lg shadow-brand-600/25 transition enabled:hover:bg-brand-700 enabled:hover:shadow-xl enabled:hover:shadow-brand-600/30 enabled:active:scale-[0.985] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 disabled:cursor-wait disabled:opacity-75"
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          {loadingText}
        </>
      ) : (
        <>
          {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
          {children}
        </>
      )}
    </button>
  );
}

// کارت سفید فرم‌ها؛ wide برای ثبت‌نام است که فیلدهایش دوتا‌دوتا کنار هم می‌نشینند تا کارت در صفحه جا شود و اسکرول نشود
export function AuthCard({ children, wide = false, className = "" }) {
  return (
    <div
      className={`auth-rise mx-auto w-full rounded-3xl bg-white p-6 shadow-[0_24px_60px_-24px_rgb(190_24_93/0.3)] ring-1 ring-gray-100 transition-[max-width] duration-300 ease-out sm:px-8 sm:py-7 ${wide ? "max-w-xl" : "max-w-md"} ${className}`}
    >
      {children}
    </div>
  );
}

export function AuthTitle({ title, text, icon: Icon }) {
  return (
    <div className="mb-5 text-center">
      {Icon && (
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </span>
      )}
      <h1 className="text-2xl font-extrabold text-gray-900">{title}</h1>
      {text && <p className="mt-2 text-balance text-sm leading-7 text-gray-500">{text}</p>}
    </div>
  );
}

export const LINK_BUTTON =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-brand-700 transition hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";
