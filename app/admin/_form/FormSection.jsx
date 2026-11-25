import { useId } from "react";
import ScrollArea from "@/app/components/ScrollArea";

// کارت یک بخش از فرم‌های افزودن/ویرایش پنل: کاشی آیکون، عنوان (h2)، یک خط راهنما و بدنهٔ فیلدها. فرم‌ها به چند بخش با موضوع روشن شکسته می‌شوند (اطلاعات اصلی،
// قیمت و موجودی، تصاویر، ...) به‌جای یک کارت بلند. index تأخیر ورود پلکانی را می‌دهد (.admin-row-in، با «کاهش حرکت» ثابت است).
// aria-labelledby هر بخش را به عنوانش وصل می‌کند تا صفحه‌خوان هر گروه فیلد را با نامش بخواند.
// scroll (فقط برای صفحه‌ای که این کارت تنها محتوای فرم است و خودش قاب هم‌ارتفاعِ main دارد، مثل روش‌های ارسال): از md به بالا کارت می‌تواند کوتاه‌تر از محتوایش شود (min-h-0)
// و سرِ کارت (عنوان و خط زیرش) سر جایش می‌ماند و فقط بدنه با شست اسکرول سفارشی اسکرول می‌خورد، پس اسکرول از زیر آن خط شروع می‌شود؛ وقتی بدنه کوتاه است کارت به اندازهٔ خودش می‌ماند.
// زیر md قاب ارتفاع آزاد دارد و بدنه اسکرول داخلی ندارد.
// actions (اختیاری): دکمهٔ کار بخش در انتهای سر کارت (مثل «افزودن روش ارسال»)؛ چون سر کارت با اسکرول بدنه تکان نمی‌خورد، دکمه همیشه در دسترس است
export default function FormSection({ id: sectionId, icon: Icon, title, hint, actions, index = 0, className = "", bodyClassName = "", scroll = false, children }) {
  const id = useId();
  return (
    <section
      id={sectionId}
      aria-labelledby={`${id}-title`}
      className={`admin-row-in scroll-mt-20 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/80 ${scroll ? "md:flex md:min-h-0 md:flex-col" : ""} ${className}`}
      style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-5 py-4">
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
        {actions && <div className="ms-auto shrink-0 ps-2">{actions}</div>}
      </header>
      {scroll ? (
        <ScrollArea className="min-h-0 flex-1" innerClassName={`overflow-x-hidden p-5 ${bodyClassName}`}>
          {children}
        </ScrollArea>
      ) : (
        <div className={`p-5 ${bodyClassName}`}>{children}</div>
      )}
    </section>
  );
}
