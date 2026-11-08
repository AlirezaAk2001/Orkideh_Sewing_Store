"use client";

import Link from "next/link";
import { Heart, Info, LogIn, LogOut } from "lucide-react";
import Icon from '@mdi/react';
import { mdiCartOutline } from '@mdi/js';
import { useRouter, usePathname } from "next/navigation";
import { useAuth, useFavorites, useCart } from "../../lib/context";
import { AnimatePresence, motion } from "framer-motion";
import { Tooltip } from 'react-tooltip';
import SiteLogo from "./SiteLogo";
import Avatar from "./Avatar";
import HeaderSearch from "./HeaderSearch";
import { useSiteLogo } from "./useSiteLogo";
import { useRiseKey } from "@/lib/motion";

// لوگوی هدر در همهٔ صفحه‌ها هست: لوگوی پیش‌فرض SVG انیمیشن‌دار است و لوگوی دیگر از optimizer می‌گذرد تا PNG سنگین برای یک دایرهٔ کوچک دانلود نشود
const MotionSiteLogo = motion.create(SiteLogo);

export default function Header() {
  const router = useRouter();
  const pathname = usePathname(); // دریافت مسیر فعلی
  const isMaintenance = pathname === '/maintenance'; // بررسی اینکه آیا در صفحه تعمیرات هستیم یا خیر
  const { currentUser, loading: authLoading, logout } = useAuth();
  const { favoritesCount, initialized: favInit } = useFavorites();
  const { cartCount, initialized: cartInit } = useCart();

  // لوگو منتظر شبکه نمی‌ماند (هوک مشترک با پنل ادمین): همان لحظهٔ اول لوگوی پیش‌فرض یا لوگوی بازدید قبلی دیده می‌شود
  const logoUrl = useSiteLogo();

  const loading = authLoading || !favInit || !cartInit;

  // با هر افزودنِ تازه به علاقه‌مندی‌ها قلب هدر یک جهش می‌کند (نه هنگام بارگذاری اولیه یا حذف)؛ جهش شمارنده‌ها با key خودشان است.
  // سبد خرید: آیکونش را flyToCart (lib/flyToCart.js) هنگام رسیدن تصویر محصول تکان می‌دهد
  const heartKey = useRiseKey(favoritesCount, !loading);

  // مدیریت کلیک کاربر
  const handleUserClick = () => {
    if (loading) return;
    if (!currentUser) {
      router.push("/auth");
    } else {
      if (currentUser.is_admin) {
        router.push("/admin");
      } else {
        router.push("/profile");
      }
    }
  };

  // مدیریت کلیک سبد خرید
  const handleCartClick = (e) => {
    if (loading) return;
    e.preventDefault();
    if (!currentUser) {
      router.push("/auth?redirect=/cart");
    } else {
      router.push("/cart");
    }
  };

  // مدیریت کلیک علاقه‌مندی‌ها
  const handleFavoritesClick = (e) => {
    if (loading) return;
    e.preventDefault();
    if (!currentUser) {
      router.push("/auth?redirect=/favorites");
    } else {
      router.push("/favorites");
    }
  };

  return (
    <>
      <header data-sb-top="page" className="bg-white shadow-md py-2 sm:py-3 px-2 sm:px-4 sticky top-0 z-50">
        <div className="container mx-auto flex flex-wrap sm:flex-nowrap items-center justify-between gap-y-2 sm:gap-4">
          {/* لوگو */}
          <Link href="/" className={`flex-shrink-0 ${isMaintenance ? 'pointer-events-none' : ''}`}>
            <MotionSiteLogo
              src={logoUrl}
              alt="لوگو"
              width={64}
              height={64}
              className="w-10 sm:w-16 h-10 sm:h-16 rounded-full object-cover border border-gray-900"
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              data-tooltip-id="logo-tooltip"
              data-tooltip-content="صفحه اصلی"
            />
          </Link>

          {/* جستجو: فیلد همیشه‌دیدنی؛ با کلیک کارت جستجو باز و پشتش مات می‌شود (HeaderSearch). روی گوشی ردیف دوم است و با اسکرول به پایین جمع می‌شود */}
          <HeaderSearch disabled={loading || isMaintenance} />

          {/* آیکون‌ها */}
          <div className={`order-2 sm:order-none flex items-center gap-1 sm:gap-4 text-gray-600 [&>a]:p-1.5 sm:[&>a]:p-0${isMaintenance ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
            {/* علاقه‌مندی‌ها */}
            <Link
              href={loading ? "#" : !currentUser ? "/auth?redirect=/favorites" : "/favorites"}
              className={`relative transition-colors ${loading
                ? "cursor-not-allowed opacity-50 pointer-events-none"
                : "hover:text-pink-600 cursor-pointer"
                }`}
              aria-label="علاقه‌مندی‌ها"
              data-tooltip-id="favorites-tooltip"
              data-tooltip-content={loading ? "در حال بارگذاری..." : "مشاهده علاقه‌مندی‌ها"}
            >
              <Heart key={heartKey} className={`w-7 sm:w-6 h-7 sm:h-6 ${loading ? "text-gray-400" : ""} ${heartKey ? "heart-pop" : ""}`} />
              {!loading && favoritesCount > 0 && (
                <span
                  key={favoritesCount}
                  className="badge-pop absolute -top-1 sm:-top-2 -right-1 sm:-right-2 text-white text-xs rounded-full w-4 sm:w-3 h-4 sm:h-3 flex items-center justify-center bg-red-500"
                  data-tooltip-id="favorites-count-tooltip"
                  data-tooltip-content={`${favoritesCount.toLocaleString("fa-IR")} محصول در علاقه‌مندی‌ها`}
                >
                  {favoritesCount.toLocaleString("fa-IR")}
                </span>
              )}
            </Link>

            {/* ورود / پروفایل */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-7 sm:w-6 h-7 sm:h-6 bg-gray-300 rounded-full animate-pulse"
                />
              ) : !currentUser ? (
                <motion.div key="login" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  <Link
                    href="/auth"
                    className={`bar-sheen flex items-center gap-1 px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-sm sm:text-sm ${loading
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed pointer-events-none"
                      : "bg-pink-600 text-white hover:bg-pink-700 cursor-pointer"
                      }`}
                    data-tooltip-id="login-tooltip"
                    data-tooltip-content={loading ? "در حال بارگذاری..." : "ورود به حساب کاربری یا ثبت‌نام"}
                  >
                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                    ورود / ثبت‌نام
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key="user"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2"
                >
                  {/* آواتار کاربر جای آیکون آدمک قبلی است (انتخاب‌شده در تنظیمات پنل: حرف اول، طرح آماده، عکس شخصی یا عکس گوگل) */}
                  <Link
                    href={currentUser.is_admin ? "/admin" : "/profile"}
                    className={`av-link ${loading ? "cursor-not-allowed opacity-50 pointer-events-none" : "cursor-pointer"}`}
                    aria-label="حساب کاربری"
                    data-tooltip-id="profile-tooltip"
                    data-tooltip-content={loading ? "در حال بارگذاری..." : currentUser.is_admin ? "پنل مدیریت" : "پروفایل کاربری"}
                  >
                    <Avatar value={currentUser.avatar} name={currentUser.name} className="[--s:34px] sm:[--s:38px]" />
                  </Link>
                  <button
                    onClick={() => !loading && logout("/")}
                    disabled={loading}
                    className={`flex items-center gap-1 px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-sm sm:text-sm ${loading
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-pink-600 text-white hover:bg-pink-700 cursor-pointer"
                      }`}
                    data-tooltip-id="logout-tooltip"
                    data-tooltip-content={loading ? "در حال بارگذاری..." : "خروج از حساب کاربری"}
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                    خروج
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* سبد خرید */}
            <Link
              href={loading ? "#" : !currentUser ? "/auth?redirect=/cart" : "/cart"}
              className={`relative transition-colors ${loading
                ? "cursor-not-allowed opacity-50 pointer-events-none"
                : "hover:text-pink-600 cursor-pointer"
                }`}
              aria-label="سبد خرید"
              data-tooltip-id="cart-tooltip"
              data-tooltip-content={loading ? "در حال بارگذاری..." : "مشاهده سبد خرید"}
            >
              <Icon path={mdiCartOutline} className={`w-7 sm:w-6 h-7 sm:h-6 ${loading ? "text-gray-400" : ""
                }`} />
              {/* جایگزین کد قبلی سبد خرید */}
              {!loading && cartCount > 0 && (
                <span
                  key={cartCount}
                  className="badge-pop absolute -top-1 sm:-top-2 -right-1 sm:-right-2 text-white text-xs rounded-full w-4 sm:w-3 h-4 sm:h-3 flex items-center justify-center bg-red-500"
                  data-tooltip-id="cart-count-tooltip"
                  data-tooltip-content={`${cartCount.toLocaleString("fa-IR")} محصول در سبد خرید`}
                >
                  {cartCount.toLocaleString("fa-IR")}
                </span>
              )}
            </Link>

            {/* درباره ما */}
            <Link
              href="/about"
              className={`transition-colors ${loading
                ? "cursor-not-allowed opacity-50 pointer-events-none"
                : "hover:text-pink-600 cursor-pointer"
                }`}
              aria-label="درباره ما"
              data-tooltip-id="about-tooltip"
              data-tooltip-content={loading ? "در حال بارگذاری..." : "درباره ما"}
            >
              <Info className={`w-7 sm:w-6 h-7 sm:h-6 ${loading ? "text-gray-400" : ""
                }`} />
            </Link>
          </div>
        </div>
      </header>

      {/* کامپوننت‌های Tooltip */}
      <Tooltip id="logo-tooltip" place="bottom" />
      <Tooltip id="favorites-tooltip" place="bottom" />
      <Tooltip id="favorites-count-tooltip" place="right" />
      <Tooltip id="login-tooltip" place="bottom" />
      <Tooltip id="profile-tooltip" place="bottom" />
      <Tooltip id="logout-tooltip" place="bottom" />
      <Tooltip id="cart-tooltip" place="bottom" />
      <Tooltip id="cart-count-tooltip" place="right" />
      <Tooltip id="about-tooltip" place="bottom" />

      {/* استایل کلی برای tooltip‌ها */}
      <style jsx global>{`
        .react-tooltip {
          z-index: 9999 !important;
          font-family: 'Vazirmatn', sans-serif !important;
          direction: rtl !important;
          text-align: right !important;
          font-size: 12px !important;
          padding: 6px 10px !important;
          border-radius: 6px !important;
          max-width: 250px !important;
          background-color: #1f2937 !important;
          color: #fff !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }
        .react-tooltip-arrow {
          display: none !important;
        }
      `}</style>
    </>
  );
}