"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

// صفحه‌بندی مشترک لیست‌ها (جایگزین نسخهٔ کپی‌شده در هر صفحه): «تعداد در صفحه» در ابتدا، «صفحهٔ a از b» وسط و دکمه‌های صفحه در انتها.
// منطق همان قبل است: شمارهٔ اول، آخر و همسایه‌های صفحهٔ فعلی با «…» میانشان. در راست‌به‌چپ «قبلی» سمت راست و «بعدی» سمت چپ است
const fa = (n) => Number(n).toLocaleString("fa-IR");

const BTN =
  "grid h-9 min-w-9 cursor-pointer place-items-center rounded-lg px-2 text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300";

export default function Pagination({ page, totalPages, pageSize, pageSizes, onPageChange, onPageSizeChange }) {
  const numbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div dir="rtl" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
      <label className="flex items-center gap-2">
        <span>تعداد در صفحه</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-9 cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          {pageSizes.map((opt) => (
            <option key={opt} value={opt}>
              {fa(opt)}
            </option>
          ))}
        </select>
      </label>

      <p className="font-medium text-gray-600" aria-live="polite">
        صفحهٔ {fa(page)} از {fa(totalPages)}
      </p>

      <nav aria-label="صفحه‌بندی" className="flex items-center gap-1">
        <button
          type="button"
          aria-label="صفحهٔ قبل"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={`${BTN} text-gray-600 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent`}
        >
          <ChevronRight className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>

        {numbers.map((item, idx) =>
          item === "..." ? (
            <span key={`gap-${idx}`} className="px-1 text-gray-400" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-label={`صفحهٔ ${fa(item)}`}
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className={`${BTN} ${item === page ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30" : "text-gray-600 hover:bg-brand-50 hover:text-brand-700"}`}
            >
              {fa(item)}
            </button>
          )
        )}

        <button
          type="button"
          aria-label="صفحهٔ بعد"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={`${BTN} text-gray-600 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent`}
        >
          <ChevronLeft className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
