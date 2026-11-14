"use client";

import { Minus, Plus } from "lucide-react";
import { useChangeKey } from "@/lib/motion";
import { tip } from "@/lib/tip";

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
      {/* راهنمای سقف موجودی روی عنصر دربرگیرنده است چون دکمهٔ غیرفعال رویداد موس نمی‌گیرد (.qty-step button:disabled در globals.css pointer-events ندارد) */}
      <div className="inline-flex" {...tip(atMax ? "بیشتر از موجودی نمی‌شود" : undefined)}>
        <button type="button" onClick={() => onChange(value + 1)} disabled={busy || atMax} aria-label={atMax ? "افزایش تعداد؛ بیشتر از موجودی نمی‌شود" : "افزایش تعداد"}>
          <Plus aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
