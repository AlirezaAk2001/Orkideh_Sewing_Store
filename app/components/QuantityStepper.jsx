"use client";

import { Minus, Plus } from "lucide-react";
import { useChangeKey } from "@/lib/motion";

// گام‌شمار تعداد صفحهٔ محصول؛ همان باکس تعداد سبد خرید پروفایل (app/profile/_ui/CartView.jsx) در ظاهر و منطق: عدد فارسی که هنگام تغییر «تیک» می‌زند،
// «+» در سقف موجودی و «−» روی ۱ غیرفعال (با راهنمای «بیشتر از موجودی نمی‌شود») و هر دو در حال ذخیره (busy) قفل.
// جای دکمه‌ها به خواستهٔ مالک عمداً برعکس سبد است: در صفحهٔ راست‌به‌چپ عنصر اولِ DOM سمت راست می‌نشیند، پس «−» اول است تا «+» سمت چپ و «−» سمت راست بیفتد
// (مثل باکس قدیمی صفحهٔ محصول). ظاهرش .qty-step در globals.css است. onChange(تعدادِ تازه) را والد انجام می‌دهد
export default function QuantityStepper({ value, max = Infinity, busy = false, onChange }) {
  const changed = useChangeKey(value);
  const atMax = value >= max;

  return (
    <div className="qty-step" role="group" aria-label="تعداد">
      <button type="button" onClick={() => onChange(value - 1)} disabled={busy || value <= 1} aria-label="کاهش تعداد">
        <Minus aria-hidden="true" />
      </button>
      <span aria-live="polite">
        <span key={changed} className={changed ? "num-tick" : undefined}>
          {value.toLocaleString("fa-IR")}
        </span>
      </span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={busy || atMax} aria-label="افزایش تعداد" title={atMax ? "بیشتر از موجودی نمی‌شود" : undefined}>
        <Plus aria-hidden="true" />
      </button>
    </div>
  );
}
