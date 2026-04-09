"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@mdi/react";
import { mdiNeedle, mdiStoreOutline } from "@mdi/js";
import { Spool } from "lucide-react"; // آیکون قرقره
import GestureIcon from '@mui/icons-material/Gesture'; // آیکون نخ آشفته

export default function NotFound() {
  // مراحل انیمیشن: 
  // 0: قرقره (Spool)
  // 1: چرخش نخ دور سوزن (Orbit)
  // 2: پاره شدن و افتادن (Snap)
  // 3: نمایش محتوا (Final)
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // تایمر برای مرحله چرخش نخ دور سوزن
    if (stage === 1) {
      const timer = setTimeout(() => {
        setStage(2); // رفتن به مرحله پاره شدن
      }, 2500); // مدت زمان چرخش نخ دور سوزن
      return () => clearTimeout(timer);
    }
    // تایمر برای نمایش کارت نهایی بعد از پاره شدن نخ
    if (stage === 2) {
      const timer = setTimeout(() => {
        setStage(3);
      }, 800); 
      return () => clearTimeout(timer);
    }
  }, [stage]);

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
          
          {/* مرحله ۱: قرقره (Spool) */}
          {stage === 0 && (
            <motion.div
              key="spool-anim"
              initial={{ scale: 0, opacity: 0, rotate: 0 }}
              animate={{ scale: 2, opacity: 1, rotate: 360 }}
              exit={{ scale: 0, opacity: 0, rotate: 720 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              onAnimationComplete={() => setStage(1)}
              className="text-pink-600"
            >
              <Spool size={64} strokeWidth={1.5} />
            </motion.div>
          )}

          {/* مرحله ۲ و ۳: سوزن و نخ (Orbit & Snap) */}
          {(stage === 1 || stage === 2) && (
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
                transition={{ duration: 0.5 }}
                className="text-gray-700 z-10"
              >
                <Icon path={mdiNeedle} size={4} className="transform -rotate-45" />
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
                    ? { duration: 1.4, ease: "easeIn" } // سرعت پاره شدن
                    : { duration: 2, repeat: Infinity, ease: "linear" } // سرعت چرخش
                }
              >
                {/* آیکون کمی از مرکز فاصله دارد تا شعاع چرخش ایجاد شود */}
                <div className="transform translate-x-12 -translate-y-12 text-pink-500">
                   <GestureIcon style={{ fontSize: 60 }} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- مرحله ۴: نمایش کارت نهایی (کد اصلی شما) ---
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

        {/* آیکون بالای کارت - اینجا دوباره سوزن را نمایش می‌دهیم که ثابت شده */}
        <motion.div 
          className="mx-auto bg-pink-50 w-24 h-24 rounded-full flex items-center justify-center mb-6 text-pink-600"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
        >
           <Icon path={mdiNeedle} size={3} className="transform -rotate-45" />
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
            className="inline-flex items-center gap-1 bg-pink-600 text-white px-8 py-3 rounded-lg hover:bg-pink-700 transition-colors shadow-lg hover:shadow-pink-200"
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