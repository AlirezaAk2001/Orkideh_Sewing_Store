const fa = (n) => Number(n).toLocaleString("fa-IR");

// شناسهٔ ردیف در یک چیپ گرد: دایرهٔ ثابت ۳۲px برای همهٔ ردیف‌ها (تا چهار رقم جا می‌شود)، خاکستری با حلقهٔ نازک؛ ستون‌های «شناسه»ی جدول‌های پنل
export default function IdChip({ id }) {
  return <span className="inline-grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-xs font-bold tabular-nums text-gray-600 ring-1 ring-gray-200">{fa(id)}</span>;
}
