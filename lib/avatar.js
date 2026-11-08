// آواتار کاربر: قواعد مشترک سرور و مرورگر (بدون import از جای دیگر، تا هر دو طرف بتوانند آن را بخوانند).
//
// ذخیره‌سازی: ستون User.profileImageUrl فقط «انتخاب کاربر» را نگه می‌دارد و ستون User.googleImageUrl عکس حساب گوگل را:
//   خالی (null یا "")  = پیش‌فرض: عکس گوگل اگر دارد، وگرنه حرف اول نام
//   "initial"          = حرف اول نام (انتخاب صریح کاربر؛ حتی اگر عکس گوگل دارد)
//   "preset:<کلید>"    = یکی از طرح‌های آمادهٔ فروشگاه (PRESETS)
//   "/uploads/<فایل>"  = عکسی که خود کاربر آپلود کرده (lib/uploads.js)
//   آدرس عکس گوگل در خود ستون (کاربران گوگلیِ قدیمی که google-callback آدرس را آنجا گذاشته بود) هم «پیش‌فرض» حساب می‌شود.
// هر مقدار ناشناخته‌ای (طرحی که حذف شده، فایل خراب) به پیش‌فرض برمی‌گردد و سایت را نمی‌شکند.
//
// «مقدار نمایشی» (avatar) همان چیزی است که کامپوننت <Avatar> می‌گیرد و به مرورگر و نظرها می‌رود:
//   "" (حرف اول) | "preset:<کلید>" | "/uploads/<فایل>" | آدرس https عکس گوگل

// طرح‌های آماده (همه از دنیای خیاطی)؛ آیکون هر کدام در app/components/avatarIcons.jsx و رنگ زمینه c = [شروع، پایان] گرادیان است
export const PRESETS = [
  { key: "machine", label: "چرخ خیاطی", c: ["#f43f5e", "#881337"] },
  { key: "needle-thread", label: "سوزن و نخ", c: ["#fbbf24", "#ea580c"] },
  { key: "spool", label: "قرقره نخ", c: ["#f472b6", "#be185d"] },
  { key: "scissors", label: "قیچی", c: ["#a78bfa", "#5b21b6"] },
  { key: "ruler", label: "متر خیاطی", c: ["#fde047", "#ca8a04"] },
  { key: "button", label: "دکمه", c: ["#2dd4bf", "#0f766e"] },
  { key: "needle", label: "سوزن", c: ["#818cf8", "#4338ca"] },
  { key: "yarn", label: "کلاف نخ", c: ["#c4b5fd", "#7c3aed"] },
  { key: "thimble", label: "انگشتانه", c: ["#e879f9", "#86198f"] },
  { key: "bobbin", label: "ماسوره", full: "ماسورهٔ چرخ خیاطی", c: ["#fb923c", "#c2410c"] },
  { key: "oil", label: "روغن چرخ", full: "روغن چرخ خیاطی", c: ["#38bdf8", "#0369a1"] },
  { key: "motor", label: "دینام چرخ", full: "دینام چرخ خیاطی", c: ["#94a3b8", "#334155"] },
];

export const presetOf = (key) => PRESETS.find((preset) => preset.key === key) ?? null;

// عکس شخصی: سقف حجم فایل (هم برای فایل انتخابی در مرورگر و هم برای آنچه به سرور می‌رسد)، قالب‌های مجاز و اندازهٔ نهایی بعد از برش
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_SIZE = 256;
export const AVATAR_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// نام فایل ذخیره‌شده همان الگوی lib/uploads.js است (فقط jpg، png و webp)
const UPLOAD_PATTERN = /^\/uploads\/[a-z0-9]{6,12}-[a-f0-9]{16}\.(jpg|png|webp)$/;
// عکس حساب گوگل فقط از دامنهٔ خود گوگل و با https پذیرفته می‌شود (آدرس دلخواه هیچ‌وقت نمایش داده نمی‌شود)
const GOOGLE_PATTERN = /^https:\/\/([a-z0-9-]+\.)+googleusercontent\.com\/[^\s"'<>]+$/i;

export const isUploadRef = (value) => typeof value === "string" && UPLOAD_PATTERN.test(value);
export const isGoogleImage = (value) => typeof value === "string" && value.length <= 600 && GOOGLE_PATTERN.test(value);

// آدرس عکس گوگل کاربر (ستون جدا، یا مقدار قدیمی داخل profileImageUrl)؛ بدون عکس: null
export function googleImageOf(user) {
  if (isGoogleImage(user?.googleImageUrl)) return user.googleImageUrl;
  if (isGoogleImage(user?.profileImageUrl)) return user.profileImageUrl;
  return null;
}

// مقدار نمایشی آواتار کاربر (توضیح بالای فایل)
export function avatarOf(user) {
  const raw = typeof user?.profileImageUrl === "string" ? user.profileImageUrl.trim() : "";
  if (raw.startsWith("preset:") && presetOf(raw.slice(7))) return raw;
  if (isUploadRef(raw)) return raw;
  if (raw === "initial") return "";
  return googleImageOf(user) ?? "";
}

// آنچه همراه کاربر به مرورگر می‌رود: آواتار نمایشی و آدرس عکس گوگل (برای برگشتن به آن در انتخاب‌گر)
export function avatarFields(user) {
  return { avatar: avatarOf(user), googleAvatar: googleImageOf(user) };
}

// کاربر داخل نظرها: ستون‌های خام آواتار حذف و مقدار نمایشی جایشان گذاشته می‌شود
export function withAvatar(user) {
  if (!user) return user;
  const { profileImageUrl, googleImageUrl, ...rest } = user;
  return { ...rest, avatar: avatarOf({ profileImageUrl, googleImageUrl }) };
}

// نوع مقدار نمایشی: initial | google | preset | photo (blob: = عکسی که کاربر هنوز ذخیره نکرده و فقط در انتخاب‌گر پیش‌نمایش داده می‌شود)
export function avatarType(value) {
  if (typeof value !== "string" || !value) return "initial";
  if (value.startsWith("preset:")) return "preset";
  if (value.startsWith("/uploads/") || value.startsWith("blob:")) return "photo";
  return "google";
}

// انتخاب فعلی برای انتخاب‌گر: { type, key } (key فقط برای طرح آماده)
export function avatarChoice(value) {
  const type = avatarType(value);
  return { type, key: type === "preset" ? value.slice(7) : null };
}

// مقداری که برای یک انتخاب غیرعکس در ستون ذخیره می‌شود؛ انتخاب نامعتبر: undefined
export function storedValueFor(type, key) {
  if (type === "initial") return "initial";
  if (type === "google") return "";
  if (type === "preset" && presetOf(key)) return `preset:${key}`;
  return undefined;
}

// نام فارسی آواتار انتخاب‌شده، برای برچسب پیش‌نمایش
export function avatarLabel(type, key) {
  if (type === "preset") {
    const preset = presetOf(key);
    return preset ? preset.full || preset.label : "طرح آماده";
  }
  if (type === "photo") return "عکس شما";
  if (type === "google") return "عکس حساب گوگل";
  return "حرف اول نام";
}

// حرف اول نام (برای آواتار پیش‌فرض)
export const avatarLetter = (name) => Array.from(String(name || "").trim())[0] || "؟";
