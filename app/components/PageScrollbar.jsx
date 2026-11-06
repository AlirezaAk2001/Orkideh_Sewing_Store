"use client";

import ScrollThumb from "./ScrollThumb";

// شست اسکرول خود صفحه (فروشگاه): ریل fixed کنار راست پنجره، بالاتر از هدر چسبان؛ اسکرول‌بار بومی صفحه زیر ماوس پنهان است (globals.css). یک‌بار در layout.js.
// ریل از زیر هدر سایت شروع می‌شود (هدر با data-sb-top="page" علامت خورده)، در صفحه‌هایی که هدر ندارند (ورود، ادمین) از بالای پنجره
export default function PageScrollbar() {
  return <ScrollThumb page topSelector='[data-sb-top="page"]' />;
}
