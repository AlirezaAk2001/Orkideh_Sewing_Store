// تگ <script type="application/ld+json"> برای داده‌های ساخت‌یافته (schema.org)؛ کامپوننت سروری است، نه چیزی که در مرورگر اجرا شود.
// جایگزینی < با ‎< جلوی بسته‌شدن زودهنگام تگ script را می‌گیرد (مثلاً اگر متن یک نظر کاربر </script> داشته باشد).
export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
