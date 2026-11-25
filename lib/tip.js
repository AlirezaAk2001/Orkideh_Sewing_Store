// راهنمای بالای دکمه‌ها (tooltip) به‌جای title مرورگر. تنها نمونهٔ آن AppTooltip در layout است (react-tooltip، ظاهر در globals.css: .app-tip)؛
// هر دکمه فقط ویژگی‌های data-tooltip را می‌گیرد: <button aria-label="حذف" {...tip("حذف")}>.
// title اسم دسترسی‌پذیر دکمه هم بود ولی tooltip نیست؛ پس دکمه‌ای که متن دیدنی ندارد باید aria-label داشته باشد.
// محتوای خالی (undefined یا "") یعنی راهنما نیست؛ place: top | bottom | left | right (پیش‌فرض: بالا)؛ offset (اختیاری، پیکسل): فاصلهٔ راهنما از عنصر، پیش‌فرض ۱۰؛
// className (اختیاری): کلاس اضافه برای ظاهر همین راهنما (مثل app-tip--rail در globals.css)
// دکمهٔ غیرفعال رویداد موس نمی‌گیرد (در بیشتر مرورگرها)، پس راهنمای دکمهٔ غیرفعال را روی عنصر دربرگیرنده بگذارید و خود دکمه pointer-events-none بگیرد
export const TIP_ID = "app-tip";

export function tip(content, place, offset, className) {
  const props = { "data-tooltip-id": TIP_ID };
  if (content) props["data-tooltip-content"] = content;
  if (place) props["data-tooltip-place"] = place;
  if (offset) props["data-tooltip-offset"] = offset;
  if (className) props["data-tooltip-class-name"] = className;
  return props;
}
