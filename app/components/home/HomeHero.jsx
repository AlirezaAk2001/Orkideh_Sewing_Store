import Link from "next/link";
import { BadgeCheck, CreditCard, LayoutGrid, Package, PackageSearch, Phone, Truck } from "lucide-react";
import { STORE } from "@/lib/contact";
import HeroSlider from "./HeroSlider";
import "./hero.css";

const fa = (n) => Number(n).toLocaleString("fa-IR");

// آیکون هر کاشی آمار (کلیدها را HomeContent می‌دهد)
const STAT_ICONS = { products: Package, brands: BadgeCheck, categories: LayoutGrid };

// قسمت اول صفحهٔ اصلی: عنوان و دکمه‌ها و آمار (ستون متن) کنار بنرها (HeroSlider).
// آمار همان داده‌های واقعی فروشگاه است (HomeContent می‌سازد و موارد صفر را حذف می‌کند)؛ بدون بنر یا بدون آمار، همان بخش نمایش داده نمی‌شود.
// فقط چیزهایی که خود سایت همین حالا دارد (ارسال رایگان در تهران، درگاه پرداخت)؛ ادعای «گارانتی» و مانند آن را مالک فروشگاه اضافه کند
export default function HomeHero({ banners, bannersError, stats = [] }) {
  const hasBanners = banners.length > 0;

  return (
    <section className={`hh${hasBanners ? "" : " hh--solo"}`} aria-label="معرفی فروشگاه">
      <div className="hh-text">
        <h1 className="hh-title" style={{ "--k": 0 }}>
          فروشگاه چرخ خیاطی <em>ارکیده</em>
        </h1>
        <p className="hh-sub" style={{ "--k": 1 }}>
          فروش و تعمیرات تخصصی چرخ خیاطی و لوازم جانبی
        </p>
        <div className="hh-ctas" style={{ "--k": 2 }}>
          <Link href="/products" className="hh-btn hh-btn--pri btn-lift">
            <PackageSearch size={20} aria-hidden="true" />
            مشاهده محصولات
          </Link>
          <a href={STORE.phones[0].href} className="hh-btn hh-btn--ghost btn-lift">
            <Phone size={20} aria-hidden="true" />
            تماس با فروشگاه
          </a>
        </div>
        {stats.length > 0 && (
          <ul className="hh-stats" style={{ "--k": 3 }}>
            {stats.map((item) => {
              const Icon = STAT_ICONS[item.key];
              return (
                <li key={item.key} className="hh-stat">
                  <span className="hh-stat-i">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <b>{fa(item.count)}</b>
                    <span>{item.label}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {hasBanners ? (
        <div className="hh-stagewrap">
          <HeroSlider banners={banners} error={bannersError} />
          <div className="hh-fb hh-fb1">
            <span className="hh-fb-i">
              <Truck size={20} aria-hidden="true" />
            </span>
            <div>
              <b>ارسال رایگان</b>
              <span>در تهران</span>
            </div>
          </div>
          <div className="hh-fb hh-fb2">
            <span className="hh-fb-i">
              <CreditCard size={20} aria-hidden="true" />
            </span>
            <div>
              <b>پرداخت امن</b>
              <span>از درگاه آنلاین</span>
            </div>
          </div>
        </div>
      ) : (
        // بدون بنر چیزی کشیده نمی‌شود، ولی HeroSlider همچنان پیام «بنری نیست / خطا» را نشان می‌دهد (مثل BannerSlider قبلی)
        <HeroSlider banners={banners} error={bannersError} />
      )}
    </section>
  );
}
