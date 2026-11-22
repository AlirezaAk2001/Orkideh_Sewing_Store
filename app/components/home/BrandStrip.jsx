"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppImage from "../AppImage";
import SectionHeading from "./SectionHeading";
import { buildListUrl, parseListParams } from "@/lib/productQuery";
import "./marquee.css";

const fa = (n) => Number(n).toLocaleString("fa-IR");
const allParams = parseListParams({});
const SECONDS_PER_BRAND = 6; // سرعت نوار: هر برند حدود ۶ ثانیه در مسیر است

// برندهای موجود در فروشگاه با نام فارسی و تعداد محصول؛ هر برند لینک فهرست محصولاتی است که نامشان آن برند را دارد (?q=برند).
// برندها را صفحهٔ سروری از نام محصول‌ها درمی‌آورد (lib/brands.js)، پس برند تازه با اولین محصولش اینجا می‌آید.
// هر برند یک کارت است: لوگوی برند (brand.logo از lib/brandLogos.js؛ خاکستری که با هاور رنگی می‌شود) یا، برای برندی که لوگو ندارد، نشان گرادیانی حرف اول نامش،
// نام فارسی و «n محصول». استایل کارت‌ها (bc-) در marquee.css است.
// جا باشد: همهٔ برندها در یک ردیف و وسط‌چین و ثابت‌اند. جا نباشد: نوار خودش بی‌پایان به سمت راست می‌رود (دو نسخهٔ پشت‌سرهم؛ نسخهٔ دوم aria-hidden و inert است)
// و با ماندن موس یا فوکوس می‌ایستد. اندازه‌گیری روی نسخهٔ اول است تا با اضافه‌شدن نسخهٔ دوم، تصمیم برنگردد.
export default function BrandStrip({ brands }) {
  const box = useRef(null);
  const list = useRef(null);
  const [loop, setLoop] = useState(false);

  // ResizeObserver بلافاصله بعد از observe یک بار هم صدا زده می‌شود، پس وضعیت اولیه همین‌جا اندازه‌گیری می‌شود
  useEffect(() => {
    const boxEl = box.current;
    const listEl = list.current;
    if (!boxEl || !listEl) return;
    const measure = () => setLoop(listEl.offsetWidth > boxEl.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(boxEl);
    observer.observe(listEl);
    return () => observer.disconnect();
  }, []);

  const cards = brands.map((brand, index) => (
    <li key={brand.name} className="shrink-0" style={{ "--i": Math.min(index, 8) }}>
      <Link
        href={buildListUrl("/products", allParams, { q: brand.name })}
        aria-label={`محصولات برند ${brand.name} (${fa(brand.count)} محصول)`}
        className="bc"
      >
        <span className="bc-mark">
          {brand.logo ? (
            <AppImage src={brand.logo.src} alt="" width={brand.logo.width} height={brand.logo.height} className="bc-logo" />
          ) : (
            <span className="bc-mono" aria-hidden="true">
              {brand.name.charAt(0)}
            </span>
          )}
        </span>
        <b>{brand.name}</b>
        <span className="bc-n">{fa(brand.count)} محصول</span>
      </Link>
    </li>
  ));

  return (
    <section aria-labelledby="home-brands">
      <SectionHeading
        id="home-brands"
        eyebrow="برندها"
        icon="badge"
        title="برندهای موجود در فروشگاه"
        subtitle="محصولات را بر اساس برند مورد علاقه‌تان ببینید"
      />
      <div ref={box} className={`bm${loop ? " bm-loop" : ""}`}>
        <div className="bm-track" style={{ "--bm-dur": `${brands.length * SECONDS_PER_BRAND}s` }}>
          <ul ref={list} className="bm-list">
            {cards}
          </ul>
          {loop && (
            <ul className="bm-list" aria-hidden="true" inert>
              {cards}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
