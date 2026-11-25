"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";
import ProductCard from "@/app/components/ProductCard";
import FormSection from "./FormSection";

const num = (value) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

// کوچک‌ترین مقیاسی که کارت می‌گیرد (زیرش نوشته‌ها خواناییشان را از دست می‌دهند) و فاصلهٔ پایین: نوار چسبان ذخیره (۷۰px) + حدود ۳۰px نفس.
// با ۸۴ در عمل پایین کارت‌بخش تقریباً به نوار ذخیره می‌چسبید (نوار کمی بلندتر از تخمین است)، پس ۱۰۰ شد
const MIN_SCALE = 0.6;
const BOTTOM_GAP = 100;

// نزدیک‌ترین والد اسکرول‌خور (اسکرولر main پنل)
const scrollParent = (el) => {
  for (let p = el?.parentElement; p; p = p.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(p).overflowY)) return p;
  }
  return null;
};

// پیش‌نمایش زندهٔ کارت محصول در فرم‌های افزودن و ویرایش: همان ProductCard فروشگاه (نه کپی آن)، پس هر تغییر ظاهرِ کارت خودکار اینجا هم می‌آید.
// ورودی‌ها همان stateهای فرم‌اند؛ هر کلید روی کارت دیده می‌شود (نام، قیمت، تخفیف و سکهٔ براقش، «ناموجود» با موجودی صفر، تصویر اصلی و نقطه‌های گالری).
// کارت فقط نمایشی است: inert آن را از کلیک، تب و صفحه‌خوان می‌گیرد (نه لینکش فرم را ترک می‌کند و نه «افزودن به سبد» کاری می‌کند) و pointer-events-none
// جلوی بالا رفتن کارت هنگام هاور را می‌گیرد. «لوازم جانبی» مثل فروشگاه از کنترل موجودی معاف است، برای همین دسته‌بندی هم لازم است.
// در xl به بعد ستون کناری است و چسبان می‌ماند تا با اسکرول فرم بلند کارت جلوی چشم بماند؛ در پنجرهٔ خیلی کوتاه چسبان نیست چون دکمهٔ «افزودن به سبد» کارت زیر نوار چسبانِ
// ذخیره می‌رفت. زیر xl بخش آخرِ فرم است. چسبیدن از ۴٫۳۷۵rem (۷۰px) پایین‌تر از بالا شروع می‌شود: نوار چسبان بخش‌های فرم (FormNav، قد ۵۴px + فاصلهٔ ۱۶px)
// بالای همان اسکرولر می‌چسبد و روی سرِ کارت می‌افتاد.
// جا شدن در یک نگاه (xl به بعد): پیش از اسکرول، پایین کارت زیر نوار ذخیره می‌رفت. کارت کوچک می‌شود (transform: scale، با نسبت‌های دست‌نخورده، تا همان کارت فروشگاه بماند)
// فقط به‌اندازه‌ای که پایین کارت بالای نوار ذخیره بنشیند و بزرگ‌تر از اندازهٔ واقعی نمی‌شود. اندازه‌گیری از چیدمانِ بدون transform است (قد طبیعی کارت، قد سر و حاشیهٔ کارت‌بخش و
// جای بالای ردیف شبکه در اسکرولر)، پس با خود مقیاس تغییر نمی‌کند و نوسان ندارد؛ با تغییر اندازهٔ پنجره، اسکرولر یا محتوای کارت دوباره حساب می‌شود
export default function ProductCardPreview({ name, price, discount, finalPrice, stock, gallery, category, index = 1 }) {
  const final = parseFloat(finalPrice);
  const stockNumber = parseInt(stock, 10);
  const outer = useRef(null);
  const inner = useRef(null);
  const [fit, setFit] = useState({ scale: 1, height: 0 });

  useLayoutEffect(() => {
    const box = outer.current;
    const card = inner.current;
    const section = box?.closest("section");
    const grid = section?.parentElement;
    const scroller = scrollParent(box);
    if (!box || !card || !section || !grid || !scroller) return undefined;
    const wide = window.matchMedia("(min-width: 80rem)"); // xl: ستون کناری

    const measure = () => {
      const natural = card.offsetHeight;
      let scale = 1;
      if (wide.matches && natural > 0) {
        const chrome = section.offsetHeight - box.offsetHeight;
        const top = grid.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
        scale = Math.min(1, Math.max(MIN_SCALE, (scroller.clientHeight - top - BOTTOM_GAP - chrome) / natural));
      }
      scale = Math.round(scale * 1000) / 1000;
      const height = scale < 1 ? Math.round(natural * scale) : 0;
      setFit((prev) => (prev.scale === scale && prev.height === height ? prev : { scale, height }));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(scroller);
    ro.observe(card);
    ro.observe(grid);
    wide.addEventListener("change", measure);
    // ورود صفحه و کارت‌ها چند پیکسل translate می‌دهد (جای بالای ردیف را کمی جابه‌جا می‌بیند)؛ بعد از پایان انیمیشن‌ها دوباره می‌سنجیم
    scroller.addEventListener("animationend", measure, true);
    return () => {
      ro.disconnect();
      wide.removeEventListener("change", measure);
      scroller.removeEventListener("animationend", measure, true);
    };
  }, []);

  const product = {
    id: 0,
    name: String(name ?? "").trim() || "نام محصول",
    slug: "preview",
    price: num(price),
    discount: num(discount),
    finalPrice: Number.isFinite(final) ? final : undefined,
    stock: stock === "" || stock == null || !Number.isFinite(stockNumber) ? null : stockNumber,
    Category: category ? { name: category.name } : undefined,
    image: gallery[0] ?? null,
    images: gallery.slice(1),
  };

  return (
    <FormSection index={index} icon={Eye} title="پیش‌نمایش کارت" hint="مشتری این کارت را در فهرست فروشگاه می‌بیند" className="xl:top-[4.375rem] xl:self-start xl:[@media(min-height:38rem)]:sticky">
      {/* لفاف بیرونی قد کوچک‌شده را نگه می‌دارد (transform جا را عوض نمی‌کند)، کارت داخلی با قد طبیعی از بالای وسط کوچک می‌شود */}
      <div ref={outer} style={fit.scale < 1 ? { height: fit.height } : undefined}>
        <div
          ref={inner}
          inert
          className="pointer-events-none mx-auto w-full max-w-70 select-none"
          style={fit.scale < 1 ? { transform: `scale(${fit.scale})`, transformOrigin: "top center" } : undefined}
        >
          <ProductCard product={product} />
        </div>
      </div>
    </FormSection>
  );
}
