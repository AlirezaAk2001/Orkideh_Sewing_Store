import HomeContent from "./components/HomeContent";
import { listBanners } from "@/lib/banners";
import { listCategories } from "@/lib/categories";
import { listHomeRails } from "@/lib/products";
import { listLatestReviews } from "@/lib/comments";

// بنرها، دسته‌بندی‌ها و محصولات در هر درخواست تازه از دیتابیس خوانده می‌شوند، نه هنگام build
export const dynamic = "force-dynamic";

const NO_RAILS = { newest: [], discounted: [], bestSellers: [] };

// صفحهٔ اصلی در قطعی دیتابیس هم باز می‌شود: متن و دکمهٔ «مشاهده محصولات» ثابت‌اند و فقط بخشی که داده نگرفته پیام خطا نشان می‌دهد
// (ردیف‌های محصول و نظرها پیام خطا ندارند؛ اگر داده نیامد همان بخش نمایش داده نمی‌شود)
async function load(read, logMessage, message, fallback = []) {
  try {
    return { data: await read(), error: null };
  } catch (error) {
    console.error(logMessage, error);
    return { data: fallback, error: message };
  }
}

export default async function Home() {
  const [banners, categories, rails, reviews] = await Promise.all([
    load(listBanners, "خطا در دریافت بنرها:", "خطا در بارگذاری بنرها"),
    load(listCategories, "خطا در دریافت دسته‌بندی‌ها:", "خطا در دریافت دسته‌بندی‌ها"),
    load(listHomeRails, "خطا در دریافت محصولات صفحهٔ اصلی:", null, NO_RAILS),
    load(listLatestReviews, "خطا در دریافت نظرهای صفحهٔ اصلی:", null),
  ]);

  return (
    <HomeContent
      banners={banners.data}
      bannersError={banners.error}
      categories={categories.data}
      categoriesError={categories.error}
      rails={rails.data}
      reviews={reviews.data}
    />
  );
}
