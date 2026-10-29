"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildListUrl, parseListParams } from "@/lib/productQuery";

const fa = (n) => Number(n).toLocaleString("fa-IR");
const allParams = parseListParams({});
const FADE = 40; // عرض محوشدگی لبه‌ها وقتی ردیف بیشتر از جا دارد (px)

const ARROW_CLASS =
  "absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white text-gray-700 shadow-md ring-1 ring-gray-200 transition duration-200 hover:bg-brand-600 hover:text-white hover:ring-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:grid";

// برندهای موجود در فروشگاه با نام فارسی و تعداد محصول؛ هر برند لینک فهرست محصولاتی است که نامشان آن برند را دارد (?q=برند).
// برندها را صفحهٔ سروری از نام محصول‌ها درمی‌آورد (lib/brands.js)، پس برند تازه با اولین محصولش اینجا می‌آید.
// chip-3d همان دکمهٔ سه‌بعدی چیپ دسته‌های فهرست محصولات است (globals.css).
// همهٔ برندها همیشه در یک ردیف و یک خط‌اند: اگر جا باشد وسط‌چین می‌شوند، وگرنه ردیف خودش اسکرول می‌شود (کشیدن انگشت، تاچ‌پد یا Tab)
// و لبه‌های سمتی که برندهای بیشتری دارد کم‌رنگ می‌شود؛ روی دسکتاپ دو دکمهٔ قبلی/بعدی هم همان سمت‌ها دیده می‌شوند.
export default function BrandStrip({ brands }) {
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
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: "smooth" });
  };

  // راست‌به‌چپ: ابتدای ردیف سمت راست است. سمت راست وقتی کم‌رنگ می‌شود که قبلی‌ها بیرون‌اند، سمت چپ وقتی بعدی‌ها
  const fade = `linear-gradient(to right, ${edge.next ? `transparent 0, #000 ${FADE}px` : "#000 0"}, ${
    edge.prev ? `#000 calc(100% - ${FADE}px), transparent 100%` : "#000 100%"
  })`;
  const mask = edge.prev || edge.next ? { maskImage: fade, WebkitMaskImage: fade } : undefined;

  return (
    <section aria-labelledby="home-brands" className="text-center">
      <h2 id="home-brands" className="text-sm font-medium text-gray-500">
        برندهای موجود در فروشگاه
      </h2>
      <div className="relative mx-auto mt-3 w-max max-w-full">
        {edge.prev && (
          <button type="button" onClick={() => scrollByPage(1)} aria-label="برندهای قبلی" className={`${ARROW_CLASS} right-0`}>
            <ChevronRight className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
          </button>
        )}
        {/* بالا و پایین فضای خالی دارد تا بالا آمدن چیپ و سایهٔ سه‌بعدی‌اش هنگام hover توسط overflow بریده نشود */}
        <ul
          ref={scroller}
          onScroll={updateEdges}
          style={mask}
          className="no-scrollbar -mt-2 -mb-6 flex flex-nowrap items-center gap-2 overflow-x-auto scroll-smooth px-1 pt-2 pb-6"
        >
          {brands.map((brand) => (
            <li key={brand.name} className="shrink-0">
              <Link
                href={buildListUrl("/products", allParams, { q: brand.name })}
                aria-label={`محصولات برند ${brand.name} (${fa(brand.count)} محصول)`}
                className="chip-3d inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                {brand.name}
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-normal leading-none text-gray-500">{fa(brand.count)}</span>
              </Link>
            </li>
          ))}
        </ul>
        {edge.next && (
          <button type="button" onClick={() => scrollByPage(-1)} aria-label="برندهای بعدی" className={`${ARROW_CLASS} left-0`}>
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
