import { Ruler, Scissors, Spool } from "lucide-react";

// پس‌زمینهٔ صفحهٔ محصول (استایل در product.css، .pd-bg): مش نرم برند + دانه + نقطه‌چین + نخ بخیهٔ کشیده‌شونده، و همان سه ابزار خیاطی معلق پس‌زمینهٔ پنل کاربری
// (ProfileBackdrop.jsx: قرقره، قیچی، متر؛ کلاس auth-float در globals.css). چون صفحهٔ محصول خیلی بلندتر از پنل است، ابزارها در طول صفحه تکرار شده‌اند.
// فقط تزئینی است (aria-hidden) و کلیک را رد می‌کند؛ ابزارها از lg به بالا دیده می‌شوند تا روی گوشی شلوغ نشود.
const FLOATERS = [
  { icon: Spool, className: "right-[3%] top-[300px] h-16 w-16", style: { "--r": "-8deg", "--dur": "10s" } },
  { icon: Scissors, className: "left-[2%] top-[760px] h-14 w-14", style: { "--r": "12deg", "--dur": "12s", "--delay": "-4s" } },
  { icon: Ruler, className: "right-[5%] top-[1180px] h-14 w-14", style: { "--r": "-18deg", "--dur": "11s", "--delay": "-7s" } },
  { icon: Spool, className: "left-[3%] top-[1640px] h-16 w-16", style: { "--r": "8deg", "--dur": "12s", "--delay": "-2s" } },
  { icon: Scissors, className: "right-[2%] top-[2080px] h-14 w-14", style: { "--r": "-12deg", "--dur": "10s", "--delay": "-6s" } },
  { icon: Ruler, className: "left-[4%] top-[2520px] h-14 w-14", style: { "--r": "16deg", "--dur": "11s", "--delay": "-3s" } },
];

export default function ProductBackdrop() {
  return (
    <div aria-hidden="true" className="pd-bg">
      <div className="pd-mesh" />
      <div className="pd-grain" />
      <div className="pd-dots" />
      <svg className="pd-thread" viewBox="0 0 1600 640" preserveAspectRatio="none">
        <path d="M-20 470 C 300 330, 520 590, 860 420 S 1400 250, 1640 370" />
      </svg>
      {FLOATERS.map(({ icon: Icon, className, style }) => (
        <Icon key={className} className={`auth-float absolute hidden text-brand-300/50 lg:block ${className}`} style={style} strokeWidth={1.1} />
      ))}
    </div>
  );
}
