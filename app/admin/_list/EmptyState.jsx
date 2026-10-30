// حالت خالی لیست: کاشی آیکون با حلقهٔ خط‌چین (یادآور بخیه)، عنوان، توضیح کوتاه و یک دکمهٔ کار (افزودن یا پاک‌کردن جست‌وجو)
export default function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="relative grid h-20 w-20 place-items-center rounded-full border-2 border-dashed border-brand-200 bg-brand-50/60">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-brand-600 shadow-sm ring-1 ring-brand-100">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      </span>
      <h2 className="mt-5 text-base font-extrabold text-gray-900">{title}</h2>
      {hint && <p className="mt-1.5 max-w-sm text-sm leading-7 text-gray-500">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
