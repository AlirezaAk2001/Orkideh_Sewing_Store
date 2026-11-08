// بخش‌های پنل کاربری. تب فعال در آدرس است (/profile?tab=orders) تا دکمهٔ برگشت، رفرش و لینک‌دادن درست کار کنند؛ «نمای کلی» پارامتر ندارد (/profile).
// icon نام کوتاه آیکون در icons.jsx است؛ badge کلید شمارندهٔ کنار آیکون دوک (در صفر یا نامعلوم نشان داده نمی‌شود)
export const TABS = [
  { key: "overview", label: "نمای کلی", icon: "dash" },
  { key: "orders", label: "سفارش‌ها", icon: "bag", badge: "orders" },
  { key: "addresses", label: "آدرس‌ها", icon: "pin", badge: "addresses" },
  { key: "cart", label: "سبد خرید", icon: "cart", badge: "cart" },
  { key: "favorites", label: "علاقه‌مندی‌ها", short: "علاقه‌مندی", icon: "heart", badge: "favorites" },
  { key: "settings", label: "تنظیمات", icon: "sliders" },
];

export const TAB_KEYS = TABS.map((t) => t.key);

export const tabHref = (key) => (key === "overview" ? "/profile" : `/profile?tab=${key}`);

// پارامتر نامعتبر یا نبودنش = نمای کلی
export const normalizeTab = (value) => (TAB_KEYS.includes(value) ? value : "overview");
