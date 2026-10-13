"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { ShoppingCart } from "lucide-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Link from "next/link";
import toast from "react-hot-toast";
import AppImage from "./AppImage";

// بنرها را صفحهٔ سروری (app/page.js) می‌دهد تا در همان HTML اولیه باشند؛ error همان پیام نگرفتن بنرهاست
export default function BannerSlider({ banners, error }) {
  const [activeIndex, setActiveIndex] = useState(0);

  // مثل قبل: نبودن بنر یا خطا در دریافت آن‌ها پیام خطا نشان می‌دهد
  useEffect(() => {
    if (error) toast.error(error);
    else if (banners.length === 0) toast.error("هیچ بنری یافت نشد");
  }, [error, banners.length]);

  return (
    <div className="w-full lg:max-w-[1200px] lg:mx-auto rounded-xl overflow-hidden">
      <style jsx>{`
        @keyframes slideIn3D {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .text-3d {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        .animate-text {
          animation: slideIn3D 0.6s ease-out forwards;
        }
        .text-3d:nth-child(2) {
          animation-delay: 0.15s;
        }
        .text-3d:nth-child(3) {
          animation-delay: 0.3s;
        }
        .swiper-button-prev,
        .swiper-button-next {
          z-index: 5;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          color: white;
        }
        :global(img.fade-in) {
          opacity: 0;
          transition: opacity 0.8s ease-in;
        }
        :global(img.fade-in.loaded) {
          opacity: 1;
        }
      `}</style>

      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000 }}
        loop
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="rounded-xl"
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={banner.id}>
            <div className="relative w-full aspect-[18/9] min-h-[180px] sm:min-h-[250px] md:min-h-[350px] lg:min-h-[420px] overflow-hidden">
              <AppImage
                src={
                  banner.img?.startsWith("/image/")
                  ? banner.img
                  : `/image/${banner.img}`
                }
                alt={banner.title}
                fill
                sizes="(min-width: 1200px) 1200px, 100vw"
                priority={index === 0}
                className="object-cover fade-in"
                fallback="/image/default-banner.jpg"
                onLoad={(e) => e.currentTarget.classList.add("loaded")}
              />
              <div className="absolute inset-0 bg-black/50 flex flex-col justify-center px-4 sm:px-8 md:px-12 z-10 text-white text-center sm:text-right">
                <h2
                  className={`text-lg sm:text-xl md:text-2xl lg:text-4xl font-bold text-3d max-w-[80%] mx-auto sm:mr-0 sm:ml-auto ${
                    index === activeIndex ? "animate-text" : ""
                  }`}
                >
                  {banner.title}
                </h2>
                <p
                  className={`text-xs sm:text-sm md:text-base lg:text-lg mt-2 text-3d max-w-[80%] mx-auto sm:mr-0 sm:ml-auto line-clamp-2 ${
                    index === activeIndex ? "animate-text" : ""
                  }`}
                >
                  {banner.desc}
                </p>
                <Link href={banner.link || "/products"}>
                  <button
                    className={`mt-4 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-full flex items-center gap-1 justify-center w-fit mx-auto sm:mx-0 shadow-lg transition-transform hover:scale-105 cursor-pointer ${
                      index === activeIndex ? "animate-text" : ""
                    }`}
                  >
                    <ShoppingCart size={20} />
                    خرید
                  </button>
                </Link>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}