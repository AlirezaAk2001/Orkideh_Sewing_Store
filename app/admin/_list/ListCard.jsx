// کارت سفید گردی که جدول (و نوار ابزار بالایش) داخلش می‌نشیند. overflow:hidden فقط برای گردی گوشه‌هاست؛ راهنمای دکمه‌ها در portal باز می‌شود و بریده نمی‌شود
// fill (صفحه‌های جدول‌دار، داخل TablePage): کارت ستون فلکس می‌شود و می‌تواند کوتاه‌تر از محتوا شود (min-h-0)، پس وقتی ردیف‌ها بیشتر از جای صفحه‌اند نوار ابزار و صفحه‌بندی
// سر جایشان می‌مانند و فقط بدنهٔ جدول اسکرول می‌خورد؛ وقتی ردیف‌ها کم‌اند کارت به اندازهٔ خودشان می‌ماند (نه کشیده تا پایین)
export default function ListCard({ toolbar, fill = false, children }) {
  return (
    <section className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/80 ${fill ? "flex min-h-0 flex-col" : ""}`}>
      {toolbar && <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-3">{toolbar}</div>}
      {children}
    </section>
  );
}
