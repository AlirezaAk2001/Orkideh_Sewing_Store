import BannerSlider from "./BannerSlider";
import HomeIntro from "./home/HomeIntro";
import CategoryGrid from "./home/CategoryGrid";
import ProductRail from "./home/ProductRail";
import ServiceSection from "./home/ServiceSection";
import BrandStrip from "./home/BrandStrip";
import ReviewsSection from "./home/ReviewsSection";
import Reveal from "./home/Reveal";

// ردیف‌های محصول به ترتیب نمایش؛ وقتی ردیف فقط یک محصول دارد عنوان و زیرعنوانش مفرد می‌شود
const RAILS = [
  {
    key: "discounted",
    id: "home-discounted",
    one: { title: "پیشنهاد ویژه", subtitle: "محصول دارای تخفیف" },
    many: { title: "پیشنهادهای ویژه", subtitle: "محصولات دارای تخفیف" },
  },
  {
    key: "newest",
    id: "home-newest",
    one: { title: "جدیدترین محصول", subtitle: "تازه‌ترین کالای اضافه‌شده به فروشگاه" },
    many: { title: "جدیدترین محصولات", subtitle: "تازه‌ترین کالاهای اضافه‌شده به فروشگاه" },
  },
  {
    key: "bestSellers",
    id: "home-best-sellers",
    one: { title: "پرفروش‌ترین محصول", subtitle: "محبوب‌ترین کالا میان مشتریان" },
    many: { title: "پرفروش‌ترین‌ها", subtitle: "محبوب‌ترین کالاها میان مشتریان" },
  },
];

// صفحهٔ اصلی؛ همهٔ داده را صفحهٔ سروری (app/page.js) می‌دهد تا در همان HTML اولیه باشد.
// بخش‌هایی که داده ندارند (بدون تخفیف، بدون فروش، بدون نظر) اصلاً نمایش داده نمی‌شوند.
export default function HomeContent({ banners, bannersError, categories, categoriesError, rails, reviews }) {
  return (
    <div>
      <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:pt-6">
        <BannerSlider banners={banners} error={bannersError} />
        <HomeIntro />
      </div>

      <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-10 sm:space-y-14 sm:py-12">
        <Reveal>
          <CategoryGrid categories={categories} error={categoriesError} />
        </Reveal>

        {RAILS.map(({ key, id, one, many }) => {
          const products = rails[key];
          if (products.length === 0) return null;
          const text = products.length === 1 ? one : many;
          return (
            <Reveal key={id}>
              <ProductRail id={id} title={text.title} subtitle={text.subtitle} href="/products" products={products} />
            </Reveal>
          );
        })}

        <Reveal>
          <ServiceSection />
        </Reveal>

        {reviews.length > 0 && (
          <Reveal>
            <ReviewsSection reviews={reviews} />
          </Reveal>
        )}

        <Reveal>
          <BrandStrip />
        </Reveal>
      </div>
    </div>
  );
}
