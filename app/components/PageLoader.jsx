"use client";

import BrandMark from "./BrandMark";

// لودینگ یکپارچهٔ سایت: حلقهٔ برند که دور لوگوی فروشگاه می‌چرخد و زیرش متن ضربان‌دار. همهٔ صفحه‌ها و بخش‌هایی که در حال گرفتن اطلاعات‌اند از همین استفاده می‌کنند
// (بررسی دسترسی پنل، پروفایل، تنظیمات، ویرایش در پنل، نظرات، ورود با گوگل، ...). size: lg برای کل صفحه، md برای یک بخش کوچک‌تر (مثلاً نظرات محصول).
// className جای‌گذاری را تعیین می‌کند (مثلاً min-h-[60vh] برای وسط‌چین‌شدن). با «کاهش حرکت» سیستم حلقه نمی‌چرخد و متن ضربان ندارد
const SIZES = {
  lg: { box: "h-20 w-20", logo: "h-12 w-12", px: 48, gap: "gap-5" },
  md: { box: "h-14 w-14", logo: "h-9 w-9", px: 36, gap: "gap-3.5" },
};

export default function PageLoader({ label, size = "lg", className = "" }) {
  const s = SIZES[size] ?? SIZES.lg;
  return (
    <div role="status" className={`flex flex-col items-center justify-center ${s.gap} ${className}`}>
      <span className={`relative grid shrink-0 place-items-center ${s.box}`}>
        <span aria-hidden="true" className="absolute inset-0 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600 motion-reduce:animate-none" />
        <BrandMark className={s.logo} px={s.px} />
      </span>
      {label && <p className="animate-pulse text-center text-sm font-medium text-gray-500 motion-reduce:animate-none">{label}</p>}
    </div>
  );
}
