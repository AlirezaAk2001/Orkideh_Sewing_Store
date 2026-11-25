// برچسب کوچک گرد برای وضعیت‌ها (موجودی، تخفیف، دسته‌بندی). رنگ همیشه همراه متن یا عدد است، پس معنی فقط با رنگ منتقل نمی‌شود
// size: "sm" (پیش‌فرض، ۱۲px) یا "lg" (۱۴px پررنگ‌تر، هم‌قد چیپ قیمت جدول محصولات: خط ۲۴px و بالشتک ۲px). اندازه، وزن و ارتفاع خط با هم در یک نقشه‌اند تا کلاسِ اضافه با پایه نجنگد
const TONES = {
  gray: "bg-gray-100 text-gray-700 ring-gray-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
};
const SIZES = {
  sm: { box: "gap-1 px-2.5 py-1 text-xs font-semibold leading-none", icon: "h-3.5 w-3.5" },
  lg: { box: "gap-1.5 px-3 py-0.5 text-sm font-bold leading-6", icon: "h-4 w-4" },
};

export default function Chip({ tone = "gray", size = "sm", icon: Icon, children, className = "" }) {
  const s = SIZES[size] ?? SIZES.sm;
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full ring-1 ring-inset ${s.box} ${TONES[tone]} ${className}`}>
      {Icon && <Icon className={s.icon} aria-hidden="true" />}
      {children}
    </span>
  );
}
