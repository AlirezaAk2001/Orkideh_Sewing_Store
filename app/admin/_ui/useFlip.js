"use client";

import { useLayoutEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

// جابه‌جایی نرم فرزندان یک فهرست (FLIP): هر وقت جای یک فرزند عوض شد (ترتیب عوض شد، ردیفی بالایش بلندتر یا کوتاه‌تر شد) از جای قبلی تا جای تازه می‌لغزد، نه اینکه بپرد.
// ref = ظرف فهرست (باید position: relative داشته باشد تا offsetTop نسبت به آن باشد)؛ هر فرزند مستقیمی که data-flip="کلید یکتا" دارد دنبال می‌شود.
// جای هر فرزند با offsetTop سنجیده می‌شود (نه getBoundingClientRect)، پس اسکرول و translate در حال اجرا آن را به هم نمی‌ریزند. اولین رندر و «کاهش حرکت» بدون حرکت‌اند.
// برای هر رندر اجرا می‌شود ولی کار هر بار فقط خواندن جای چند فرزند است (فهرست‌های کوتاهی مثل روش‌های ارسال)
export default function useFlip(ref) {
  const tops = useRef(new Map());

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduce = prefersReducedMotion();
    const next = new Map();
    for (const el of root.querySelectorAll(":scope > [data-flip]")) {
      const key = el.dataset.flip;
      const top = el.offsetTop;
      next.set(key, top);
      const prev = tops.current.get(key);
      if (!reduce && prev !== undefined && prev !== top && typeof el.animate === "function") {
        el.animate([{ translate: `0 ${prev - top}px` }, { translate: "0 0" }], { duration: 380, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" });
      }
    }
    tops.current = next;
  });
}
