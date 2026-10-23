"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "../ProductCard";

const ARROW_CLASS =
  "grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white text-gray-700 shadow-sm ring-1 ring-gray-200 transition duration-200 enabled:hover:bg-brand-600 enabled:hover:text-white enabled:hover:shadow-md enabled:hover:ring-brand-600 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-300 disabled:shadow-none";

// ردیف افقی محصولات با اسکرول لمسی (scroll-snap)؛ روی دسکتاپ دکمه‌های قبلی/بعدی هم دارد.
// دکمه‌ها فقط وقتی جا برای حرکت در آن جهت هست فعال‌اند و اگر همهٔ کارت‌ها جا شوند نامرئی‌اند.
// آخر ردیف یک کاشی «مشاهده همه» است (تنها لینک «مشاهده همه» هر بخش) که اگر کارت‌ها کم باشند، جای خالی را پر می‌کند.
// ردیف کمی بالا و پایین فضای خالی دارد تا بالا آمدن کارت‌ها و سایه‌شان هنگام hover توسط overflow بریده نشود.
export default function ProductRail({ id, title, subtitle, href, products }) {
  const scroller = useRef(null);
  const [edge, setEdge] = useState({ prev: false, next: false });

  const updateEdges = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    // صفحه راست‌به‌چپ است و scrollLeft از صفر به سمت منفی می‌رود؛ قدر مطلقش برای هر دو جهت درست است
    const pos = Math.abs(el.scrollLeft);
    const prev = pos > 2;
    const next = el.scrollWidth - el.clientWidth - pos > 2;
    setEdge((cur) => (cur.prev === prev && cur.next === next ? cur : { prev, next }));
  }, []);

  // ResizeObserver بلافاصله بعد از observe یک بار هم صدا زده می‌شود، پس وضعیت اولیه همین‌جا اندازه‌گیری می‌شود
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateEdges]);

  // «بعدی» یعنی رفتن به چپ (scrollLeft منفی‌تر می‌شود)
  const scrollByPage = (direction) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const canScroll = edge.prev || edge.next;

  return (
    <section aria-labelledby={id}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 id={id} className="text-xl font-bold text-gray-900 sm:text-2xl">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`hidden shrink-0 items-center gap-2 md:flex ${canScroll ? "" : "invisible"}`}>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={!edge.prev}
            aria-label="قبلی"
            className={ARROW_CLASS}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={!edge.next}
            aria-label="بعدی"
            className={ARROW_CLASS}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
          </button>
        </div>
      </div>

      <ul
        ref={scroller}
        onScroll={updateEdges}
        className="no-scrollbar -mx-4 -mt-2 -mb-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto scroll-smooth px-4 pt-2 pb-7"
      >
        {products.map((product) => (
          <li
            key={product.id}
            className="w-[64%] shrink-0 snap-start min-[480px]:w-[44%] md:w-[31%] lg:w-[23.4%]"
          >
            <ProductCard product={product} priority={false} />
          </li>
        ))}
        {href && (
          <li className="flex min-w-[220px] shrink-0 grow basis-[220px] snap-start">
            <Link
              href={href}
              className="group relative flex w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-brand-50 p-6 text-center ring-1 ring-brand-100 transition duration-300 hover:shadow-xl hover:ring-brand-200 motion-safe:hover:-translate-y-1"
            >
              {/* دو دایرهٔ تزئینی که با hover جایشان را عوض می‌کنند (استایل در globals.css) */}
              <span aria-hidden="true" className="tile-circle-a bg-brand-100" />
              <span aria-hidden="true" className="tile-circle-b bg-brand-100/70" />
              <span className="relative grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-white shadow-md transition-transform duration-300 group-hover:-translate-x-1">
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="relative text-lg font-bold text-gray-900">مشاهده همه</span>
              <span className="relative text-sm text-gray-600">همهٔ محصولات فروشگاه</span>
            </Link>
          </li>
        )}
      </ul>
    </section>
  );
}
