"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context";
import toast, { Toaster } from "react-hot-toast";
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

    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("resize", handleResize);
      document.body.style.overflow = "auto";
    };
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
          src="/image/logo.png"
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

  return (
    <div className="relative flex flex-col md:flex-row justify-center items-center md:items-start h-screen w-full overflow-hidden" dir="rtl">

      {/* بکگراند */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(/image/back-user.png)`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(6px)",
          opacity: 0.45,
          transform: "scale(1.05)",
        }}
      />
      <Toaster />

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

      {/* منو */}
      <motion.div
        animate={
          activeTab && !isMobile
            ? { x: "40%", y: "-10%", scale: 0.9, opacity: 0.9 }
            : { x: "0%", y: "0%", scale: 1, opacity: 1 }
        }
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className={`z-20 backdrop-blur-md bg-white/70 border border-white/40 shadow-2xl rounded-xl p-4 sm:p-6 md:p-8 
        ${isMobile ? "relative w-full max-h-[40%]" : "absolute w-[95%] sm:w-[80%] md:w-[40%] max-h-[90%]"} 
        overflow-y-auto`}
      >
        {/* پروفایل کاربر با نمایش نام کاربری */}
        <div className="flex items-center gap-3 border-b pb-3 mb-3">
          <Icon path={mdiAccountCircleOutline} size={1} className="text-gray-600" />
          <div>
            <p className="text-sm sm:text-base flex items-center gap-1">
              <Icon path={mdiCardAccountDetailsOutline} size={0.8} />
              نام و نام خانوادگی: {currentUser?.name || "کاربر مهمان"}
            </p>
            <p className="text-sm sm:text-base flex items-center gap-1">
              <Icon path={mdiAccountBoxEditOutline} size={0.8} />
              نام کاربری: {currentUser?.username || "نام کاربری تنظیم نشده"}
            </p>
            <p className="text-sm sm:text-base flex items-center gap-1">
              <Icon path={mdiEmailOutline} size={0.8} />
              ایمیل: {currentUser?.email || "ایمیل ثبت نشده"}
            </p>
          </div>
        </div>

        <nav className={`${isMobile ? "flex-row justify-around" : "flex-col space-y-2 sm:space-y-3"} flex`}>
          {[
            { key: "orders", icon: <ShoppingBagOutlinedIcon />, label: "سفارش‌های من" },
            { key: "addresses", icon: <MapPinHouse />, label: "آدرس‌های من" },
            { key: "cart", icon: <ShoppingCartOutlinedIcon />, label: "سبد خرید" },
            { key: "favorites", icon: <FavoriteBorderOutlinedIcon />, label: "علاقه‌مندی‌های من" },
            { key: "settings", icon: <Icon path={mdiAccountCogOutline} size={1} />, label: "تنظیمات حساب کاربری" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 p-2 rounded-lg text-sm sm:text-base cursor-pointer transition-all duration-300 
            ${activeTab === tab.key
                  ? "bg-blue-100 text-blue-600 font-semibold"
                  : "hover:bg-gray-100 text-gray-700"
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg text-sm sm:text-base cursor-pointer"
          >
            <LogoutOutlinedIcon /> خروج از حساب
          </button>
        </nav>
      </motion.div>

      {/* محتوای تب‌ها */}
      <AnimatePresence>
        {activeTab && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: isMobile ? 0 : "-100%" }}
            animate={{ opacity: 1, x: isMobile ? 0 : "-5%" }}
            exit={{ opacity: 0, x: isMobile ? 0 : "-100%" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className={`${isMobile ? "relative mt-4 w-full flex-1" : "absolute left-0 z-10 w-[95%] sm:w-[80%] md:w-[40%] max-h-[90%]"
              } backdrop-blur-md bg-white/70 border border-white/40 shadow-2xl rounded-xl p-4 sm:p-6 md:p-8 overflow-y-auto`}
          >
            {tabContent[activeTab]}
            <button
              onClick={() => setActiveTab(null)}
              className="mt-6 flex items-center gap-1 px-3 sm:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm sm:text-base cursor-pointer transition-all"
            >
              <IterationCcw className="text-gray-700" />
              بازگشت
            </button>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}