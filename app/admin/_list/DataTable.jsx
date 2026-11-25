import { ArrowUp, ArrowUpDown } from "lucide-react";
import ScrollArea from "@/app/components/ScrollArea";
import "./list.css";

// جدول مشترک لیست‌ها. از md به بالا جدول روشن (سرستون کم‌رنگ، ردیف‌ها با خط نازک و هاور صورتی)، زیر md هر ردیف یک کارت که صفحه‌ها با renderCard
// می‌سازند (جدول با ۷ ستون روی موبایل جا نمی‌شود). هر دو از یک rows ساخته می‌شوند و CSS یکی را پنهان می‌کند، پس دادهٔ تکراری دریافت نمی‌شود.
// ستون‌ها: { id, label, cell(row), align ("start" پیش‌فرض یا "center")، th (کلاس سرستون)، td (کلاس خانه)، sk (کلاس نوار اسکلتون) }.
// align برای سرستون، خانه‌ها و اسکلتون یکی است: ستون «center» هم متن سرستون و هم محتوای هر ردیف را دقیقاً روی یک محور عمودی (مرکز ستون) می‌گذارد، هر عرضی که محتوا داشته باشد. loading = اولین بارگذاری (ردیف‌های اسکلتون)،
// از md به بالا بدنهٔ جدول خودش اسکرول‌پذیر است (ScrollArea با شست سفارشی سمت راست، ریلش از زیر سرستون شروع می‌شود) و سرستون‌ها چسبان‌اند؛ ارتفاع را TablePage و ListCard fill می‌دهند، پس سرستون و صفحه‌بندی ثابت می‌مانند و فقط ردیف‌ها اسکرول می‌خورند.
// busy = بارگذاری دوباره روی دادهٔ موجود (ردیف‌ها کمی کم‌رنگ می‌شوند). ورود نرم ردیف‌ها با کلاس admin-row-in (با «کاهش حرکت» خاموش) است
// ظاهر سرستون برای پوششی که کنار سرستون، روی مسیر شست می‌نشیند (ScrollArea lane + capClassName)؛ همان رنگ‌های th
const CAP = "bg-white bg-gradient-to-b from-gray-50 to-gray-100/70 shadow-[inset_0_-1px_0_var(--color-gray-200)]";

// ستون‌های مرتب‌شدنی (اختیاری): ستونی که sortable: true دارد و صفحه sort و onSort داده باشد سرستونش دکمه می‌شود. sort = { id, dir: "asc" | "desc" } یا null.
// خود مرتب‌کردن کار صفحه است (جدول فقط ردیف‌های مرتب‌شده را می‌گیرد)؛ aria-sort برای صفحه‌خوان روی همان th می‌نشیند
export default function DataTable({ label, columns, rows, rowKey, renderCard, loading = false, busy = false, skeletonRows = 3, sort = null, onSort }) {
  const stagger = (i) => ({ animationDelay: `${Math.min(i, 12) * 30}ms` });

  if (loading) {
    return (
      <div aria-busy="true" aria-label={label} className="md:flex md:min-h-0 md:flex-col">
        <ScrollArea className="max-md:hidden md:min-h-0" innerClassName="overflow-x-auto" topSelector="thead" lane capClassName={CAP}>
          <table className="w-full table-fixed text-sm">
            <thead className="bg-gradient-to-b from-gray-50 to-gray-100/70 shadow-[inset_0_-1px_0_var(--color-gray-200)]">
              <tr>
                {columns.map((c) => (
                  <th key={c.id} scope="col" className={`px-4 py-3 ${c.align === "center" ? "text-center" : "text-start"} text-xs font-semibold text-gray-500 ${c.th || ""}`}>
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
                      <span className={`block animate-pulse rounded-full bg-gray-200 ${c.align === "center" ? "mx-auto" : ""} ${c.sk || "h-4 w-20"}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
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
    <div aria-busy={busy} className={`relative transition-opacity duration-200 md:flex md:min-h-0 md:flex-col ${busy ? "opacity-60" : ""}`}>
      {busy && <span className="alst-busy" aria-hidden="true" />}
      <ScrollArea className="max-md:hidden md:min-h-0" innerClassName="overflow-x-auto" topSelector="thead" lane capClassName={CAP}>
        <table className="w-full text-sm">
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr>
              {/* پس‌زمینه روی خود th است و زیرش سفید: th چسبان است و ردیف‌هایی که زیرش اسکرول می‌شوند نباید از گرادیان نیمه‌شفاف دیده شوند */}
              {columns.map((c) => {
                const sortable = c.sortable && onSort;
                const dir = sort?.id === c.id ? sort.dir : undefined;
                return (
                  <th
                    key={c.id}
                    scope="col"
                    aria-sort={sortable ? (dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none") : undefined}
                    className={`sticky top-0 z-10 whitespace-nowrap bg-white bg-gradient-to-b from-gray-50 to-gray-100/70 px-4 py-3 shadow-[inset_0_-1px_0_var(--color-gray-200)] ${c.align === "center" ? "text-center" : "text-start"} text-xs font-semibold text-gray-500 ${c.th || ""}`}
                  >
                    {sortable ? (
                      <button type="button" onClick={() => onSort(c.id)} data-dir={dir} className="alst-sort btn-flat">
                        {c.label}
                        {dir ? <ArrowUp aria-hidden="true" /> : <ArrowUpDown aria-hidden="true" />}
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={rowKey(row)} style={stagger(i)} className="admin-row-in row-accent group border-t border-gray-100 hover:bg-brand-50/40">
                {columns.map((c) => (
                  <td key={c.id} className={`px-4 py-3 align-middle text-gray-700 ${c.align === "center" ? "text-center" : ""} ${c.td || ""}`}>
                    {c.align === "center" ? <div className="flex justify-center">{c.cell(row)}</div> : c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
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
