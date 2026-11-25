import { Ruler, Scissors, Spool } from "lucide-react";

// ابزارهای خیاطی تزئینی پس‌زمینهٔ پنل مدیریت (همان قرقره، قیچی و متر و همان شناوری auth-float پروفایل و صفحهٔ محصولات) ولی خیلی کم‌رنگ:
// صفحه‌های ادمین تمام‌عرض‌اند و حاشیه ندارند، پس ابزارها پشت کارت‌ها و جدول‌ها می‌مانند و فقط در جای خالی دیده می‌شوند (مثل زیر جدولِ کوتاه بنرها).
// لایه به canvas پنل می‌چسبد (نه به محتوا)، پس با اسکرول جابه‌جا نمی‌شود؛ جایشان در نیمهٔ پایین است که صفحه‌های کوتاه خالی می‌مانند.
// --r زاویه، --dur مدت و --delay تأخیر شناوری (کلاس auth-float در globals.css؛ با «کاهش حرکت» خودش خاموش است). دیده‌نشدنی برای صفحه‌خوان و بی‌کلیک
const TOOLS = [
  { icon: Scissors, className: "left-[5%] top-[72%]", style: { "--r": "12deg", "--dur": "12s", "--delay": "-4s" } },
  { icon: Spool, className: "left-[36%] top-[80%]", style: { "--r": "-8deg", "--dur": "10s" } },
  { icon: Ruler, className: "left-[64%] top-[70%]", style: { "--r": "-18deg", "--dur": "11s", "--delay": "-7s" } },
];

export default function AdminBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden sm:block">
      {TOOLS.map(({ icon: Icon, className, style }) => (
        <Icon key={className} className={`auth-float absolute h-16 w-16 text-brand-500/[0.18] ${className}`} style={style} strokeWidth={1.1} />
      ))}
    </div>
  );
}
