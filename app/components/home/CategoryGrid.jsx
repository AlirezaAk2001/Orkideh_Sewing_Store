import { ArrowLeft, Layers, Package } from "lucide-react";
import AppImage from "../AppImage";
import SectionHeading from "./SectionHeading";
import SpotLink from "./SpotLink";

const fa = (n) => Number(n).toLocaleString("fa-IR");

// دسته‌بندی‌ها: کارت تصویری با تعداد محصول و دکمهٔ «مشاهده محصولات» (استایل در home.css).
// ستون‌ها و نسبت کارت با تعداد دسته‌ها عوض می‌شود (data-n روی لیست): با یک یا دو دسته کارت‌ها بزرگ و پهن‌اند و با چهار دسته و بیشتر چهارتا در هر ردیف.
// counts: { [id دسته]: تعداد محصول } که صفحهٔ سروری می‌دهد؛ دستهٔ بدون محصول یا نبودن عدد، چیپ تعداد را ندارد.
export default function CategoryGrid({ categories, counts = {}, error }) {
  const n = Math.min(categories.length, 4);
  const single = categories.length === 1; // عنوان با یک دسته مفرد می‌شود
  const imageSizes =
    n <= 2 ? "(min-width: 768px) 50vw, 100vw" : n === 3 ? "(min-width: 768px) 33vw, 50vw" : "(min-width: 1024px) 25vw, 50vw";

  return (
    <section aria-labelledby="home-categories">
      <SectionHeading
        id="home-categories"
        eyebrow="دسته‌بندی"
        icon="layers"
        title={single ? "دسته‌بندی" : "دسته‌بندی‌ها"}
        subtitle={single ? "محصول مورد نظرتان را در این دسته پیدا کنید" : "محصول مورد نظرتان را از میان دسته‌ها پیدا کنید"}
      />
      {error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <ul className="hc-grid" data-n={n}>
          {categories.map((cat) => {
            const count = counts[cat.id] ?? 0;
            return (
              <li key={cat.id}>
                <SpotLink href={`/categories/${cat.slug}`} className="hc-card">
                  {cat.image ? (
                    <AppImage src={cat.image} alt="" fill sizes={imageSizes} className="hc-img" />
                  ) : (
                    <div className="hc-ph" aria-hidden="true">
                      <Layers />
                    </div>
                  )}
                  <i className="hc-shade" aria-hidden="true" />
                  <div className="hc-b">
                    {count > 0 && (
                      <span className="hc-chip">
                        <Package size={14} aria-hidden="true" />
                        {fa(count)} محصول
                      </span>
                    )}
                    <h3>{cat.name}</h3>
                    <span className="hc-go">
                      مشاهده محصولات
                      <span className="hc-arr">
                        <ArrowLeft size={18} aria-hidden="true" />
                      </span>
                    </span>
                  </div>
                </SpotLink>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
