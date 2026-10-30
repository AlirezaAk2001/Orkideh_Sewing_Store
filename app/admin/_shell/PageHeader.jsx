// سربرگ مشترک صفحه‌های پنل: کاشی آیکون، عنوان درشت (h1)، یک خط توضیح یا شمار نتایج و دکمه‌های کار صفحه در سمت پایان (چپ). زیرش خط‌چین کم‌رنگ
// است (یادآور بخیه). subtitleKey با عوض‌شدن، زیرعنوان را دوباره با حرکت کوچک وارد می‌کند؛ loading جایش را با نوار اسکلتون پر می‌کند
export default function PageHeader({ icon, title, subtitle, subtitleColor, subtitleKey, loading = false, actions }) {
  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-dashed border-gray-300/80 pb-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-brand-100">{icon}</span>
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold leading-8 text-gray-900 sm:text-2xl">{title}</h1>
          <div className="min-h-6">
            {loading ? (
              <span className="mt-1 block h-4 w-28 animate-pulse rounded-full bg-gray-200" aria-hidden="true" />
            ) : (
              subtitle && (
                <p
                  key={subtitleKey}
                  className={`admin-swap text-sm leading-6 ${subtitleColor ? "[&_b]:text-inherit" : "text-gray-500 [&_b]:text-gray-900"} [&_b]:font-bold`}
                  style={subtitleColor ? { color: subtitleColor } : undefined}
                >
                  {subtitle}
                </p>
              )
            )}
          </div>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
