"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { fa } from "./format";
import { TONES } from "./tones";

// میان‌بر به یک بخش مدیریت: آیکون رنگی در کاشی گرد، عدد درشت و نام بخش. هاله‌ای هم‌رنگ از گوشه می‌تابد؛ با موس کارت بالا می‌آید،
// آیکون کمی می‌چرخد و دایرهٔ پیکان به سمت رفتن (چپ) می‌لغزد و تیره می‌شود
export default function ShortcutCard({ href, name, icon, value, tone = "brand", index = 0 }) {
  const t = TONES[tone];
  return (
    <Link
      href={href}
      className="dash-rise group relative flex h-full min-h-[8.25rem] flex-col justify-between gap-6 overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      style={{ "--i": index }}
    >
      <span aria-hidden="true" className={`pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-90 ${t.glow}`} />
      <span className="relative flex items-start justify-between">
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ring-1 transition duration-300 group-hover:-rotate-6 group-hover:scale-110 ${t.badge}`}>{icon}</span>
        <span
          aria-hidden="true"
          className="grid h-8 w-8 place-items-center rounded-full bg-gray-50 text-gray-400 ring-1 ring-gray-100 transition duration-300 group-hover:-translate-x-1 group-hover:bg-gray-900 group-hover:text-white group-hover:ring-gray-900"
        >
          <ChevronLeft className="h-4 w-4" />
        </span>
      </span>
      <span className="relative block">
        <span className="block text-3xl font-extrabold leading-none text-gray-900">{fa(value ?? 0)}</span>
        <span className="mt-2 block text-sm text-gray-500">{name}</span>
      </span>
    </Link>
  );
}
