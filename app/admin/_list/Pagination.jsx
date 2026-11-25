"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useSlidePill from "@/app/components/useSlidePill";
import PageSizeSelect from "./PageSizeSelect";
import "./list.css";

// صفحه‌بندی مشترک لیست‌ها (جایگزین نسخهٔ کپی‌شده در هر صفحه): «تعداد در صفحه» در ابتدا، «صفحهٔ a از b» وسط و دکمه‌های صفحه در انتها.
// منطق همان قبل است: شمارهٔ اول، آخر و همسایه‌های صفحهٔ فعلی با «…» میانشان. در راست‌به‌چپ «قبلی» سمت راست و «بعدی» سمت چپ است
const fa = (n) => Number(n).toLocaleString("fa-IR");

const BTN =
  "grid h-9 min-w-9 cursor-pointer place-items-center rounded-lg px-2 text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300";

export default function Pagination({ page, totalPages, pageSize, pageSizes, onPageChange, onPageSizeChange }) {
  // قرص لغزان زیر شمارهٔ صفحهٔ جاری (list.css و useSlidePill)
  const navBox = useRef(null);
  const navPill = useRef(null);
  useSlidePill(navBox, navPill, page);
  const numbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div dir="rtl" className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
      <PageSizeSelect value={pageSize} options={pageSizes} onChange={onPageSizeChange} />

      <p className="font-medium text-gray-600" aria-live="polite">
        صفحهٔ {fa(page)} از {fa(totalPages)}
      </p>

      <nav ref={navBox} aria-label="صفحه‌بندی" className="alst-pg-nav flex items-center gap-1">
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
              className={`alst-pg ${BTN} ${item === page ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30" : "text-gray-600 hover:bg-brand-50 hover:text-brand-700"}`}
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
        <i ref={navPill} className="alst-pg-pill" aria-hidden="true" />
      </nav>
    </div>
  );
}
