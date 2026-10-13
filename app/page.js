import HomeContent from "./components/HomeContent";
import { listBanners } from "@/lib/banners";
import { listCategories } from "@/lib/categories";

// بنرها و دسته‌بندی‌ها در هر درخواست تازه از دیتابیس خوانده می‌شوند، نه هنگام build
export const dynamic = "force-dynamic";

// صفحهٔ اصلی در قطعی دیتابیس هم باز می‌شود: متن و دکمهٔ «مشاهده محصولات» ثابت‌اند و فقط بخشی که داده نگرفته پیام خطا نشان می‌دهد
async function load(read, logMessage, message) {
  try {
    return { data: await read(), error: null };
  } catch (error) {
    console.error(logMessage, error);
    return { data: [], error: message };
  }
}

export default async function Home() {
  const [banners, categories] = await Promise.all([
    load(listBanners, "خطا در دریافت بنرها:", "خطا در بارگذاری بنرها"),
    load(listCategories, "خطا در دریافت دسته‌بندی‌ها:", "خطا در دریافت دسته‌بندی‌ها"),
  ]);

  return (
    <HomeContent
      banners={banners.data}
      bannersError={banners.error}
      categories={categories.data}
      categoriesError={categories.error}
    />
  );
}
