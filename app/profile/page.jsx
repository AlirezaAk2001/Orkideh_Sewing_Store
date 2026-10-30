"use client";

import { LOGO_PNG } from "@/lib/siteLogo";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context";
import toast from "react-hot-toast";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

import Icon from "@mdi/react";
import { mdiAccountCircleOutline } from "@mdi/js";
import { mdiCardAccountDetailsOutline } from "@mdi/js";
import { mdiAccountBoxEditOutline } from "@mdi/js";
import { mdiEmailOutline } from '@mdi/js';
import { mdiAccountCogOutline } from '@mdi/js';
import { mdiLogoutVariant, mdiCloseCircleOutline } from '@mdi/js';
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { MapPinHouse, IterationCcw } from "lucide-react";
import OrdersPage from "@/app/orders/page";
import FavoritesPage from "@/app/favorites/page";
import SettingsPage from "@/app/settings/page";
import CartPage from "@/app/cart/page";
import AddressesPage from "@/app/addresses/page";

export default function ProfilePage() {
  const { currentUser, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = async () => {
    setLogoutDialogOpen(false);
    try {
      await logout();
      toast.success("شما با موفقیت از حساب خارج شدید.");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("در خروج از حساب مشکلی پیش آمد.");
    }
  };

  useEffect(() => {
    const name = sessionStorage.getItem("welcomeMessage");
    if (name) {
      toast.success(`خوش آمدید ${name} عزیز 🎉`, { position: "top-center" });
      sessionStorage.removeItem("welcomeMessage");
    }
  }, []);

  // مدیریت اندازه صفحه
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const tabContent = {
    orders: <OrdersPage />,
    cart: <CartPage />,
    favorites: <FavoritesPage />,
    settings: <SettingsPage />,
    addresses: <AddressesPage />,
  };

  // منتظر بارگذاری کامل
  if (loading || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Image
          src={LOGO_PNG}
          alt="در حال بارگذاری اطلاعات کاربر..."
          width={80}
          height={80}
          className="animate-spin object-contain"
          priority
        />
        <p className="mt-4 text-gray-500 text-sm font-medium animate-pulse">
          در حال بارگذاری اطلاعات کاربر...
        </p>
      </div>
    );
  }

  const tabs = [
    { key: "orders", icon: <ShoppingBagOutlinedIcon />, label: "سفارش‌های من" },
    { key: "addresses", icon: <MapPinHouse />, label: "آدرس‌های من" },
    { key: "cart", icon: <ShoppingCartOutlinedIcon />, label: "سبد خرید" },
    { key: "favorites", icon: <FavoriteBorderOutlinedIcon />, label: "علاقه‌مندی‌های من" },
    { key: "settings", icon: <Icon path={mdiAccountCogOutline} size={1} />, label: "تنظیمات حساب کاربری" },
  ];

  // منو و محتوای تب با flex کنار هم می‌نشینند (روی موبایل زیر هم)؛ پنل‌ها دیگر absolute نیستند، پس از لبهٔ صفحه بیرون نمی‌زنند
  return (
    <div className="relative isolate min-h-[calc(100vh-5rem)] w-full overflow-hidden px-4 py-6 md:py-10" dir="rtl">

      {/* بکگراند */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `url(/image/back-user.webp)`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(6px)",
          opacity: 0.45,
          transform: "scale(1.05)",
        }}
      />

      {/* دیالوگ تأیید خروج */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        dir="rtl"
        PaperProps={{
          sx: { borderRadius: "12px" },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "Vazirmatn, sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 1,
            backgroundColor: "#ef4444",
            color: "#ffffff",
            borderBottom: "3px solid",
            borderColor: "#b91c1c",
            px: 3,
            py: 1.5,
          }}
        >
          <Icon path={mdiLogoutVariant} size={1} color="#ffffff" />
          خروج از حساب
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "Vazirmatn, sans-serif", marginTop: "6px" }}>
            آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setLogoutDialogOpen(false)}
            sx={{ fontFamily: "Vazirmatn, sans-serif" }}
          >
            <Icon path={mdiCloseCircleOutline} size={1} />
            انصراف
          </Button>
          <Button
            onClick={confirmLogout}
            color="error"
            variant="contained"
            sx={{ fontFamily: "Vazirmatn, sans-serif" }}
          >
            <Icon path={mdiLogoutVariant} size={1} />
            بله، خروج
          </Button>
        </DialogActions>
      </Dialog>

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 md:flex-row md:items-start md:justify-center md:gap-6">
        {/* منو */}
        <motion.div
          layout="position"
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="w-full shrink-0 rounded-xl border border-white/40 bg-white/70 p-4 shadow-2xl backdrop-blur-md sm:p-6 md:w-80"
        >
          {/* پروفایل کاربر با نمایش نام کاربری */}
          <div className="mb-3 flex items-center gap-3 border-b pb-3">
            <Icon path={mdiAccountCircleOutline} size={1} className="shrink-0 text-gray-600" />
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-sm sm:text-base">
                <Icon path={mdiCardAccountDetailsOutline} size={0.8} className="shrink-0" />
                <span className="truncate">نام و نام خانوادگی: {currentUser?.name || "کاربر مهمان"}</span>
              </p>
              <p className="flex items-center gap-1 text-sm sm:text-base">
                <Icon path={mdiAccountBoxEditOutline} size={0.8} className="shrink-0" />
                <span className="truncate">نام کاربری: {currentUser?.username || "نام کاربری تنظیم نشده"}</span>
              </p>
              <p className="flex items-center gap-1 text-sm sm:text-base">
                <Icon path={mdiEmailOutline} size={0.8} className="shrink-0" />
                <span className="truncate">ایمیل: {currentUser?.email || "ایمیل ثبت نشده"}</span>
              </p>
            </div>
          </div>

          {/* روی موبایل شبکهٔ ۳ستونه (همهٔ گزینه‌ها بدون اسکرول افقی دیده می‌شوند)، روی دسکتاپ فهرست عمودی */}
          <nav className="grid grid-cols-3 gap-2 md:flex md:flex-col md:gap-3" aria-label="حساب کاربری">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                aria-current={activeTab === tab.key ? "page" : undefined}
                className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg p-2 text-center text-xs transition-all duration-300 md:flex-row md:justify-start md:gap-2 md:text-right md:text-base
              ${activeTab === tab.key
                    ? "bg-blue-100 font-semibold text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}

            <button
              onClick={handleLogout}
              className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg bg-red-50 p-2 text-center text-xs text-red-600 hover:bg-red-100 md:flex-row md:justify-start md:gap-2 md:text-right md:text-base"
            >
              <LogoutOutlinedIcon /> خروج از حساب
            </button>
          </nav>
        </motion.div>

        {/* محتوای تب‌ها */}
        <AnimatePresence mode="wait">
          {activeTab && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: isMobile ? 0 : -40, y: isMobile ? 20 : 0 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: isMobile ? 0 : -40, y: isMobile ? 20 : 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full min-w-0 rounded-xl border border-white/40 bg-white/70 p-4 shadow-2xl backdrop-blur-md sm:p-6 md:w-[34rem] lg:w-[40rem]"
            >
              {tabContent[activeTab]}
              <button
                onClick={() => setActiveTab(null)}
                className="mt-6 flex cursor-pointer items-center gap-1 rounded-lg bg-gray-200 px-3 py-2 text-sm transition-all hover:bg-gray-300 sm:px-4 sm:text-base"
              >
                <IterationCcw className="text-gray-700" />
                بازگشت
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
