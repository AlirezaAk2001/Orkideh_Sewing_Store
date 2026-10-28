import { isSoldOut } from "./stock.js";
import { matchesQuery } from "./brands.js";

// فیلتر، مرتب‌سازی و صفحه‌بندی فهرست محصولات (/products و /categories/[slug]).
// همه‌چیز از آدرس (?sort=…&min=…) خوانده می‌شود و روی لیست محصولاتی که lib/products.js از دیتابیس آورده در حافظه انجام می‌شود:
// قیمت مؤثر محصول finalPrice است که برای ردیف‌های قدیمی خالی است و shapeProduct پرش می‌کند، و دیتابیس نمی‌تواند روی آن
// مرتب‌سازی کند. فروشگاه صدها محصول دارد، نه میلیون‌ها، پس خواندن یک‌جای همه‌چیز (همان کاری که فهرست قبلاً هم می‌کرد) کافی است.
// این فایل عمداً به پریزما و react وابسته نیست تا بتوان آن را مستقل تست کرد.

export const PAGE_SIZE = 12;

export const SORTS = [
  { value: "newest", label: "جدیدترین" },
  { value: "best", label: "پرفروش‌ترین" },
  { value: "rating", label: "بیشترین امتیاز" },
  { value: "price-asc", label: "ارزان‌ترین" },
  { value: "price-desc", label: "گران‌ترین" },
  { value: "discount", label: "بیشترین تخفیف" },
];
export const DEFAULT_SORT = "newest";

const MAX_PRICE = 1e12;

// رقم‌های فارسی و عربی را لاتین می‌کند و جداکنندهٔ هزارگان (، ٬ ,) و فاصله را برمی‌دارد
export function toLatinDigits(text) {
  return String(text ?? "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[\s,،٬]/g, "");
}

// عدد صحیح نامنفی از ورودی کاربر یا آدرس؛ هر چیز دیگر null
export function parsePrice(value) {
  const text = toLatinDigits(value);
  if (!/^\d{1,13}$/.test(text)) return null;
  const n = Number(text);
  return n <= MAX_PRICE ? n : null;
}

const one = (value) => (Array.isArray(value) ? value[0] : value);

// پارامترهای آدرس را به شکل یکدست درمی‌آورد؛ مقدار نامعتبر نادیده گرفته می‌شود (هیچ‌وقت خطا نمی‌دهد)
export function parseListParams(searchParams = {}) {
  const sortValue = one(searchParams.sort);
  const sort = SORTS.some((s) => s.value === sortValue) ? sortValue : DEFAULT_SORT;
  let min = parsePrice(one(searchParams.min));
  let max = parsePrice(one(searchParams.max));
  if (min != null && max != null && min > max) [min, max] = [max, min];
  const pageText = toLatinDigits(one(searchParams.page));
  const pageNumber = /^\d{1,6}$/.test(pageText) ? Number(pageText) : 0;
  // جستجوی نام یا برند: فاصله‌ها یکی، کاراکتر کنترلی حذف و حداکثر ۶۰ نویسه
  const q = String(one(searchParams.q) ?? "").replace(/\p{Cc}/gu, "").replace(/\s+/g, " ").trim().slice(0, 60);
  return {
    sort,
    q,
    min,
    max,
    available: one(searchParams.available) === "1",
    discount: one(searchParams.discount) === "1",
    page: pageNumber >= 1 && pageNumber <= 100000 ? pageNumber : 1,
  };
}

// جستجو، بازهٔ قیمت و هر چک‌باکس هر کدام یک فیلتر حساب می‌شوند (همان شمارنده‌ای که روی دکمهٔ «فیلترها» می‌آید)
export function activeFilterCount(params) {
  return (params.q ? 1 : 0) + (params.min != null || params.max != null ? 1 : 0) + (params.available ? 1 : 0) + (params.discount ? 1 : 0);
}

// آدرس فهرست؛ مقدارهای پیش‌فرض (مرتب‌سازی جدیدترین، صفحهٔ ۱، فیلتر خاموش) در آدرس نمی‌آیند
export function buildListUrl(basePath, params, overrides = {}) {
  const p = { ...params, ...overrides };
  const query = new URLSearchParams();
  if (p.sort && p.sort !== DEFAULT_SORT) query.set("sort", p.sort);
  if (p.q) query.set("q", p.q);
  if (p.min != null) query.set("min", String(p.min));
  if (p.max != null) query.set("max", String(p.max));
  if (p.available) query.set("available", "1");
  if (p.discount) query.set("discount", "1");
  if (p.page > 1) query.set("page", String(p.page));
  const text = query.toString();
  return text ? `${basePath}?${text}` : basePath;
}

const priceOf = (product) => {
  const n = Number(product.finalPrice ?? product.price);
  return Number.isFinite(n) ? n : 0;
};

// products: محصولات این فهرست به ترتیب «جدیدترین اول»؛ sales: { [productId]: تعداد فروش } فقط برای مرتب‌سازی «پرفروش‌ترین»
export function queryProducts(products, params, { sales = {} } = {}) {
  const prices = products.map(priceOf);
  const bounds = prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : { min: 0, max: 0 };

  const matches = products.filter((product) => {
    if (params.q && !matchesQuery(product, params.q)) return false;
    const price = priceOf(product);
    if (params.min != null && price < params.min) return false;
    if (params.max != null && price > params.max) return false;
    if (params.available && isSoldOut(product)) return false;
    if (params.discount && !(Number(product.discount) > 0)) return false;
    return true;
  });

  // ترتیب ورودی «جدیدترین اول» است و مرتب‌سازی پایدار می‌ماند، پس هر ردیف هم‌رتبه به همان ترتیب می‌ماند
  const by = {
    newest: null,
    best: (a, b) => (sales[b.id] ?? 0) - (sales[a.id] ?? 0),
    rating: (a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0) || (b.totalVotes ?? 0) - (a.totalVotes ?? 0),
    "price-asc": (a, b) => priceOf(a) - priceOf(b),
    "price-desc": (a, b) => priceOf(b) - priceOf(a),
    discount: (a, b) => (Number(b.discount) || 0) - (Number(a.discount) || 0),
  }[params.sort];
  const sorted = by ? [...matches].sort(by) : matches;

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(params.page, pageCount);
  return {
    items: sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total,
    scopeTotal: products.length,
    page,
    pageCount,
    outOfRange: params.page > pageCount,
    bounds,
  };
}

// شماره‌های نوار صفحه‌بندی: اولی و آخری و دو صفحهٔ دور و برِ صفحهٔ فعلی؛ جاهای خالی "…"
export function pageItems(page, pageCount) {
  const wanted = new Set([1, pageCount, page - 1, page, page + 1]);
  if (page <= 3) [2, 3].forEach((n) => wanted.add(n));
  if (page >= pageCount - 2) [pageCount - 1, pageCount - 2].forEach((n) => wanted.add(n));
  const numbers = [...wanted].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);
  const items = [];
  numbers.forEach((n, i) => {
    const gap = i > 0 ? n - numbers[i - 1] : 1;
    // یک صفحه که جا ندارد را خودش می‌نویسیم؛ "…" برای یک عدد فقط جا هدر می‌دهد
    if (gap === 2) items.push(n - 1);
    else if (gap > 2) items.push("…");
    items.push(n);
  });
  return items;
}
