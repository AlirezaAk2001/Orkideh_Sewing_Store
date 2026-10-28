import Link from "next/link";
import { buildListUrl, parseListParams } from "@/lib/productQuery";

const fa = (n) => Number(n).toLocaleString("fa-IR");
const allParams = parseListParams({});

// برندهای موجود در فروشگاه با نام فارسی و تعداد محصول؛ هر برند لینک فهرست محصولاتی است که نامشان آن برند را دارد (?q=برند).
// برندها را صفحهٔ سروری از نام محصول‌ها درمی‌آورد (lib/brands.js)، پس برند تازه با اولین محصولش اینجا می‌آید.
// chip-3d همان دکمهٔ سه‌بعدی چیپ دسته‌های فهرست محصولات است (globals.css).
export default function BrandStrip({ brands }) {
  return (
    <section aria-labelledby="home-brands" className="text-center">
      <h2 id="home-brands" className="text-sm font-medium text-gray-500">
        برندهای موجود در فروشگاه
      </h2>
      <ul className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {brands.map((brand) => (
          <li key={brand.name}>
            <Link
              href={buildListUrl("/products", allParams, { q: brand.name })}
              aria-label={`محصولات برند ${brand.name} (${fa(brand.count)} محصول)`}
              className="chip-3d inline-flex min-h-10 items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              {brand.name}
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal leading-none text-gray-500">{fa(brand.count)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
