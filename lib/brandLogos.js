import { normalizeText } from "@/lib/brands";

// لوگوی برندها برای کارت‌های «برندهای موجود در فروشگاه» صفحهٔ اصلی. فایل‌ها در public/image/brands هستند و کلید هر کدام همان نام فارسی برند در lib/brands.js.
// برند بدون ورودی اینجا لوگو ندارد و BrandStrip نشان گرادیانی حرف اول نامش را نشان می‌دهد؛ برای افزودن لوگوی یک برند، فایلش را در همان پوشه بگذارید
// و یک خط اینجا اضافه کنید (width و height اندازهٔ ذاتی فایل است و فقط نسبت را به مرورگر می‌دهد).
// منشأ فایل‌ها:
// - لوگوی رسمی: ژانومه (ویکی‌مدیا کامنز، Janome company logo.svg، دامنهٔ عمومی)؛ ارگان (نشان گرد از organ-needles.com)؛ برنینا (واژهٔ BERNINA از bernina.com)؛
//   برادر (واژهٔ brother از global.brother؛ فایل اصلی سفید است و تک‌رنگ خاکستری تیره شده).
// - بریده‌شده از عکس محصول‌های خود سایت (به دستور مالک)، یعنی نام همان‌طور که روی محصول چاپ شده، نه فایل رسمی برند: یوشیتا (youshita2.jpeg)، رفری (refrey1.jpeg)،
//   نیولایف (newlife2.jpeg)، جگوار (jaguar2.jpeg؛ سفیدِ روی پلاک تیره به خاکستری تیره درآمده)، صدر (sewing-oil3.png؛ نشان چرخ و «SADR صدر» روی برچسب گالن) و رز (DinamandPedal.png).
//   زمینهٔ هر برش شفاف شده است. با رسیدن فایل رسمی هر برند، فایلش را جایگزین کنید.
// - بریده‌شده از دو عکس محصولی که مالک نشانی‌شان را داد: اطلس («ATLAS OIL» روی جعبهٔ روغن؛ عکس static.technosun.ir، وجه کج جعبه صاف و نقش زمینه حذف شده) و پفاف
//   (واژهٔ PFAFF روی جعبهٔ لامپ؛ عکس kharraziyas.ir، با بزرگ‌نمایی ۸ برابر).
// لوگوها علامت تجاری صاحبانشان‌اند.
const LOGOS = {
  ژانومه: { src: "/image/brands/janome.svg", width: 663, height: 122 },
  برادر: { src: "/image/brands/brother.png", width: 170, height: 41 },
  برنینا: { src: "/image/brands/bernina.png", width: 146, height: 23 },
  ارگان: { src: "/image/brands/organ.png", width: 207, height: 206 },
  یوشیتا: { src: "/image/brands/youshita.png", width: 421, height: 109 },
  رفری: { src: "/image/brands/refrey.png", width: 302, height: 100 },
  نیولایف: { src: "/image/brands/newlife.png", width: 249, height: 86 },
  جگوار: { src: "/image/brands/jaguar.png", width: 223, height: 61 },
  صدر: { src: "/image/brands/sadr.png", width: 94, height: 90 },
  رز: { src: "/image/brands/rose.png", width: 297, height: 102 },
  اطلس: { src: "/image/brands/atlas.png", width: 1097, height: 149 },
  پفاف: { src: "/image/brands/pfaff.png", width: 753, height: 179 },
};

// { src, width, height } برای نام برند (فارسی)، یا null
export function brandLogo(name) {
  return LOGOS[normalizeText(name)] ?? null;
}
