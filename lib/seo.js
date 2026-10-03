// ابزارهای SEO سمت سرور: آدرس سایت، متادیتای صفحه‌ها و تصویر پیش‌نمایش لینک (تلگرام، واتس‌اپ، گوگل)

export const SITE_NAME = "فروشگاه چرخ خیاطی ارکیده";
export const SITE_DESCRIPTION = "فروش و تعمیرات تخصصی چرخ خیاطی و لوازم جانبی در تهران؛ خرید آنلاین از فروشگاه ارکیده";

// وقتی محصول یا دسته تصویر ندارد، لوگوی فروشگاه در پیش‌نمایش لینک دیده می‌شود
const DEFAULT_PREVIEW_IMAGE = "/image/logo.png";
// عرض تصویر پیش‌نمایش: برای کارت لینک کافی است و از ۱۲۰۰ پیکسل بسیار سبک‌تر
const PREVIEW_WIDTH = 640;

let warned = false;
const warnOnce = (message) => {
  if (warned) return;
  warned = true;
  console.warn(message);
};

// همان قاعدهٔ lib/zibal.js: NEXT_PUBLIC_BASE_URL، وگرنه NEXTAUTH_URL؛ در نبود هر دو آدرس توسعه.
// خطا در تنظیم نباید کل سایت را از کار بیندازد، پس مقدار نامعتبر فقط هشدار می‌دهد.
export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
  if (configured) {
    try {
      new URL(configured);
      return configured.replace(/\/+$/, "");
    } catch {
      warnOnce(`NEXT_PUBLIC_BASE_URL معتبر نیست (${configured})؛ از آدرس توسعه استفاده می‌شود.`);
    }
  } else if (process.env.NODE_ENV === "production") {
    warnOnce("NEXT_PUBLIC_BASE_URL تنظیم نشده؛ آدرس‌های sitemap و پیش‌نمایش لینک درست نخواهند بود.");
  }
  return "http://localhost:3000";
}

export function absoluteUrl(path = "/") {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

// مقدار ذخیره‌شدهٔ تصویر ممکن است مسیر کامل (/image/x.png)، آدرس بیرونی یا فقط نام فایل باشد
function imageSource(img) {
  if (!img || typeof img !== "string") return DEFAULT_PREVIEW_IMAGE;
  if (/^https?:\/\//.test(img)) return img;
  return img.startsWith("/") ? img : `/image/${img}`;
}

// تصویرهای اصلی چند مگابایتی‌اند و واتس‌اپ/تلگرام چنین تصویری را در پیش‌نمایش نشان نمی‌دهند؛
// پس آدرس را از optimizer نکست می‌گیریم تا نسخهٔ کوچک‌شده تحویل شود
export function previewImage(img) {
  const src = imageSource(img);
  if (/^https?:\/\//.test(src)) return src;
  return absoluteUrl(`/_next/image?url=${encodeURIComponent(src)}&w=${PREVIEW_WIDTH}&q=75`);
}

// فاصله‌ها یکی می‌شوند و متن از حدود max نویسه بلندتر نمی‌شود (توضیح صفحه در نتایج گوگل کوتاه می‌شود)
export function describe(text, max = 160) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut}…`;
}

// متادیتای کامل یک صفحه؛ openGraph/twitter صفحه جایگزین کامل مقدار layout می‌شوند، پس همه‌چیز اینجا تکرار می‌شود
export function pageMetadata({ title, description, path, image, imageAlt }) {
  const imageUrl = previewImage(image);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName: SITE_NAME,
      url: path,
      title,
      description,
      images: [{ url: imageUrl, alt: imageAlt || title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function productDescription(product) {
  const category = product.Category?.name;
  const intro = `خرید ${product.name}${category ? ` (${category})` : ""} از ${SITE_NAME}`;
  const features = describe(product.additionalFeatures, 110);
  return describe(features ? `${intro}. ${features}` : intro);
}
