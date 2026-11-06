import { useId } from "react";

// کارت یک بخش از فرم‌های افزودن/ویرایش پنل: کاشی آیکون، عنوان (h2)، یک خط راهنما و بدنهٔ فیلدها. فرم‌ها به چند بخش با موضوع روشن شکسته می‌شوند (اطلاعات اصلی،
// قیمت و موجودی، تصاویر، ...) به‌جای یک کارت بلند. index تأخیر ورود پلکانی را می‌دهد (.admin-row-in، با «کاهش حرکت» ثابت است).
// aria-labelledby هر بخش را به عنوانش وصل می‌کند تا صفحه‌خوان هر گروه فیلد را با نامش بخواند
export default function FormSection({ icon: Icon, title, hint, index = 0, className = "", bodyClassName = "", children }) {
  const id = useId();
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={`admin-row-in rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/80 ${className}`}
      style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}
    >
      <header className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        {Icon && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="text-base font-bold leading-6 text-gray-900">
            {title}
          </h2>
          {hint && <p className="text-xs leading-5 text-gray-500">{hint}</p>}
        </div>
      </header>
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
