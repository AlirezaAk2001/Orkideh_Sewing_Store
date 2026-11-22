import HomeHero from "./home/HomeHero";
import CategoryGrid from "./home/CategoryGrid";
import ProductRail from "./home/ProductRail";
import ServiceSection from "./home/ServiceSection";
import BrandStrip from "./home/BrandStrip";
import ReviewsSection from "./home/ReviewsSection";
import Reveal from "./home/Reveal";
import HomeThread from "./home/HomeThread";
import { buildListUrl, parseListParams } from "@/lib/productQuery";

// «مشاهده همه» هر ردیف، فهرست همان ردیف است: پیشنهادها فقط تخفیف‌دارها با بیشترین تخفیف اول، پرفروش‌ها به ترتیب فروش
const allParams = parseListParams({});
const listUrl = (overrides) => buildListUrl("/products", allParams, overrides);

// ردیف‌های محصول به ترتیب نمایش؛ وقتی ردیف فقط یک محصول دارد عنوان و زیرعنوانش مفرد می‌شود
const RAILS = [
  {
    key: "discounted",
    id: "home-discounted",
    eyebrow: "تخفیف",
    icon: "tag",
    href: listUrl({ discount: true, sort: "discount" }),
    one: { title: "پیشنهاد ویژه", subtitle: "محصول دارای تخفیف" },
    many: { title: "پیشنهادهای ویژه", subtitle: "محصولات دارای تخفیف" },
  },
  {
    key: "newest",
    id: "home-newest",
    eyebrow: "تازه‌ها",
    icon: "sparkles",
    href: listUrl({}),
    one: { title: "جدیدترین محصول", subtitle: "تازه‌ترین کالای اضافه‌شده به فروشگاه" },
    many: { title: "جدیدترین محصولات", subtitle: "تازه‌ترین کالاهای اضافه‌شده به فروشگاه" },
  },
  {
    key: "bestSellers",
    id: "home-best-sellers",
    eyebrow: "پرفروش",
    icon: "flame",
    href: listUrl({ sort: "best" }),
    one: { title: "پرفروش‌ترین محصول", subtitle: "محبوب‌ترین کالا میان مشتریان" },
    many: { title: "پرفروش‌ترین‌ها", subtitle: "محبوب‌ترین کالاها میان مشتریان" },
  },
];

// صفحهٔ اصلی؛ همهٔ داده را صفحهٔ سروری (app/page.js) می‌دهد تا در همان HTML اولیه باشد.
// بخش‌هایی که داده ندارند (بدون تخفیف، بدون فروش، بدون نظر) اصلاً نمایش داده نمی‌شوند.
export default function HomeContent({ banners, bannersError, categories, categoriesError, rails, reviews, brands = [], productCount = 0, categoryCounts = {}, reviewStats = { count: 0, average: 0 } }) {
  // آمار هیرو: همان داده‌های واقعی فروشگاه؛ موردِ صفر (یا خطا در دریافتش) نمایش داده نمی‌شود
  const stats = [
    { key: "products", label: "محصول", count: productCount },
    { key: "brands", label: "برند", count: brands.length },
    { key: "categories", label: "دسته‌بندی", count: categories.length },
  ].filter((item) => item.count > 0);

  return (
    // relative isolate: نخ و سوزن پس‌زمینه (HomeThread) پشت همهٔ بخش‌ها و بالای رنگ صفحه می‌نشیند و اندازه‌اش را از همین ریشه می‌گیرد
    <div className="relative isolate">
      <HomeThread />
      <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:pt-6">
        <HomeHero banners={banners} bannersError={bannersError} stats={stats} />
      </div>

      <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-10 sm:space-y-14 sm:py-12">
        <Reveal>
          <CategoryGrid categories={categories} counts={categoryCounts} error={categoriesError} />
        </Reveal>

        {RAILS.map(({ key, id, href, one, many, eyebrow, icon }) => {
          const products = rails[key];
          if (products.length === 0) return null;
          const text = products.length === 1 ? one : many;
          return (
            <Reveal key={id}>
              <ProductRail id={id} title={text.title} subtitle={text.subtitle} eyebrow={eyebrow} icon={icon} href={href} products={products} />
            </Reveal>
          );
        })}

        <Reveal>
          <ServiceSection reviewStats={reviewStats} />
        </Reveal>

        {reviews.length > 0 && (
          <Reveal>
            <ReviewsSection reviews={reviews} stats={reviewStats} />
          </Reveal>
        )}

        {brands.length > 0 && (
          <Reveal>
            <BrandStrip brands={brands} />
          </Reveal>
        )}
      </div>
    </div>
  );
}
