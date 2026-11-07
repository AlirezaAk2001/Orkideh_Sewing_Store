"use client";

import { MotionConfig } from "framer-motion";

// «کاهش حرکت» سیستم برای همهٔ انیمیشن‌های framer-motion (هدر، ورود، پروفایل، تنظیمات، سبد، ...): جابه‌جایی و چرخش و بزرگ‌شدن غیرفعال می‌شود
// و فقط محو‌شدن (opacity) می‌ماند. انیمیشن‌های CSS سایت خودشان با @media (prefers-reduced-motion) و شبکهٔ ایمنی globals.css کنترل می‌شوند.
export default function MotionProvider({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
