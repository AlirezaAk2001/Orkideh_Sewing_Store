// قاب صفحه‌های جدول‌دار پنل (محصولات، دسته‌بندی‌ها، بنرها): از md به بالا ارتفاعش دقیقاً به اندازهٔ ناحیهٔ محتوای <main> است (100cqh؛ main در layout.jsx
// container-type:size دارد)، پس سربرگ صفحه، نوار ابزار، سرستون‌های جدول و صفحه‌بندی ثابت می‌مانند و فقط ردیف‌های جدول اسکرول می‌خورند (DataTable + ListCard fill).
// کف ۳۴ ریم (۵۴۴ پیکسل): در پنجرهٔ کوتاه‌تر قاب بیشتر کوچک نمی‌شود و خود main اسکرول می‌خورد. زیر md (کارت‌های موبایل) ارتفاع آزاد است و صفحه مثل قبل اسکرول می‌خورد
export default function TablePage({ children }) {
  return <div className="flex min-w-0 flex-col md:h-[100cqh] md:min-h-[34rem]">{children}</div>;
}
