// جست‌وجوی سمت کلاینت لیست‌های پنل (نظرها و سفارش‌ها، روی همان فهرستی که صفحه دارد). نوشته‌ها پیش از مقایسه یک‌دست می‌شوند: رقم فارسی و عربی لاتین، «ي ى ك» عربی فارسی،
// حروف بزرگ لاتین کوچک و نیم‌فاصله (ZWNJ) فاصله. همهٔ این تبدیل‌ها یک نویسه را به یک نویسه می‌برند (طول رشته عوض نمی‌شود)، پس جای یافته‌ها روی نوشتهٔ اصلی هم درست
// می‌افتد و Highlight می‌تواند همان بازه‌ها را در متن اصلی رنگ کند.
export function normalize(value) {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/‌/g, " ")
    .replace(/[A-Z]/g, (c) => c.toLowerCase());
}

// عبارت جست‌وجو به واژه‌ها شکسته می‌شود؛ موردی پیدا می‌شود که همهٔ واژه‌ها در متن قابل جست‌وجویش (هر جای آن) باشند
export function parseTerms(query) {
  return normalize(query).split(/\s+/).filter(Boolean);
}

// متن قابل جست‌وجو از چند فیلد (با خط جدید جدا می‌شوند تا واژه‌ای از میان دو فیلد پیدا نشود)
export function joinFields(fields) {
  return normalize(fields.filter((v) => v !== undefined && v !== null && v !== "").join("\n"));
}

// بازه‌های [شروع، پایان) یافته‌ها در text (برای رنگ‌کردن)، مرتب و بدون هم‌پوشانی
export function rangesOf(text, terms) {
  const n = normalize(text);
  const found = [];
  for (const term of terms) {
    let at = n.indexOf(term);
    while (at !== -1) {
      found.push([at, at + term.length]);
      at = n.indexOf(term, at + term.length);
    }
  }
  found.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of found) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }
  return merged;
}
