"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import AppImage from "../AppImage";
import { getImagePath } from "@/app/utils/getImagePath";
import { tip } from "@/lib/tip";

const fa = (n) => Number(n).toLocaleString("fa-IR");
const SWIPE = 45; // حداقل کشیدن انگشت (پیکسل) برای عوض شدن بنر

// بنرهای هیرو صفحهٔ اصلی. بنرها را صفحهٔ سروری (app/page.js) می‌دهد تا در همان HTML اولیه باشند؛ error همان پیام نگرفتن بنرهاست.
// نوارهای پیشرفت تمام عرض پایین بنر را مساوی بین بنرها تقسیم می‌کنند. عوض شدن خودکار با خود نوار پیشرفت است: انیمیشن CSS نوار فعال (hero.css، hh-fill) که تمام شود، بنر بعد می‌آید؛ با موس روی قاب یا فوکوس صفحه‌کلید نوار می‌ایستد
// و با «کاهش حرکت» سیستم انیمیشنی نیست، پس خودکار عوض نمی‌شود (فقط دستی). بنر اول از همان رندر اول فعال است (بدون جاوااسکریپت هم دیده می‌شود).
export default function HeroSlider({ banners, error }) {
  const count = banners.length;
  const [cur, setCur] = useState(0);
  const touchX = useRef(null);

  // مثل قبل: نبودن بنر یا خطا در دریافت آن‌ها پیام خطا نشان می‌دهد
  useEffect(() => {
    if (error) toast.error(error);
    else if (count === 0) toast.error("هیچ بنری یافت نشد");
  }, [error, count]);

  const go = useCallback((i) => setCur(((i % count) + count) % count), [count]);

  if (count === 0) return null;
  const multi = count > 1;

  // راست‌به‌چپ: کشیدن انگشت به چپ = بنر بعد
  const onTouchEnd = (e) => {
    if (touchX.current === null || !multi) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) >= SWIPE) go(cur + (dx < 0 ? 1 : -1));
  };

  return (
    <div
      className="hh-media"
      role="group"
      aria-roledescription="carousel"
      aria-label="بنرهای فروشگاه"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={onTouchEnd}
    >
      <svg className="hh-stitch" aria-hidden="true">
        <rect />
      </svg>

      <div className="hh-frame">
        {banners.map((banner, i) => {
          const on = i === cur;
          return (
            <div
              key={banner.id}
              className={`hh-sl${on ? " on" : ""}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${fa(i + 1)} از ${fa(count)}`}
              aria-hidden={!on}
              inert={!on}
            >
              <AppImage
                src={getImagePath(banner.img)}
                alt=""
                fill
                sizes="(min-width: 960px) 640px, 100vw"
                priority={i === 0}
                className="hh-img"
                fallback="/image/default-banner.jpg"
              />
              <div className="hh-cap">
                <h2 style={{ "--k": 0 }}>{banner.title}</h2>
                <p style={{ "--k": 1 }}>{banner.desc}</p>
                <div className="hh-act" style={{ "--k": 2 }}>
                  <Link href={banner.link || "/products"} className="hh-btn hh-btn--pri btn-lift">
                    <ShoppingCart size={20} aria-hidden="true" />
                    خرید
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {multi && (
          <>
            <button type="button" className="hh-arrow hh-arrow--prev btn-flat" aria-label="بنر قبلی" {...tip("بنر قبلی")} onClick={() => go(cur - 1)}>
              <ChevronRight size={22} aria-hidden="true" />
            </button>
            <button type="button" className="hh-arrow hh-arrow--next btn-flat" aria-label="بنر بعدی" {...tip("بنر بعدی")} onClick={() => go(cur + 1)}>
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <div className="hh-ctrl">
              {/* پایان انیمیشن نوار فعال = رفتن به بنر بعد (فقط نوار فعال انیمیشن hh-fill دارد) */}
              <div className="hh-bars" onAnimationEnd={(e) => e.animationName === "hh-fill" && go(cur + 1)}>
                {banners.map((banner, i) => (
                  <button
                    key={banner.id}
                    type="button"
                    className={`hh-bar btn-flat${i === cur ? " on" : i < cur ? " done" : ""}`}
                    aria-label={`نمایش بنر ${fa(i + 1)} از ${fa(count)}`}
                    aria-current={i === cur}
                    onClick={() => go(i)}
                  >
                    <i className="hh-fill" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
