"use client";

import { useContext } from "react";
import { createPortal } from "react-dom";
import { Ruler, Scissors, Spool } from "lucide-react";
import { HeaderSlotContext } from "./HeaderSlot";

// ابزارهای خیاطی تزئینی میان عنوان و دکمه‌ها (همان قرقره، قیچی و متر و همان شناوری auth-float صفحهٔ محصولات و پروفایل؛ --r زاویه، --dur مدت، --delay تأخیر).
// ارتفاع‌های متفاوت با margin است چون transform دست انیمیشن شناوری است
const TOOLS = [
  { icon: Spool, className: "mb-3", style: { "--r": "-10deg", "--dur": "10s" } },
  { icon: Scissors, className: "", style: { "--r": "14deg", "--dur": "12s", "--delay": "-4s" } },
  { icon: Ruler, className: "mt-3", style: { "--r": "-18deg", "--dur": "11s", "--delay": "-7s" } },
];

// سربرگ مشترک صفحه‌های پنل: کاشی آیکون، عنوان درشت (h1)، یک خط توضیح یا شمار نتایج و دکمه‌های کار صفحه در سمت پایان (چپ). زیرش خط‌چین کم‌رنگ
// است (یادآور بخیه). زیرعنوان در یک چیپ گرد سفیدِ نیمه‌شفاف با حلقهٔ برند می‌نشیند؛ ارتفاعش ۲۴px است (همان خط قبلی)، پس قد سربرگ و صفحه‌های بی‌اسکرولِ اندازه‌گرفته‌شده عوض نمی‌شود. subtitleKey با عوض‌شدن، زیرعنوان را دوباره با حرکت کوچک وارد می‌کند؛ loading جایش را با نوار اسکلتون پر می‌کند.
// میان عنوان و دکمه‌ها (از lg به بالا) ابزارهای خیاطی کم‌رنگ شناورند: فقط فضای خالی را می‌گیرند (flex-1 با پایهٔ صفر)، و اگر فضا از ۹ rem کمتر شد
// (عنوان یا دکمه‌ها زیاد باشند) container آن‌ها را مخفی می‌کند تا هرگز روی نوشته نیفتند.
// سربرگ در همهٔ صفحه‌ها ثابت است: خودش داخل اسکرولر <main> نمی‌ماند و با portal در جایگاه بالای آن (HeaderSlot، layout.jsx) کشیده می‌شود، پس اسکرول صفحه دقیقاً از زیر
// خط‌چین شروع می‌شود و محتوا همان‌جا بریده می‌شود. فاصلهٔ زیر خط‌چین را padding بالای main می‌دهد (به همین خاطر mb ندارد)
export default function PageHeader({ icon, title, subtitle, subtitleColor, subtitleKey, loading = false, actions }) {
  const slot = useContext(HeaderSlotContext);
  if (!slot) return null;

  return createPortal(
    <header className="admin-page-in flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-dashed border-gray-300/80 pb-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-brand-100">{icon}</span>
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold leading-8 text-gray-900 sm:text-2xl">{title}</h1>
          <div className="min-h-6">
            {loading ? (
              <span className="block h-6 w-32 animate-pulse rounded-full bg-gray-200" aria-hidden="true" />
            ) : (
              subtitle && (
                <p
                  key={subtitleKey}
                  className={`admin-swap inline-block max-w-full rounded-full bg-white/80 px-3 text-sm leading-6 shadow-sm ring-1 ring-brand-100 ${subtitleColor ? "[&_b]:text-inherit" : "text-gray-600 [&_b]:text-brand-700"} [&_b]:font-bold`}
                  style={subtitleColor ? { color: subtitleColor } : undefined}
                >
                  {subtitle}
                </p>
              )
            )}
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="pointer-events-none hidden min-w-0 flex-1 basis-0 @container lg:block">
        <div className="flex items-center justify-around px-2 @max-[9rem]:hidden">
          {TOOLS.map(({ icon: Icon, className, style }) => (
            <Icon key={className || "mid"} className={`auth-float h-9 w-9 shrink-0 text-brand-500/[0.22] ${className}`} style={style} strokeWidth={1.1} />
          ))}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>,
    slot
  );
}
