"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Heart, User2, Info, LogIn, LogOut, Search } from "lucide-react";
import Icon from '@mdi/react';
import { mdiCartOutline } from '@mdi/js';
import { useRouter, usePathname } from "next/navigation";
import { useAuth, useFavorites, useCart } from "../../lib/context";
import { AnimatePresence, motion } from "framer-motion";
import { Tooltip } from 'react-tooltip';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname(); // دریافت مسیر فعلی
  const isMaintenance = pathname === '/maintenance'; // بررسی اینکه آیا در صفحه تعمیرات هستیم یا خیر
  const { currentUser, loading: authLoading, logout } = useAuth();
  const { favoritesCount, initialized: favInit } = useFavorites();
  const { cartCount, initialized: cartInit } = useCart();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoLoaded, setLogoLoaded] = useState(false); // ← اضافه کن
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const searchInputRef = useRef(null);

  const loading = authLoading || !favInit || !cartInit || !logoLoaded;

  // لود لوگو
  useEffect(() => {
    fetch("/api/background")
      .then((resp) => resp.json())
      .then((data) => {
        setLogoUrl(data.data || "/img/default-logo.png");
        setLogoLoaded(true); // ← اضافه کن
      })
      .catch((err) => {
        console.error("خطا در لود لوگو:", err);
        setLogoLoaded(true); // ← حتی در خطا هم true کن تا گیر نکنه
      });
  }, []);

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

  // جستجو
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts([]);
      setIsSearchOpen(false);
      setIsSearching(false);
      setShowSkeleton(false);
      return;
    }

    // شروع جستجو
    setIsSearching(true);
    setShowSkeleton(true);
    setIsSearchOpen(true);

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setFilteredProducts(data || []);
      } catch (error) {
        console.error("خطا در جستجو:", error);
        setFilteredProducts([]);
      } finally {
        // پایان جستجو
        setIsSearching(false);
        setShowSkeleton(false);
      }
    }, 1000);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // کامپوننت اسکلتون لودینگ
  const SkeletonLoader = () => {
    return Array.from({ length: 3 }).map((_, index) => (
      <div
        key={index}
        className="p-2 flex items-start gap-2 animate-pulse"
      >
        {/* اسکلتون عکس محصول */}
        <div className="w-8 h-8 bg-gray-200 rounded mt-1"></div>

        <div className="flex flex-col flex-1 gap-2">
          {/* اسکلتون عنوان */}
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          {/* اسکلتون دسته‌بندی */}
          <div className="h-3 bg-gray-100 rounded w-1/2"></div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {/* اسکلتون قیمت */}
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          {/* اسکلتون قیمت اصلی */}
          <div className="h-3 bg-gray-100 rounded w-12"></div>
        </div>
      </div>
    ));
  };

  return (
    <>
      <header className="bg-white shadow-md py-2 sm:py-3 px-2 sm:px-4 sticky top-0 z-50">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          {/* لوگو */}
          <Link href="/" className={`flex-shrink-0 ${isMaintenance ? 'pointer-events-none' : ''}`}>
            <AnimatePresence>
              {logoUrl ? (
                <motion.img
                  src={logoUrl}
                  alt="لوگو"
                  className="w-12 sm:w-16 h-12 sm:h-16 rounded-full object-cover border"
                  initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  data-tooltip-id="logo-tooltip"
                  data-tooltip-content="صفحه اصلی"
                />
              ) : (
                <motion.div
                  className="w-12 sm:w-16 h-12 sm:h-16 bg-gray-300 rounded-full flex items-center justify-center text-xs"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: 1,
                    scale: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut",
                  }}
                  data-tooltip-id="logo-tooltip"
                  data-tooltip-content="صفحه اصلی"
                ></motion.div>
              )}
            </AnimatePresence>
          </Link>

          {/* جستجو */}
          <div className="relative flex-1 w-full sm:w-auto mx-0 sm:mx-6">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                className={`w-full pr-2 sm:pr-4 pl-10 sm:pl-12 py-1 sm:py-2 border rounded-lg focus:outline-none text-right text-sm sm:text-base bg-transparent relative z-10 ${loading
                  ? "border-gray-200 cursor-not-allowed opacity-60"
                  : "border-gray-300 focus:ring-2 focus:ring-pink-500"
                  }`}
                value={searchQuery}
                onChange={(e) => !loading && setSearchQuery(e.target.value)}
                placeholder="جستجو در فروشگاه چرخ خیاطی ارکیده"
                disabled={loading || isMaintenance}
              />

              {/* آیکون جستجو با انیمیشن سه‌بعدی */}
              <motion.div
                className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-20"
                animate={isSearching ? {
                  scale: [1, 1.2, 1],
                  rotateY: [0, 180, 360],
                } : {
                  scale: 1,
                  rotateY: 0,
                  boxShadow: "0px 0px 0px rgba(0,0,0,0)"
                }}
                transition={isSearching ? {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {
                  duration: 0.3
                }}
              >
                <Search className={`w-4 h-4 sm:w-5 sm:h-5 ${isSearching ? 'text-pink-500' :
                  loading ? 'text-gray-300' : 'text-gray-400'
                  }`} />
              </motion.div>
            </div>

            <AnimatePresence>
              {(isSearchOpen && searchQuery.trim() !== "") && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-10"
                >
                  {/* نمایش اسکلتون در حین جستجو */}
                  {showSkeleton ? (
                    <SkeletonLoader />
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-3 text-center text-gray-500 text-sm">
                      محصول مورد نظر یافت نشد.
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`p-2 flex items-start gap-2 hover:bg-gray-50 transition-colors ${loading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                          }`}
                        onClick={() => {
                          if (loading) return;
                          router.push(`/products/${product.slug}`);
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-8 h-8 object-cover rounded mt-1"
                          />
                        )}
                        <div className="flex flex-col text-sm flex-1">
                          <span className="font-medium">{product.name}</span>
                          {product.Category?.name && (
                            <span className="text-xs text-gray-500">
                              در دسته {product.Category.name}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          {product.finalPrice && product.finalPrice < product.price ? (
                            <>
                              <span className="text-red-500 font-semibold text-xs block">
                                {product.finalPrice.toLocaleString("fa-IR")} تومان
                              </span>
                              <span className="text-gray-400 line-through text-[11px] block">
                                {product.price.toLocaleString("fa-IR")}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-700 font-semibold text-xs">
                              {product.price.toLocaleString("fa-IR")} تومان
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* آیکون‌ها */}
          <div className={`flex items-center gap-3 sm:gap-4 text-gray-600 ${isMaintenance ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
            {/* علاقه‌مندی‌ها */}
            <button
              onClick={handleFavoritesClick}
              disabled={loading}
              className={`relative transition-colors ${loading
                ? "cursor-not-allowed opacity-50"
                : "hover:text-pink-600 cursor-pointer"
                }`}
              data-tooltip-id="favorites-tooltip"
              data-tooltip-content={loading ? "در حال بارگذاری..." : "مشاهده علاقه‌مندی‌ها"}
            >
              <Heart className={`w-7 sm:w-6 h-7 sm:h-6 ${loading ? "text-gray-400" : ""
                }`} />
              {favoritesCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -top-1 sm:-top-2 -right-1 sm:-right-2 text-white text-xs rounded-full w-4 sm:w-3 h-4 sm:h-3 flex items-center justify-center ${loading ? "bg-gray-400" : "bg-red-500"
                    }`}
                  data-tooltip-id="favorites-count-tooltip"
                  data-tooltip-content={`${favoritesCount.toLocaleString("fa-IR")} محصول در علاقه‌مندی‌ها`}
                >
                  {favoritesCount.toLocaleString("fa-IR")}
                </motion.span>
              )}
            </button>

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
                <motion.button
                  key="login"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={handleUserClick}
                  disabled={loading}
                  className={`flex items-center gap-1 px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-sm sm:text-sm transition-transform ${loading
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-pink-600 text-white hover:bg-pink-700 cursor-pointer"
                    }`}
                  data-tooltip-id="login-tooltip"
                  data-tooltip-content={loading ? "در حال بارگذاری..." : "ورود به حساب کاربری یا ثبت‌نام"}
                >
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                  ورود / ثبت‌نام
                </motion.button>
              ) : (
                <motion.div
                  key="user"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2"
                >
                  <button
                    onClick={handleUserClick}
                    disabled={loading}
                    className={`transition-colors ${loading
                      ? "cursor-not-allowed opacity-50"
                      : "hover:text-pink-600 cursor-pointer"
                      }`}
                    data-tooltip-id="profile-tooltip"
                    data-tooltip-content={loading ? "در حال بارگذاری..." : currentUser.is_admin ? "پنل مدیریت" : "پروفایل کاربری"}
                  >
                    <User2 className={`w-7 sm:w-6 h-7 sm:h-6 ${loading ? "text-gray-400" : ""
                      }`} />
                  </button>
                  <button
                    onClick={() => !loading && logout("/")}
                    disabled={loading}
                    className={`flex items-center gap-1 px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-sm sm:text-sm transition-transform ${loading
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
            <button
              onClick={handleCartClick}
              disabled={loading}
              className={`relative transition-colors ${loading
                ? "cursor-not-allowed opacity-50"
                : "hover:text-pink-600 cursor-pointer"
                }`}
              data-tooltip-id="cart-tooltip"
              data-tooltip-content={loading ? "در حال بارگذاری..." : "مشاهده سبد خرید"}
            >
              <Icon path={mdiCartOutline} className={`w-7 sm:w-6 h-7 sm:h-6 ${loading ? "text-gray-400" : ""
                }`} />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -top-1 sm:-top-2 -right-1 sm:-right-2 text-white text-xs rounded-full w-4 sm:w-3 h-4 sm:h-3 flex items-center justify-center ${loading ? "bg-gray-400" : "bg-red-500"
                    }`}
                  data-tooltip-id="cart-count-tooltip"
                  data-tooltip-content={`${cartCount.toLocaleString("fa-IR")} محصول در سبد خرید`}
                >
                  {cartCount.toLocaleString("fa-IR")}
                </motion.span>
              )}
            </button>

            {/* درباره ما */}
            <Link
              href="/about"
              className={`transition-colors ${loading
                ? "cursor-not-allowed opacity-50 pointer-events-none"
                : "hover:text-pink-600 cursor-pointer"
                }`}
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