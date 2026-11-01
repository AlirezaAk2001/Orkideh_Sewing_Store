import { Hourglass, PackageCheck, Truck, Undo2 } from "lucide-react";

// وضعیت‌های سفارش با همان رنگ، آیکون و برچسب حلقهٔ «وضعیت سفارش‌ها» در داشبورد (رنگ‌ها: --viz-st-* در globals.css). color برای نقطه و نوار رنگی است و ink
// رنگ تیره‌شدهٔ همان برای نوشته روی زمینهٔ روشن (کنتراست خوانا). tab نام تب همان وضعیت در صفحهٔ سفارش‌ها
const ink = (color) => `color-mix(in srgb, ${color} 62%, black)`;

export const ORDER_STATUS = {
  processing: { id: "processing", label: "جاری", tab: "جاری", noun: "سفارش جاری", color: "var(--viz-st-processing)", ink: ink("var(--viz-st-processing)"), icon: Truck },
  delivered: { id: "delivered", label: "تحویل شده", tab: "تحویل داده شده", noun: "سفارش تحویل داده شده", color: "var(--viz-st-delivered)", ink: ink("var(--viz-st-delivered)"), icon: PackageCheck },
  returned: { id: "returned", label: "مرجوع شده", tab: "مرجوع شده", noun: "سفارش مرجوع شده", color: "var(--viz-st-returned)", ink: ink("var(--viz-st-returned)"), icon: Undo2 },
  pending: { id: "pending", label: "منتظر پرداخت", tab: "ناتمام", noun: "سفارش ناتمام", color: "var(--viz-st-pending)", ink: ink("var(--viz-st-pending)"), icon: Hourglass },
};

// ترتیب تب‌ها در صفحه
export const ORDER_STATUS_ORDER = ["processing", "delivered", "returned", "pending"];

// کاشی و چیپ هر وضعیت: زمینهٔ بسیار روشن و حاشیهٔ نازک از همان رنگ
export const statusTint = (s) => ({
  background: `color-mix(in srgb, ${s.color} 12%, white)`,
  color: s.ink,
  boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${s.color} 28%, white)`,
});
