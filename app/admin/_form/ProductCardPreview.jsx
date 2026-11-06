"use client";

import { Eye } from "lucide-react";
import ProductCard from "@/app/components/ProductCard";
import FormSection from "./FormSection";

const num = (value) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

// پیش‌نمایش زندهٔ کارت محصول در فرم‌های افزودن و ویرایش: همان ProductCard فروشگاه (نه کپی آن)، پس هر تغییر ظاهرِ کارت خودکار اینجا هم می‌آید.
// ورودی‌ها همان stateهای فرم‌اند؛ هر کلید روی کارت دیده می‌شود (نام، قیمت، تخفیف و سکهٔ براقش، «ناموجود» با موجودی صفر، تصویر اصلی و نقطه‌های گالری).
// کارت فقط نمایشی است: inert آن را از کلیک، تب و صفحه‌خوان می‌گیرد (نه لینکش فرم را ترک می‌کند و نه «افزودن به سبد» کاری می‌کند) و pointer-events-none
// جلوی بالا رفتن کارت هنگام هاور را می‌گیرد. «لوازم جانبی» مثل فروشگاه از کنترل موجودی معاف است، برای همین دسته‌بندی هم لازم است.
// در xl به بعد ستون کناری است و (اگر پنجره دست‌کم ۶۴۰ پیکسل بلند باشد) چسبان می‌ماند تا با اسکرول فرم بلند کارت جلوی چشم بماند؛ در پنجرهٔ کوتاه چسبان نیست چون
// دکمهٔ «افزودن به سبد» کارت زیر نوار چسبانِ ذخیره می‌رفت. زیر xl بخش آخرِ فرم است
export default function ProductCardPreview({ name, price, discount, finalPrice, stock, gallery, category, index = 1 }) {
  const final = parseFloat(finalPrice);
  const stockNumber = parseInt(stock, 10);

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
    <FormSection index={index} icon={Eye} title="پیش‌نمایش کارت" hint="مشتری این کارت را در فهرست فروشگاه می‌بیند" className="xl:top-0 xl:self-start xl:[@media(min-height:40rem)]:sticky">
      <div inert className="pointer-events-none mx-auto w-full max-w-70 select-none">
        <ProductCard product={product} />
      </div>
    </FormSection>
  );
}
