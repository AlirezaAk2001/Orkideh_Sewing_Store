const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

// رقم‌های لاتین یک متن را فارسی می‌کند؛ فقط برای نمایش، مقدار ذخیره‌شده عوض نمی‌شود
// (String.prototype.toLocaleString زبان را نادیده می‌گیرد، پس برای رشته‌ها کار نمی‌کند)
export function toPersianDigits(value) {
  return String(value ?? "").replace(/\d/g, (d) => FA_DIGITS[d]);
}
