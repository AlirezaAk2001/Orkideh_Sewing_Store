// فهرست برندها از نام عکس‌های محصولات گرفته شده؛ مالک فروشگاه فهرست واقعی را مشخص کند
const BRANDS = ["Janome", "Brother", "Bernina", "Jaguar", "Newlife", "Youshita", "Refrey"];

export default function BrandStrip() {
  return (
    <section aria-labelledby="home-brands" className="text-center">
      <h2 id="home-brands" className="text-sm font-medium text-gray-500">
        برندهای موجود در فروشگاه
      </h2>
      <ul className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {BRANDS.map((brand) => (
          <li
            key={brand}
            dir="ltr"
            className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold tracking-wide text-gray-500 transition hover:border-brand-200 hover:text-brand-600"
          >
            {brand}
          </li>
        ))}
      </ul>
    </section>
  );
}
