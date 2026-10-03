"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import BannerSlider from "./components/BannerSlider";
import AppImage from "./components/AppImage";
import { motion } from "framer-motion";
import Icon from "@mdi/react";
import { mdiArchiveEyeOutline } from "@mdi/js";

// تصویر دسته‌بندی از optimizer می‌گذرد (به‌جای PNG چند مگابایتی، WebP متناسب با اندازهٔ کارت)
const MotionAppImage = motion.create(AppImage);

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isContentLoaded, setIsContentLoaded] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const resp = await fetch("/api/admin/categories");
        if (!resp.ok) throw new Error(`خطا: ${resp.status}`);
        const data = await resp.json();
        setCategories(data.data || data);
      } catch (err) {
        console.error("خطا در دریافت داده‌ها:", err);
        setError(err.message);
      } finally {
        setLoading(false);
        setIsContentLoaded(true);
      }
    };
    fetchCategories();
  }, []);

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, translateZ: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      translateZ: 0,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const renderSkeletons = () =>
    Array.from({ length: 2 }).map((_, idx) => (
      <motion.div
        key={idx}
        variants={itemVariants}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="bg-gray-300 rounded-lg p-4 sm:p-6 md:p-8 h-60 sm:h-72 md:h-96 w-60 sm:w-72 md:w-96 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-shimmer"></div>
        </div>
      </motion.div>
    ));

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center p-4 sm:p-8 md:p-12 gap-16">
      <BannerSlider />

      {/* قسمت فروشگاه با اسکلتون شیمر */}
      <div className="bg-white shadow-lg p-4 sm:p-6 md:p-10 text-center rounded-xl w-full max-w-4xl mx-auto relative overflow-hidden">
        {!isContentLoaded ? (
          <>
            {/* اسکلتون برای عنوان */}
            <div className="h-8 sm:h-10 md:h-12 w-3/4 sm:w-2/3 mx-auto bg-gray-300 rounded mb-2 sm:mb-3 md:mb-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-shimmer"></div>
            </div>
            
            {/* اسکلتون برای متن توضیح */}
            <div className="h-5 sm:h-6 md:h-7 w-full sm:w-5/6 mx-auto bg-gray-300 rounded mb-3 sm:mb-4 md:mb-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-shimmer"></div>
            </div>
            
            {/* اسکلتون برای دکمه */}
            <div className="inline-flex items-center gap-2 bg-gray-300 text-transparent px-8 sm:px-10 md:px-12 py-3 sm:py-4 md:py-4 rounded-lg relative overflow-hidden">
              <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
              <span className="text-sm sm:text-base">مشاهده محصولات</span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-shimmer"></div>
            </div>
          </>
        ) : (
          <>
            <motion.h1 
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 md:mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              فروشگاه چرخ خیاطی ارکیده
            </motion.h1>
            <motion.p 
              className="text-base sm:text-lg md:text-xl text-gray-600"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              فروش و تعمیرات تخصصی چرخ خیاطی و لوازم جانبی
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link
                href="/products"
                className="mt-2 sm:mt-3 md:mt-6 inline-flex items-center gap-1 
                bg-pink-600 text-white px-4 sm:px-5 md:px-6 py-1 sm:py-2 md:py-2 
                rounded-lg hover:bg-pink-700 transition text-sm sm:text-base cursor-pointer"
              >
                <Icon path={mdiArchiveEyeOutline} className="w-4 h-4 sm:w-5 sm:h-5" />
                مشاهده محصولات
              </Link>
            </motion.div>
          </>
        )}
      </div>

      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-12">
        <h2 className="text-xl sm:text-2xl md:text-2xl font-semibold text-gray-800 mb-2 sm:mb-4 md:mb-6 text-center">
          دسته‌بندی‌ها
        </h2>

        <motion.div
          className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {loading
            ? renderSkeletons()
            : error
            ? <p className="text-red-500">{error}</p>
            : categories.map((cat, index) => (
                <motion.div key={cat.id} variants={itemVariants} style={{ transformStyle: "preserve-3d" }}>
                <Link
                  href={`/categories/${cat.slug}`}
                  className="bg-white rounded-xl p-4 sm:p-6 md:p-8 
                  flex flex-col items-center justify-center 
                  h-60 sm:h-72 md:h-96 w-60 sm:w-72 md:w-96
                  transform transition-all duration-300 
                  hover:scale-105 hover:ring-2 hover:ring-gray-300 hover:ring-opacity-60
                  category-card relative overflow-hidden"
                >
                {/* یک div به عنوان wrapper برای افکت Shine اضافه کنید */}
                <div className="shine-overlay absolute inset-0 pointer-events-none"></div>
                  {/* width/height فقط برای نسبت و srcset هستند؛ اندازهٔ نمایش از CSS می‌آید و عمداً با ارتفاع CSS (224) یکی نیست تا next/image در dev هشدار «فقط یکی از width/height تغییر کرده» ندهد */}
                  <MotionAppImage
                    src={cat.image || "/img/placeholder.png"}
                    alt={cat.name}
                    width={384}
                    height={220}
                    sizes="(min-width: 768px) 320px, (min-width: 640px) 240px, 208px"
                    className="w-full h-36 sm:h-44 md:h-56 object-contain mb-2 sm:mb-3 md:mb-4"
                    initial={{ opacity: 0, y: 20, translateZ: -10 }}
                    animate={{ opacity: 1, y: 0, translateZ: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.1 }}
                  />
                  <motion.h3
                    className="text-lg sm:text-xl md:text-2xl font-medium text-gray-700 text-center"
                    initial={{ opacity: 0, y: 10, translateZ: -5 }}
                    animate={{ opacity: 1, y: 0, translateZ: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.15 }}
                  >
                  {cat.name}
                  </motion.h3>
                </Link>
                </motion.div>
              ))}
        </motion.div>
      </div>

      <style jsx global>{`
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  
  .animate-shimmer {
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  /* Shine effect for antivirus icon wrapper */
  .shine-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
  }

  /* Shine effect overlay */
  .shine-overlay::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(to right,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.6) 50%,
        rgba(255, 255, 255, 0) 100%);
    transform: skewX(-25deg);
    transition: none;
  }

  /* Shine animation on hover */
  .category-card:hover .shine-overlay::after {
    animation: shine-effect 1s forwards;
  }

  /* Shine animation keyframes */
  @keyframes shine-effect {
    0% {
      left: -100%;
    }
    100% {
      left: 200%;
    }
  }
`}</style>
    </div>
  );
}