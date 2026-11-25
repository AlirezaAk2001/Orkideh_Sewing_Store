"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Check, Copy } from "lucide-react";
import { tip } from "@/lib/tip";
import { copyText } from "./format";

// دکمهٔ کپی کارت سفارش: بی‌متن (آیکون کوچک کنار هر مقدار، با tooltip) یا با متن (children، برای «کپی اطلاعات ارسال»). بعد از کپی آیکون برای ۱٫۶ ثانیه تیک سبز می‌شود.
// value متنی است که کپی می‌شود (رقم‌ها لاتین می‌مانند تا در سامانهٔ ارسال بی‌دردسر بچسبند) و what نام آن برای پیام («شماره تماس کپی شد»)
export default function CopyButton({ value, what, children }) {
  const [done, setDone] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    const ok = await copyText(value);
    if (!ok) {
      toast.error("کپی انجام نشد");
      return;
    }
    toast.success(`${what} کپی شد`);
    setDone(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 1600);
  };

  const Glyph = done ? Check : Copy;
  const glyph = <Glyph key={done ? "done" : "copy"} className={`h-4 w-4 ${done ? "od-pop text-emerald-600" : ""}`} aria-hidden="true" />;

  if (children) {
    return (
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-white px-2.5 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-200 transition-colors hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
      >
        {glyph}
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`کپی ${what}`}
      {...tip(`کپی ${what}`)}
      className="btn-flat grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
    >
      {glyph}
    </button>
  );
}
