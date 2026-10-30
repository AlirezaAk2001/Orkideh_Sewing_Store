// برچسب کوچک گرد برای وضعیت‌ها (موجودی، تخفیف، دسته‌بندی). رنگ همیشه همراه متن یا عدد است، پس معنی فقط با رنگ منتقل نمی‌شود
const TONES = {
  gray: "bg-gray-100 text-gray-700 ring-gray-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
};

export default function Chip({ tone = "gray", icon: Icon, children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none ring-1 ring-inset ${TONES[tone]} ${className}`}>
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </span>
  );
}
