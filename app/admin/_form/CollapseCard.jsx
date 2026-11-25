"use client";

import { useId } from "react";
import { ChevronDown } from "lucide-react";

// کارت جمع‌شونده (جای <details> بومی که بستنش انیمیشن ندارد)؛ در «افزودن با نام فایل» فرم محصول و «ثبت با نام فایل یا آدرس» فرم بنر و دسته‌بندی.
// بسته: کارت خاکستری با کاشی آیکون، عنوان، توضیح (subtitle) و فلش؛ هاور: حلقه و کاشی صورتی می‌شود. با کلیک: کاشی پر رنگ برند، فلش با جهش می‌چرخد، کارت سفید با حلقهٔ برند و سایهٔ نرم می‌شود
// و بدنه با باز شدن ردیف شبکه (۰fr تا ۱fr) نرم پایین می‌آید. بدنهٔ بسته inert است تا Tab به فیلد پنهان نرسد. open و onToggle را والد نگه می‌دارد (تا بتواند
// با باز شدن فوکوس بدهد یا خودش بازش کند). بدنه pt-3 دارد: عنوان شناورِ فیلدِ اولش ۹px بالاتر از لبهٔ آن می‌زند و overflow-hidden بالای پنل بریدش
export default function CollapseCard({ icon: Icon, title, subtitle, open, onToggle, className = "", children }) {
  const id = useId();
  return (
    <div
      className={`rounded-2xl ring-1 transition-[background-color,box-shadow] duration-300 motion-reduce:transition-none ${
        open ? "bg-white shadow-[0_14px_30px_-20px_rgb(190_24_93/0.5)] ring-brand-200" : "bg-gray-50 ring-gray-100 hover:ring-brand-200"
      } ${className}`}
    >
      <button
        type="button"
        id={`${id}-btn`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className={`btn-flat group flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-3 text-start transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 ${open ? "" : "hover:bg-brand-50/60"}`}
      >
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ring-1 transition-[color,box-shadow,scale] duration-300 motion-reduce:transition-none ${
            open ? "from-brand-500 to-brand-700 text-white shadow-sm ring-brand-600/30" : "from-brand-50 to-brand-100 text-brand-600 ring-brand-100 group-hover:scale-105"
          }`}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-6 text-gray-800">{title}</span>
          <span className="block text-xs leading-5 text-gray-500">{subtitle}</span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-[rotate,color] duration-[350ms] ease-[cubic-bezier(0.34,1.5,0.5,1)] motion-reduce:transition-none ${open ? "rotate-180 text-brand-600" : "text-gray-400 group-hover:text-brand-600"}`}
          aria-hidden="true"
        />
      </button>

      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-btn`}
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className={`px-3.5 pb-3.5 pt-3 transition-transform duration-300 ease-out motion-reduce:transition-none ${open ? "translate-y-0" : "-translate-y-2"}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
