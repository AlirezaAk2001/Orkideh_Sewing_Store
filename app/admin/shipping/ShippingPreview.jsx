"use client";

import { useId, useRef, useState } from "react";
import { Eye, PackageX } from "lucide-react";
import useFlip from "@/app/admin/_ui/useFlip";
import { useChangeKey } from "@/lib/motion";

const fa = (n) => Number(n).toLocaleString("fa-IR");

// یک گزینهٔ روش ارسال مثل سبد خرید (profile.css: .ship .opt). مبلغ هنگام عوض شدن یک جهش کوچک می‌کند
function Option({ method, index, selected, name, onPick }) {
  const popKey = useChangeKey(method.cost);
  return (
    <label data-flip={method.id} className={`shp-opt ${selected ? "on" : ""}`} style={{ "--i": index }}>
      <input type="radio" name={name} value={method.id} checked={selected} onChange={() => onPick(method.id)} />
      <span className="shp-rd" aria-hidden="true" />
      <span className="shp-tx">
        {method.label ? <b>{method.label}</b> : <b className="none">روش بدون نام</b>}
        {method.description && <small>{method.description}</small>}
      </span>
      <span className="shp-pr">
        {method.cost > 0 ? (
          <>
            <span key={popKey} className={popKey ? "shp-pop" : undefined}>
              {fa(method.cost)}
            </span>
            <small>تومان</small>
          </>
        ) : (
          <em className="free">رایگان</em>
        )}
      </span>
    </label>
  );
}

// پیش‌نمایش زندهٔ بخش «شیوهٔ ارسال» سبد خرید: همان چیزی که مشتری می‌بیند، از روی ردیف‌های همین صفحه (حتی ذخیره‌نشده). فقط روش‌های فعال و به همان ترتیب فهرست می‌آیند
// و اولین روش از ابتدا انتخاب است (مثل useShipping). انتخاب مدیر روی گزینه‌ها فقط برای امتحان است و جایی ذخیره نمی‌شود؛ اگر روش انتخاب‌شده غیرفعال یا حذف شود، اولین روش انتخاب می‌شود
export default function ShippingPreview({ rows, className = "" }) {
  const name = useId();
  const [pick, setPick] = useState(null);
  const fieldRef = useRef(null);
  useFlip(fieldRef);

  const list = rows
    .filter((r) => r.active)
    .map((r) => ({ id: r.id, label: r.label.trim(), description: r.description.trim(), cost: Number(r.cost || 0) }));
  const selected = list.some((m) => m.id === pick) ? pick : (list[0]?.id ?? null);

  return (
    <aside aria-label="پیش‌نمایش بخش ارسال سبد خرید" className={`shp-pv ${className}`}>
      <div className="shp-pv-head">
        <span className="shp-pv-ic" aria-hidden="true">
          <Eye className="h-4 w-4" />
        </span>
        <div>
          <b>پیش‌نمایش سبد خرید</b>
          <small>آنچه مشتری هنگام پرداخت می‌بیند</small>
        </div>
      </div>

      {list.length > 0 ? (
        <fieldset ref={fieldRef} className="shp-pv-ship">
          <legend>شیوهٔ ارسال</legend>
          {list.map((m, i) => (
            <Option key={m.id} method={m} index={i} selected={selected === m.id} name={name} onPick={setPick} />
          ))}
        </fieldset>
      ) : (
        <div className="shp-pv-empty">
          <PackageX aria-hidden="true" />
          <span>روش فعالی نیست؛ مشتری در سبد خرید بخش ارسال را نمی‌بیند و سفارش بدون هزینهٔ ارسال ثبت می‌شود.</span>
        </div>
      )}

      {list.length > 1 && <p className="shp-pv-note">اولین روش فعال از ابتدا انتخاب است و ترتیب نمایش همان ترتیب فهرست روش‌هاست.</p>}
    </aside>
  );
}
