// برند محصول و جستجوی نام/برند.
// جدول Product ستون «برند» ندارد، پس برند از نام محصول به دست می‌آید (نام‌ها فارسی‌اند، مثل «چرخ خیاطی ژانومه ۶۲۵»):
//  ۱) «برند X» در نام (مثل «روغن ۴ لیتری چرخ خیاطی برند صدر») صریح‌ترین نشانه است و هر X می‌تواند برند باشد؛
//  ۲) وگرنه یکی از نام‌های فهرست BRANDS (فارسی و لاتین) به‌صورت کلمهٔ کامل در نام بیاید.
// برند تازه‌ای که با «برند X» نوشته نشود باید یک خط به BRANDS اضافه شود (یا جدول ستون برند بگیرد).
// این فایل عمداً به پریزما و react وابسته نیست تا مستقل تست شود.

export const BRANDS = [
  { name: "ژانومه", aliases: ["janome", "ژانومه", "جانومه", "جانومی"] },
  { name: "برادر", aliases: ["brother", "برادر"] },
  { name: "برنینا", aliases: ["bernina", "برنینا"] },
  { name: "جگوار", aliases: ["jaguar", "جگوار", "جاگوار"] },
  { name: "نیولایف", aliases: ["newlife", "new life", "نیولایف", "نیو لایف"] },
  { name: "یوشیتا", aliases: ["youshita", "yoshita", "یوشیتا"] },
  { name: "رفری", aliases: ["refrey", "رفری"] },
  { name: "پفاف", aliases: ["pfaff", "پفاف"] },
  { name: "سینگر", aliases: ["singer", "سینگر"] },
  { name: "جوکی", aliases: ["juki", "جوکی"] },
  { name: "ارگان", aliases: ["organ", "ارگان"] },
  { name: "رز", aliases: ["rose", "رز"] },
];

const LATIN_DIGITS = "0123456789";
const digit = (table) => (d) => LATIN_DIGITS[table.indexOf(d)];

// برای مقایسه: حروف عربی (ي ك ة) و رقم‌های فارسی/عربی یکی می‌شوند، نیم‌فاصله فاصله می‌شود و حروف لاتین کوچک
export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ة/g, "ه")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[۰-۹]/g, digit("۰۱۲۳۴۵۶۷۸۹"))
    .replace(/[٠-٩]/g, digit("٠١٢٣٤٥٦٧٨٩"))
    .replace(/[‌‍]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// کلمهٔ کامل: «رز» در «پدال رز» برند است ولی در «ارزان» نیست
const wordRegExp = (text) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(text)}(?![\\p{L}\\p{N}])`, "u");

const COMPILED = BRANDS.map((brand) => {
  const aliases = brand.aliases.map(normalizeText);
  return { name: brand.name, key: normalizeText(brand.name), aliases, patterns: aliases.map(wordRegExp) };
});
const BRAND_WORD = /(?<![\p{L}\p{N}])برند\s+([\p{L}\p{N}]+)/u;

const cache = new Map();

// { name, key, tokens } یا null؛ tokens همان نوشته‌هایی‌اند که در جستجو یعنی این برند
export function brandOf(productName) {
  const text = normalizeText(productName);
  if (cache.has(text)) return cache.get(text);

  let found = null;
  const explicit = text.match(BRAND_WORD);
  if (explicit) {
    const word = explicit[1];
    const known = COMPILED.find((b) => b.aliases.includes(word));
    // «برند ژانومه» همان برند فهرست است؛ هر نام دیگر برای خودش برند تازه است (لاتین با حرف اول بزرگ)
    found = known
      ? { name: known.name, key: known.key, tokens: known.aliases }
      : { name: /^[a-z]/.test(word) ? word[0].toUpperCase() + word.slice(1) : word, key: word, tokens: [word] };
  } else {
    let best = null;
    for (const brand of COMPILED) {
      for (const pattern of brand.patterns) {
        const at = text.search(pattern);
        if (at >= 0 && (!best || at < best.at)) best = { at, brand };
      }
    }
    if (best) found = { name: best.brand.name, key: best.brand.key, tokens: best.brand.aliases };
  }
  cache.set(text, found);
  return found;
}

// برند با این نام (فارسی یا لاتین)، برای نوشتن «برند: ژانومه» روی چیپ فیلتر؛ نبود: null
export function findBrandByQuery(query) {
  const q = normalizeText(query);
  if (!q) return null;
  const known = COMPILED.find((b) => b.key === q || b.aliases.includes(q));
  return known ? { name: known.name } : null;
}

// هر کلمهٔ جستجو باید در نام محصول بیاید یا یکی از نام‌های برند آن محصول باشد (پس «janome» محصول «ژانومه ۶۲۵» را هم پیدا می‌کند)
export function matchesQuery(product, query) {
  const tokens = normalizeText(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return true;
  const text = normalizeText(product.name);
  const brand = brandOf(product.name);
  return tokens.every((token) => text.includes(token) || (brand && brand.tokens.includes(token)));
}

// برندهای موجود در فهرست محصولات: [{ name, count }] پرمحصول‌ترین اول
export function listBrands(products) {
  const byKey = new Map();
  for (const product of products) {
    const brand = brandOf(product.name);
    if (!brand) continue;
    const entry = byKey.get(brand.key) || { name: brand.name, count: 0 };
    entry.count += 1;
    byKey.set(brand.key, entry);
  }
  return [...byKey.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fa"));
}
