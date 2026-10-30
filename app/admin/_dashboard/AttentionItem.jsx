"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { fa } from "./format";
import { TONES } from "./tones";

// جا تنگ است (روی گوشی کنار ستون کناری پنل فقط حدود ۲۰۰px می‌ماند): میلهٔ رنگی فقط از xl و دایرهٔ پیکان فقط از sm دیده می‌شود تا عنوان بیشتر از دو خط نشود.
// یک کار منتظر ادمین (سفارش جاری، نظر تأییدنشده، کالای ناموجود) داخل پنل «نیازمند توجه»: میلهٔ کوتاه و کاشی آیکون به رنگ هویت، شمار درشت و
// توضیح زیرش. با موس زمینه‌اش کم‌رنگ هم‌رنگ می‌شود و دایرهٔ پیکان به سمت رفتن (چپ) می‌لغزد و تیره می‌شود. رنگ فقط هویت است: معنی را آیکون
// و متن می‌رسانند و شمار با رنگ متن نوشته می‌شود
export default function AttentionItem({ href, icon: Icon, count, text, tone = "blue" }) {
  const t = TONES[tone];
  return (
    <Link
      href={href}
      className={`group flex h-full min-h-[4.5rem] min-w-0 items-center gap-3 rounded-xl px-2.5 py-3 transition-colors sm:px-3 duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${t.hover}`}
    >
      <span aria-hidden="true" className={`hidden h-10 w-1 shrink-0 rounded-full bg-gradient-to-b xl:block ${t.bar}`} />
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 sm:h-11 sm:w-11 transition duration-300 group-hover:-rotate-6 group-hover:scale-110 ${t.badge}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-2xl font-extrabold leading-none text-gray-900">{fa(count)}</span>
        <span className="mt-1.5 block text-sm leading-5 text-gray-600">{text}</span>
      </span>
      <span
        aria-hidden="true"
        className="hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-gray-50 text-gray-400 ring-1 ring-gray-100 transition duration-300 group-hover:-translate-x-1 group-hover:bg-gray-900 group-hover:text-white group-hover:ring-gray-900 sm:grid"
      >
        <ChevronLeft className="h-4 w-4" />
      </span>
    </Link>
  );
}
