import { Ruler, Scissors, Spool } from "lucide-react";

// پس‌زمینهٔ پنل کاربری: مش گرادیان نرم با بافت دانه‌ای و نقطه‌های پارچه‌ای (.pf .bg در profile.css) + همان تزئینات پنل قبلی:
// سه ابزار خیاطی کم‌رنگ که آرام شناورند (قرقره، قیچی، متر) و دو خط بخیهٔ آرام در پایین. فقط تزئینی است (aria-hidden) و کلیک را رد می‌کند.
// قیچی و قرقره و متر فقط از lg به بالا دیده می‌شوند تا روی گوشی شلوغ نشود
const FLOATERS = [
  { icon: Spool, className: "right-[3%] top-[26%] h-16 w-16", style: { "--r": "-8deg", "--dur": "10s" } },
  { icon: Scissors, className: "left-[2%] top-[50%] h-14 w-14", style: { "--r": "12deg", "--dur": "12s", "--delay": "-4s" } },
  { icon: Ruler, className: "right-[5%] top-[76%] h-14 w-14", style: { "--r": "-18deg", "--dur": "11s", "--delay": "-7s" } },
];

export default function ProfileBackdrop() {
  return (
    <div aria-hidden="true" className="bg">
      {FLOATERS.map(({ icon: Icon, className, style }) => (
        <Icon key={className} className={`auth-float absolute hidden text-brand-300/50 lg:block ${className}`} style={style} strokeWidth={1.1} />
      ))}
      <svg className="absolute inset-x-0 bottom-0 h-48 w-full" viewBox="0 0 800 200" preserveAspectRatio="none" fill="none">
        <path className="auth-stitch" d="M-20 130 C 120 60, 240 190, 400 120 S 640 50, 830 120" stroke="var(--color-brand-300)" strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path className="auth-stitch" d="M-20 168 C 140 110, 270 200, 430 160 S 650 110, 830 160" stroke="var(--color-brand-200)" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
