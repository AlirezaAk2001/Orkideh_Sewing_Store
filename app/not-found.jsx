"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Icon from "@mdi/react";
import { mdiStoreOutline } from "@mdi/js";
import GestureIcon from '@mui/icons-material/Gesture'; // آیکون نخ آشفته

// سوزن خیاطی (آیکون mdiNeedle سرنگ پزشکی است، نه سوزن خیاطی)؛ با thread یک نخ از ناکِ سوزن آویزان می‌شود
function SewingNeedle({ className, thread = false }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 43 L35.5 12.5" strokeWidth="2.4" />
      <ellipse cx="39.2" cy="8.8" rx="2" ry="5.2" transform="rotate(45 39.2 8.8)" strokeWidth="2" />
      {thread && <path d="M41.8 6.2 C 46 12, 36 16, 38 22 S 28 30, 30 36" strokeWidth="1.6" className="text-pink-400" stroke="currentColor" />}
    </svg>
  );
}

export default function NotFound() {
  // مراحل انیمیشن (روی هم کمتر از ۲ ثانیه؛ کسی که «کاهش حرکت» را روشن کرده مستقیم کارت را می‌بیند):
  // 1: چرخش نخ دور سوزن (Orbit)
  // 2: پاره شدن و افتادن (Snap)
  // 3: نمایش محتوا (Final)
  const [stage, setStage] = useState(1);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      setStage(3);
      return;
    }
    if (stage === 1) {
      const timer = setTimeout(() => setStage(2), 900);
      return () => clearTimeout(timer);
    }
    if (stage === 2) {
      const timer = setTimeout(() => setStage(3), 500);
      return () => clearTimeout(timer);
    }
  }, [stage, reduceMotion]);

  // --- تنظیمات انیمیشن کارت نهایی ---
  const containerVariants = {
    hidden: {
      opacity: 0,
      scale: 0.3 // شروع از سایز خیلی کوچک (مثل یک حباب کوچک)
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring", // استفاده از فیزیک فنر
        stiffness: 260, // سختی فنر (هرچه بیشتر، حرکت سریع‌تر و محکم‌تر)
        damping: 20,    // میرایی (هرچه کمتر، لرزش و پرش بیشتر)
        delay: 0.1      // تاخیر کوتاه برای هماهنگی بهتر با پایان مرحله قبل
      }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // اگر هنوز به مرحله نهایی نرسیده‌ایم، انیمیشن‌ها را نمایش بده
  if (stage < 3) {
    return (
      <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center overflow-hidden fixed inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key="needle-thread-anim"
            className="relative w-64 h-64 flex items-center justify-center"
          >
            {/* سوزن */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={
                stage === 2
                  ? { rotate: 180, y: 100, opacity: 0.5 } // حالت افتادن
                  : { opacity: 1, scale: 1, rotate: 0 }   // حالت ثابت
              }
              transition={{ duration: 0.4 }}
              className="text-gray-700 z-10"
            >
              <SewingNeedle className="h-28 w-28" />
            </motion.div>

            {/* نخ (Gesture Icon) که دور سوزن می‌چرخد */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={
                stage === 2
                  ? { y: -300, opacity: 0, scale: 0.5 } // حالت پاره شدن به سمت بالا
                  : { opacity: 1, rotate: 360 }         // حالت چرخش
              }
              transition={
                stage === 2
                  ? { duration: 0.5, ease: "easeIn" } // سرعت پاره شدن
                  : { duration: 1.2, repeat: Infinity, ease: "linear" } // سرعت چرخش
              }
            >
              {/* آیکون کمی از مرکز فاصله دارد تا شعاع چرخش ایجاد شود */}
              <div className="transform translate-x-12 -translate-y-12 text-pink-500">
                 <GestureIcon style={{ fontSize: 60 }} />
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // --- مرحله ۳: نمایش کارت نهایی ---
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-6 text-center">

      <motion.div
        className="bg-white shadow-xl p-8 sm:p-12 rounded-2xl w-full max-w-lg mx-auto relative overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* المان تزئینی پس‌زمینه */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 to-pink-600"></div>

        {/* آیکون بالای کارت - سوزنِ ثابت‌شده با نخ آویزان */}
        <motion.div
          className="mx-auto bg-pink-50 w-24 h-24 rounded-full flex items-center justify-center mb-6 text-pink-600"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
        >
           <SewingNeedle className="h-14 w-14" thread />
        </motion.div>

        {/* عدد 404 بزرگ */}
        <motion.h1
          className="text-6xl sm:text-8xl font-black text-gray-800 mb-2"
          variants={itemVariants}
        >
          404
        </motion.h1>

        {/* پیام با استعاره خیاطی */}
        <motion.h2
          className="text-xl sm:text-2xl font-bold text-gray-700 mb-4"
          variants={itemVariants}
        >
          نخ این صفحه پاره شده است!
        </motion.h2>

        <motion.p
          className="text-gray-500 mb-8 leading-relaxed"
          variants={itemVariants}
        >
          متأسفانه صفحه‌ای که به دنبال آن می‌گردید پیدا نشد. ممکن است آدرس اشتباه باشد یا صفحه جابجا شده باشد.
        </motion.p>

        {/* دکمه بازگشت */}
        <motion.div variants={itemVariants}>
          <Link
            href="/"
            className="btn-3d inline-flex items-center gap-1 bg-pink-600 text-white px-8 py-3 rounded-lg hover:bg-pink-700 shadow-lg"
          >
            <Icon path={mdiStoreOutline} size={1} />
            <span>بازگشت به فروشگاه</span>
          </Link>
        </motion.div>

      </motion.div>

     {/* فوتر کوچک با افکت حبابی */}
    <motion.p
        className="mt-8 text-pink-600 text-sm font-medium"
        initial={{ opacity: 0, scale: 0.5 }} // شروع از اندازه کوچک‌تر
        animate={{ opacity: 1, scale: 1 }}    // رسیدن به اندازه اصلی
        transition={{
            delay: 0.5,          // کمی دیرتر از کارت ظاهر شود تا تداخل بصری نداشته باشند
            type: "spring",      // حالت فنری (حبابی)
            stiffness: 200,      // نرمی حرکت
            damping: 15          // کنترل لرزش نهایی
        }}
    >
     فروشگاه چرخ خیاطی ارکیده
    </motion.p>
    </div>
  );
}
