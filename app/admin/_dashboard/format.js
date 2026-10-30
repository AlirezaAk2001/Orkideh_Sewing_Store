// قالب‌بندی اعداد و تاریخ داشبورد: رقم فارسی، تومان فشرده (هزار/میلیون/میلیارد) و تاریخ شمسی

// متن فارسی داخل SVG (که ltr است تا مختصات فیزیکی بمانند) با ایزوله‌کردن راست‌به‌چپ درست چیده می‌شود: «۸ آبان» نه «آبان ۸»
export const rtl = (s) => `⁧${s}⁩`;

export const fa = (n, options) => Number(n).toLocaleString("fa-IR", options);

// ۱۲٬۵۰۰٬۰۰۰ → { num: "۱۲٫۵", unit: "میلیون" }؛ زیر هزار بدون واحد
export function compactToman(n) {
  const v = Math.abs(Number(n) || 0);
  const sign = Number(n) < 0 ? -1 : 1;
  const one = (x) => fa(sign * x, { maximumFractionDigits: 1 });
  if (v >= 1e9) return { num: one(v / 1e9), unit: "میلیارد" };
  if (v >= 1e6) return { num: one(v / 1e6), unit: "میلیون" };
  if (v >= 1e3) return { num: one(v / 1e3), unit: "هزار" };
  return { num: fa(sign * v), unit: "" };
}

export const compactText = (n) => {
  const { num, unit } = compactToman(n);
  return unit ? `${num} ${unit}` : num;
};

// کلید روز تهران ("2026-10-30") به تاریخ شمسی. ظهر UTC می‌گیریم تا اختلاف ساعت روز را عوض نکند
const dayDate = (key) => new Date(`${key}T12:00:00Z`);
const shortFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { timeZone: "UTC", day: "numeric", month: "long" });
const longFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
export const dayShort = (key) => shortFmt.format(dayDate(key));

// «جمعه، ۸ آبان ۱۴۰۵»: خروجی آمادهٔ Intl برای تاریخ شمسی با سال، سال را اول می‌آورد («۱۴۰۵ آبان ۸، جمعه») که فارسی طبیعی نیست؛ پس از اجزایش می‌چینیم
const fullFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
export function dayFull(date) {
  const p = Object.fromEntries(fullFmt.formatToParts(date).map((x) => [x.type, x.value]));
  return `${p.weekday}، ${p.day} ${p.month} ${p.year}`;
}
export const dayLong = (key) => longFmt.format(dayDate(key));

// مقیاس «گرد» محور عمودی: سقف و گام تمیز (۱، ۲، ۲٫۵، ۵ × توان ده) که حدود count خط شبکه بدهد
export function niceScale(maxValue, count = 4) {
  if (!(maxValue > 0)) return { max: count, step: 1 };
  const rough = maxValue / count;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const f = rough / pow;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pow;
  return { max: Math.ceil(maxValue / step) * step, step };
}
