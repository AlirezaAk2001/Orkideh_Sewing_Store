"use client";

import React from "react";
import { motion } from "framer-motion";
import { Settings, Mail, MailOpen, Phone, PhoneCall, RefreshCw } from "lucide-react";
import Icon from "@mdi/react";
import { mdiTimerCogOutline, mdiProgressWrench, mdiProgressQuestion, mdiFaceAgent } from "@mdi/js";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // فاصله زمانی بین نمایش هر آیتم (۲۰ میلی‌ثانیه)
      delayChildren: 0.3,   // تاخیر کلی قبل از شروع اولین آیتم
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -30 }, // حالت اولیه: مخفی و کمی سمت چپ
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { type: "spring", stiffness: 50 } // انیمیشن نرم
  }
};

export default function MaintenancePage() {
  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col lg:flex-row items-center justify-center p-4 sm:p-6 overflow-hidden">
      
      {/* بخش راست - سیستم چرخ‌دنده‌ها */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="lg:w-1/2 w-full h-1/2 lg:h-full flex items-center justify-center relative order-2 lg:order-1"
      >
        {/* سیستم چرخ‌دنده‌ها */}
        <div className="relative h-full w-full flex items-center justify-center">
          
          {/* چرخ‌دنده مرکزی بزرگ */}
          <motion.div
            className="absolute z-20"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <div className="relative">
              {/* حلقه درخشان دور چرخ‌دنده */}
              <motion.div
                className="absolute -inset-6 bg-gradient-to-r from-pink-400/20 to-purple-400/20 rounded-full blur-xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              {/* خود چرخ‌دنده */}
              <Settings className="w-48 h-48 lg:w-56 lg:h-56 text-pink-500 drop-shadow-2xl" />
              
              {/* نقطه مرکزی */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-pink-600 to-purple-600 rounded-full border-4 border-white shadow-xl" />
            </div>
          </motion.div>

          {/* چرخ‌دنده کوچک بالا سمت راست */}
          <motion.div
            className="absolute top-8 right-20 lg:right-28 z-10"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          >
            <Settings className="w-24 h-24 lg:w-28 lg:h-28 text-purple-400" />
          </motion.div>

          {/* چرخ‌دنده کوچک بالا سمت چپ */}
          <motion.div
            className="absolute top-8 left-20 lg:left-28 z-10"
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          >
            <Settings className="w-24 h-24 lg:w-28 lg:h-28 text-pink-400" />
          </motion.div>

          {/* چرخ‌دنده کوچک پایین سمت راست */}
          <motion.div
            className="absolute bottom-16 right-20 lg:right-28 z-10"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          >
            <Settings className="w-20 h-20 lg:w-24 lg:h-24 text-purple-300" />
          </motion.div>

          {/* چرخ‌دنده کوچک پایین سمت چپ */}
          <motion.div
            className="absolute bottom-16 left-20 lg:left-28 z-10"
            animate={{ rotate: -360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          >
            <Settings className="w-20 h-20 lg:w-24 lg:h-24 text-pink-300" />
          </motion.div>

          {/* چرخ‌دنده متوسط راست */}
          <motion.div
            className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-10"
            animate={{ rotate: -360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          >
            <Settings className="w-32 h-32 lg:w-36 lg:h-36 text-pink-400/80" />
          </motion.div>

          {/* چرخ‌دنده متوسط چپ */}
          <motion.div
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-10"
            animate={{ rotate: 360 }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          >
            <Settings className="w-32 h-32 lg:w-36 lg:h-36 text-purple-400/80" />
          </motion.div>
        </div>
      </motion.div>

      {/* بخش چپ - محتوای متنی و دکمه‌ها */}
      <motion.div
        variants={containerVariants} // اعمال تنظیمات کانتینر
        initial="hidden"
        animate="visible"
        className="lg:w-1/2 w-full flex flex-col items-center justify-center p-4 lg:p-8 order-1 lg:order-2"
      >
        
        {/* آیتم ۱: عنوان */}
        <motion.h1
          variants={itemVariants} // اعمال تنظیمات آیتم
          className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 text-center lg:text-right w-full flex gap-1"
        >
         <RefreshCw className="animate-spin w-9 h-9" />
         <span>در حال به روزرسانی سایت</span>
        </motion.h1>

        {/* آیتم ۲: توضیحات */}
        <motion.p
          variants={itemVariants}
          className="text-lg sm:text-xl md:text-xl lg:text-xl text-gray-600 mb-5 max-w-2xl leading-relaxed text-center lg:text-right w-full"
        >
          در حال انجام برخی بهبودها برای تجربه کاربری بهتر هستیم.
          <br className="hidden lg:block" />
          به زودی با امکانات جدید در خدمت شما خواهیم بود.
        </motion.p>

        {/* آیتم ۳: کارت اطلاع‌رسانی */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-lg shadow p-3 lg:p-4 w-full border border-gray-100 mt-1 mb-2"
          >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 lg:gap-16 mb-1">
            
            {/* زمان تخمینی */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <Icon path={mdiTimerCogOutline} className="w-7 h-7 text-pink-600" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-gray-800 text-sm lg:text-base">زمان تخمینی</h3>
                <p className="text-gray-600 text-sm lg:text-base">۲-۴ ساعت</p>
              </div>
            </div>

            {/* وضعیت */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon path={mdiProgressWrench} className="w-7 h-7 text-blue-600" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-gray-800 text-sm lg:text-base">وضعیت فعلی</h3>
                <p className="text-green-600 font-semibold text-sm lg:text-base">در حال پیشرفت</p>
              </div>
            </div>

            {/* درصد پیشرفت */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Icon path={mdiProgressQuestion} className="w-7 h-7 text-purple-600" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-gray-800 text-sm lg:text-base">پیشرفت</h3>
                <p className="text-gray-600 text-sm lg:text-base">۶۵٪</p>
              </div>
            </div>
          </div>

          {/* نوار پیشرفت */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>پیشرفت عملیات</span>
              <span>۶۵٪</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "65%" }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 1 }} // کمی تاخیر بیشتر برای پر شدن نوار
                className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* آیتم ۴: اطلاعات تماس */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-3 lg:p-4 border border-pink-100 w-full mt-1"
          >
          <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center justify-center lg:justify-start gap-1">
            <Icon path={mdiFaceAgent} className="w-7 h-7" />
            در صورت نیاز به پشتیبانی
          </h3>
          <p className="text-gray-600 mb-4 text-center lg:text-right text-sm font-medium rounded-xl">
            اگر نیاز فوری دارید یا سوالی درباره سفارشات جاری خود دارید،
            می‌توانید با تیم پشتیبانی در تماس باشید.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center rounded-xl lg:justify-end gap-4">
            
              {/* دکمه تماس تلفنی */}
              <a
                href="tel:+989024009061"
                className="phone-button relative inline-flex items-center justify-center gap-1 bg-pink-600 text-white px-3 py-1.5 rounded-md transition-all duration-300 ease-in-out hover:bg-pink-700 active:bg-pink-800 group w-full sm:w-auto"
                style={{ minWidth: "120px" }}
              >
                {/* امواج دایره‌ای */}
                <div className="absolute inset-0 rounded-md overflow-hidden">
                  {[0, 1].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 border border-pink-400 rounded-md"
                      initial={{ scale: 1, opacity: 0 }}
                      animate={{
                        scale: [1, 1.3, 1.6],
                        opacity: [0.5, 0.3, 0]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 0.5,
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </div>
                
                {/* آیکون‌ها */}
                <div className="relative z-10 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 group-hover:hidden group-active:hidden" />
                  <motion.div
                    className="hidden group-hover:block group-active:block"
                    animate={{
                      rotate: [0, -10, 10, -10, 10, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatDelay: 0.5
                    }}
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </motion.div>
                </div>
                
                <span className="relative z-10 font-medium text-xs transition-all duration-300">
                  تماس تلفنی
                </span>
              </a>

              {/* دکمه ارسال ایمیل */}
              <a
                href="mailto:poshtibani.orkideh@gmail.com" // اصلاح: اضافه کردن mailto
                className="email-button relative inline-flex items-center justify-center gap-1 bg-white text-pink-600 border border-pink-600 px-3 py-1.5 rounded-md transition-all duration-300 ease-in-out hover:bg-pink-50 hover:border-pink-700 hover:text-pink-700 active:bg-pink-100 active:border-pink-800 active:text-pink-800 group w-full sm:w-auto"
                style={{ minWidth: "120px" }}
              >
                {/* آیکون‌ها */}
                <div className="relative z-10 flex items-center justify-center">
                  <Mail className="w-3.5 h-3.5 group-hover:hidden group-active:hidden" />
                  <MailOpen className="w-3.5 h-3.5 hidden group-hover:block group-active:block" />
                </div>
                
                <span className="relative z-10 font-medium text-xs transition-all duration-300">
                  ارسال ایمیل
                </span>
                
                {/* افکت باز شدن پاکت */}
                <div className="absolute inset-0 rounded-md overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/20 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </a>
            </div>
        </motion.div>

        {/* آیتم ۵: پیام پایانی */}
        <motion.p
          variants={itemVariants}
          className="mt-6 lg:mt-5 text-gray-500 text-sm lg:text-base text-center lg:text-right w-full max-w-2xl"
        >
          از صبر و شکیبایی شما سپاسگزاریم.
          <br />
          <span className="text-pink-600 font-semibold">تیم فروشگاه چرخ خیاطی ارکیده</span>
        </motion.p>
      </motion.div>

      {/* استایل‌های انیمیشن */}
      <style jsx global>{`
        @keyframes phoneRing {
          0%, 100% { 
            transform: rotate(0deg) scale(1); 
          }
          10% { 
            transform: rotate(-10deg) scale(1.05); 
          }
          20% { 
            transform: rotate(10deg) scale(1.05); 
          }
          30% { 
            transform: rotate(-10deg) scale(1.05); 
          }
          40% { 
            transform: rotate(10deg) scale(1.05); 
          }
          50% { 
            transform: rotate(-10deg) scale(1.05); 
          }
          60% { 
            transform: rotate(10deg) scale(1.05); 
          }
          70% { 
            transform: rotate(0deg) scale(1); 
          }
        }
        
        @keyframes wavePulse {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-ring {
          animation: phoneRing 1.5s ease-in-out infinite;
        }
        
        .animate-wave {
          animation: wavePulse 1.5s ease-out infinite;
        }
        
        /* استایل‌های دکمه‌ها */
        .phone-button {
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);
        }
        
        .phone-button:hover {
          box-shadow: 0 6px 25px rgba(236, 72, 153, 0.4);
          transform: translateY(-2px);
        }
        
        .phone-button:active {
          transform: translateY(1px);
          box-shadow: 0 2px 10px rgba(236, 72, 153, 0.3);
        }
        
        .email-button {
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(236, 72, 153, 0.15);
        }
        
        .email-button:hover {
          box-shadow: 0 6px 25px rgba(236, 72, 153, 0.25);
          transform: translateY(-2px);
        }
        
        .email-button:active {
          transform: translateY(1px);
          box-shadow: 0 2px 10px rgba(236, 72, 153, 0.15);
        }
        
        /* ریسپانسیو */
        @media (max-width: 640px) {
          .phone-button,
          .email-button {
            min-width: 100%;
            width: 100%;
          }
        }
        
        @media (max-width: 1024px) {
          .lg\\:w-1\\/2 {
            width: 100%;
          }
          .lg\\:h-screen {
            height: 50vh;
          }
        }
      `}</style>
    </div>
  );
}