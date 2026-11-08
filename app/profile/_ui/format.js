// قالب‌بندی و محاسبهٔ داده‌های پنل کاربری (ارقام فارسی، تاریخ شمسی، ماه‌های اخیر)
export { fa, dayFull } from "@/app/admin/_dashboard/format";
import { fa } from "@/app/admin/_dashboard/format";

export const toman = (n) => `${fa(n)} تومان`;

// رقم‌های فارسی و عربی را لاتین می‌کند تا شماره تلفن و کد پستی با هر کیبوردی درست سنجیده شود
export const toEn = (value) =>
  String(value ?? "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

export const dateFa = (value) => new Date(value).toLocaleDateString("fa-IR");

const MONTH_NAMES = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const ymFmt = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", { year: "numeric", month: "numeric", timeZone: "Asia/Tehran" });

// ماه شمسی یک تاریخ به‌صورت شمارندهٔ پیوسته (سال×۱۲ + ماه) تا جمع و تفریق ماه‌ها ساده باشد
const monthIndex = (date) => {
  const p = Object.fromEntries(ymFmt.formatToParts(date).map((x) => [x.type, x.value]));
  return Number(p.year) * 12 + (Number(p.month) - 1);
};

// فروش شش ماه اخیر (ماه جاری آخر): { months: [{ name, total }], total, previous } که previous جمع شش ماهِ پیش از آن است.
// فقط سفارش‌های جاری و تحویل‌شده خرید حساب می‌شوند؛ ناتمام و مرجوعی پولی نیست
export function spendingByMonth(orders, now = new Date()) {
  const current = monthIndex(now);
  const months = Array.from({ length: 6 }, (_, k) => {
    const idx = current - (5 - k);
    return { idx, name: MONTH_NAMES[((idx % 12) + 12) % 12], total: 0 };
  });
  let previous = 0;
  for (const o of orders) {
    if (o.status !== "delivered" && o.status !== "processing") continue;
    const idx = monthIndex(new Date(o.createdAt));
    const slot = months.find((m) => m.idx === idx);
    if (slot) slot.total += o.totalPrice;
    else if (idx < months[0].idx && idx >= months[0].idx - 6) previous += o.totalPrice;
  }
  return { months, total: months.reduce((s, m) => s + m.total, 0), previous };
}

// نیم‌فاصله (U+200C): با کد نوشته می‌شود تا در کد دیده شود
const ZWNJ = String.fromCharCode(0x200c);

// سلام بر اساس ساعت روز
export function greeting(now = new Date()) {
  const h = now.getHours();
  // «سلام» + دعای وقت روز: بعد از حرف‌های چسبان (صبح، شب) نیم‌فاصله، بعد از «ظهر» و «عصر» که به حرف بعد نمی‌چسبند فاصلهٔ معمولی
  const [part, gap] = h < 5 ? ["شب", ZWNJ] : h < 12 ? ["صبح", ZWNJ] : h < 17 ? ["ظهر", " "] : h < 20 ? ["عصر", " "] : ["شب", ZWNJ];
  return `سلام ${part}${gap}بخیر`;
}

// تصویر جایگزین محصولی که عکس ندارد (صورتی ملایم با جعبه)
export const NO_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#f6edf6"/><g fill="none" stroke="#b9a3c2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M40 20l16 9v18l-16 9-16-9V29z"/><path d="M24 29l16 9 16-9M40 38v18"/></g></svg>`,
  );
