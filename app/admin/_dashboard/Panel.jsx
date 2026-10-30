import { demoAllowed } from "@/lib/demoFlag";

// کارت سفید هر نمودار (سطح خود نمودار همیشه سفید است تا رنگ‌ها و کنتراست همان باشد که اعتبارسنجی شده)؛ busy = داده در حال تازه‌شدن است:
// نمودار قبلی با کم‌رنگی می‌ماند و جابه‌جا نمی‌شود (بدون اسکلتون)
export default function Panel({ title, titleId, subtitle, icon: Icon, actions, busy = false, index = 0, className = "", children }) {
  return (
    <section
      className={`dash-rise rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-5 ${className}`}
      style={{ "--i": index }}
      aria-busy={busy || undefined}
      aria-labelledby={titleId}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {actions}
      </header>
      <div className={`transition-opacity duration-200 ${busy ? "opacity-60" : ""}`}>{children}</div>
    </section>
  );
}

// حالت خالی: آیکون، پیام اصلی و (فقط در توسعه) راهنمای روشن‌کردن داده نمونه
export function Empty({ icon: Icon, className = "h-48", children }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-center ${className}`}>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gray-50 text-gray-400 ring-1 ring-gray-100">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="text-sm text-gray-500">{children}</p>
      {demoAllowed() && <p className="text-xs text-gray-400">برای دیدن شکل نمودارها، «داده نمونه» بالای صفحه را روشن کنید.</p>}
    </div>
  );
}
