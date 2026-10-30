// کارت سفید گردی که جدول (و نوار ابزار بالایش) داخلش می‌نشیند. overflow:hidden فقط برای گردی گوشه‌هاست؛ راهنمای دکمه‌ها در portal باز می‌شود و بریده نمی‌شود
export default function ListCard({ toolbar, children }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/80">
      {toolbar && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-3">{toolbar}</div>}
      {children}
    </section>
  );
}
