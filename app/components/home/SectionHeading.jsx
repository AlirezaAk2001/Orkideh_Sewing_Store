import Link from "next/link";
import { BadgeCheck, ChevronLeft, Flame, Layers, MessageSquare, Sparkles, Tag } from "lucide-react";
import "./home.css";

// آیکون برچسبِ بالای عنوان با نام (ProductRail کلاینتی است و تابع نمی‌تواند به آن پاس شود)
const ICONS = { layers: Layers, tag: Tag, sparkles: Sparkles, flame: Flame, message: MessageSquare, badge: BadgeCheck };

// مسیر موج بخیه: ۶۰ قطعهٔ ۲۰ واحدی (۱۲۰۰ واحد)، بلندتر از هر عنوان؛ قاب بخیه از راست به اندازهٔ متن عنوان از آن برش می‌خورد (preserveAspectRatio="xMaxYMid slice")،
// پس موج با هر طول کشیده نمی‌شود و فقط کوتاه یا بلند دیده می‌شود
const STITCH_PATH = "M0 5 Q10 -1 20 5" + Array.from({ length: 59 }, (_, i) => ` T${40 + i * 20} 5`).join("");

// بخیهٔ زیر عنوان؛ جدا شده تا عنوان صفحهٔ فهرست محصولات (ProductListing.jsx) هم همین را بگیرد
export function StitchLine() {
  return (
    <span className="hs-stitch" aria-hidden="true">
      <svg viewBox="0 0 1200 10" preserveAspectRatio="xMaxYMid slice">
        <path d={STITCH_PATH} />
      </svg>
    </span>
  );
}

// عنوان یک بخش صفحهٔ اصلی: برچسب آیکون‌دار (اختیاری)، عنوان، زیرعنوان و بخیهٔ کشیده‌شونده (استایل و انیمیشن در home.css).
// id برای aria-labelledby بخش است؛ لینک «مشاهده همه» اختیاری است و children (مثل دکمه‌های قبلی/بعدی ردیف) کنار آن، سمت چپ عنوان می‌نشیند.
// بخیه با رسیدن بخش به صفحه کشیده می‌شود: Reveal.jsx روی لفافهٔ بخش is-in می‌گذارد و home.css آن را می‌خواند.
export default function SectionHeading({ id, title, subtitle, href, linkText = "مشاهده همه", eyebrow, icon, children }) {
  const Icon = ICONS[icon];
  return (
    <div className="hs">
      <div className="hs-text">
        {eyebrow && (
          <span className="hs-eyebrow">
            {Icon && <Icon size={15} aria-hidden="true" />}
            {eyebrow}
          </span>
        )}
        <h2 id={id} className="hs-title">
          {title}
        </h2>
        {subtitle && <p className="hs-sub">{subtitle}</p>}
        <StitchLine />
      </div>
      {children}
      {href && (
        <Link href={href} className="hs-more btn-lift">
          {linkText}
          <ChevronLeft size={18} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
