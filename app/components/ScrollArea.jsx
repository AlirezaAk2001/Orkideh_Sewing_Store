"use client";

import { useRef } from "react";
import ScrollThumb from "./ScrollThumb";

// اسکرولر عمودی با شست سفارشی (ScrollThumb): لفاف بیرونی relative است و شست روی لبهٔ راستش می‌نشیند، اسکرولر داخلی (as: div، main، nav...) فضای لفاف را پر می‌کند و خودش اسکرول می‌خورد.
// className چیدمان لفاف را می‌گیرد (flex-1، min-h-0، max-h-*، hidden...) و innerClassName ظاهر اسکرولر را (padding، overflow-x...)؛ بقیهٔ props (aria-label...) به خود اسکرولر می‌رسند.
// topSelector = انتخابگر عنصر چسبانِ بالای محتوا داخل اسکرولر (مثل "thead"): ریل شست از زیر آن شروع می‌شود تا روی سرستون نیفتد.
// lane (جدول‌های داخل کارت): وقتی شست دیده می‌شود، یک مسیر ۱۲ پیکسلی کنار راست برای خودش رزرو می‌کند (اسکرولر همان‌قدر باریک‌تر می‌شود) تا ردیف‌ها، پس‌زمینهٔ هاور و
// خط صورتی لبهٔ ردیف زیر شست نروند و شست راست‌تر از همهٔ آن‌ها بنشیند (مثل اسکرول‌بار کلاسیک). capClassName = ظاهر سرستون برای پوشش کنار آن (ریل از زیر سرستون شروع می‌شود،
// پس کنارِ سرستون خالی می‌ماند)؛ ارتفاعش --sb-top است که ScrollThumb می‌گذارد. بدون lane شست روی محتوا یا حاشیهٔ والد می‌نشیند.
// isolate: محتوای اسکرولر (مثل سرستون چسبان جدول با z-10) لایهٔ جدا می‌گیرد و هرگز روی شستِ اسکرول (z-5) نمی‌افتد
export default function ScrollArea({ as: Inner = "div", className = "", innerClassName = "", innerRef, topSelector, lane = false, capClassName = "", children, ...innerProps }) {
  const own = useRef(null);
  const ref = innerRef || own;
  return (
    <div className={`sb-area relative flex flex-col ${className}`} data-lane={lane ? "" : undefined}>
      <Inner ref={ref} className={`sb-hide isolate min-h-0 flex-1 overflow-y-auto ${innerClassName}`} {...innerProps}>
        {children}
      </Inner>
      {lane && capClassName && <div aria-hidden="true" className={`sb-cap ${capClassName}`} />}
      <ScrollThumb scrollerRef={ref} topSelector={topSelector} />
    </div>
  );
}
