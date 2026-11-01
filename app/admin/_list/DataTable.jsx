// جدول مشترک لیست‌ها. از md به بالا جدول روشن (سرستون کم‌رنگ، ردیف‌ها با خط نازک و هاور صورتی)، زیر md هر ردیف یک کارت که صفحه‌ها با renderCard
// می‌سازند (جدول با ۷ ستون روی موبایل جا نمی‌شود). هر دو از یک rows ساخته می‌شوند و CSS یکی را پنهان می‌کند، پس دادهٔ تکراری دریافت نمی‌شود.
// ستون‌ها: { id, label, cell(row), th (کلاس سرستون)، td (کلاس خانه)، sk (کلاس نوار اسکلتون) }. loading = اولین بارگذاری (ردیف‌های اسکلتون)،
// busy = بارگذاری دوباره روی دادهٔ موجود (ردیف‌ها کمی کم‌رنگ می‌شوند). ورود نرم ردیف‌ها با کلاس admin-row-in (با «کاهش حرکت» خاموش) است
export default function DataTable({ label, columns, rows, rowKey, renderCard, loading = false, busy = false, skeletonRows = 3 }) {
  const stagger = (i) => ({ animationDelay: `${Math.min(i, 12) * 30}ms` });

  if (loading) {
    return (
      <div aria-busy="true" aria-label={label}>
        <div className="hidden md:block">
          <table className="w-full table-fixed text-sm">
            <thead className="bg-gradient-to-b from-gray-50 to-gray-100/70 shadow-[inset_0_-1px_0_var(--color-gray-200)]">
              <tr>
                {columns.map((c) => (
                  <th key={c.id} scope="col" className={`px-4 py-3 text-start text-xs font-semibold text-gray-500 ${c.th || ""}`}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="border-t border-gray-100">
                  {columns.map((c) => (
                    <td key={c.id} className={`px-4 py-3.5 align-middle ${c.td || ""}`}>
                      <span className={`block animate-pulse rounded-full bg-gray-200 ${c.sk || "h-4 w-20"}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="divide-y divide-gray-100 md:hidden">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 p-4">
              <span className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-gray-200" />
              <span className="flex-1 space-y-2">
                <span className="block h-4 w-2/3 animate-pulse rounded-full bg-gray-200" />
                <span className="block h-3 w-1/3 animate-pulse rounded-full bg-gray-200" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div aria-busy={busy} className={`transition-opacity duration-200 ${busy ? "opacity-60" : ""}`}>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{label}</caption>
          <thead className="bg-gradient-to-b from-gray-50 to-gray-100/70 shadow-[inset_0_-1px_0_var(--color-gray-200)]">
            <tr>
              {columns.map((c) => (
                <th key={c.id} scope="col" className={`whitespace-nowrap px-4 py-3 text-start text-xs font-semibold text-gray-500 ${c.th || ""}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={rowKey(row)} style={stagger(i)} className="admin-row-in row-accent group border-t border-gray-100 hover:bg-brand-50/40">
                {columns.map((c) => (
                  <td key={c.id} className={`px-4 py-3 align-middle text-gray-700 ${c.td || ""}`}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-gray-100 md:hidden" aria-label={label}>
        {rows.map((row, i) => (
          <li key={rowKey(row)} style={stagger(i)} className="admin-row-in group p-4">
            {renderCard(row)}
          </li>
        ))}
      </ul>
    </div>
  );
}
