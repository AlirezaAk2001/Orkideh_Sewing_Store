import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// عنوان یک بخش صفحهٔ اصلی؛ id برای aria-labelledby بخش است، لینک «مشاهده همه» اختیاری
export default function SectionHeading({ id, title, subtitle, href, linkText = "مشاهده همه" }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 id={id} className="text-xl font-bold text-gray-900 sm:text-2xl">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
        >
          {linkText}
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
