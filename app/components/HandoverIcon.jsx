// «تحویل»: جعبه‌ای (قاب خطی با برچسب توپُر بالا) که دستی توپُر با انگشت اشاره آن را تحویل می‌دهد؛ lucide چنین آیکونی ندارد. شکلش را مالک از میان چند طرح انتخاب کرد.
// خط‌ها نازک و دو تکهٔ توپُر (برچسب و دست) همان هویت آیکون‌اند. در طرح اصلی دست به راست تحویل می‌دهد؛ در صفحه‌های راست‌به‌چپ آن را آینه کنید (scale: -1 1).
// استفاده: مراحل سفارش پروفایل (اندازه و ضخامت خط در profile.css: svg.handover) و خط زمان سفارش پنل ادمین (orders.css). ویژگی‌های خط روی خود svg فقط پیش‌فرض‌اند و CSS آن‌ها را عوض می‌کند
export default function HandoverIcon({ className = "", ...props }) {
  return (
    <svg
      className={`handover ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M17.6 21H19.9a2 2 0 0 0 2-2V4.3a2 2 0 0 0-2-2H3.9L11.25 12.5 7.9 16.3 3 13v6a2 2 0 0 0 2 2H8.2" />
      <path d="M10.1 2.3h4.9v4.5a.8.8 0 0 1-.8.8h-3.3a.8.8 0 0 1-.8-.8z" fill="currentColor" stroke="none" />
      <path d="M9.4 17.7 13.2 14.5Q14.2 13.8 15.5 14.3L19.2 16Q20.6 16.8 19.7 17.8Q19.3 18.2 18.7 17.9L16.5 17.6 16.2 21.6Q16.1 22.6 15.1 22.6H11.4Q10.3 22.6 10.1 21.6Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
