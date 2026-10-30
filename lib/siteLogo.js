// لوگوی فروشگاه (ماشین دوخت با چرخ‌گلی). LOGO نسخهٔ برداری است و SiteLogo آن را با انیمیشن دوختن نشان می‌دهد؛ LOGO_PNG همان نقاشی به‌صورت
// تصویر نقطه‌ای است برای جاهایی که SVG جواب نمی‌دهد (پیش‌نمایش لینک در شبکه‌های اجتماعی، اسپینر بارگذاری).
// اگر لوگو را عوض کردید اسم فایل را هم عوض کنید تا کش مرورگر و بهینه‌ساز تصویر نکست نسخهٔ قدیمی را نشان ندهند
export const LOGO = "/image/orkideh-logo.svg";
export const LOGO_PNG = "/image/orkideh-logo.png";

// انیمیشن دوختن: اولین بار یک ثانیه بعد از نمایش، بعد هر ۷ ثانیه یک‌بار؛ هر دوخت ۱٫۸۲ ثانیه (باید با keyframeهای logo-* در globals.css یکی باشد)
export const SEW_FIRST_MS = 1000;
export const SEW_EVERY_MS = 7000;
export const SEW_DURATION_MS = 1820;
