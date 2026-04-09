"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Icon from '@mdi/react';
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import { ShoppingBag } from "lucide-react"
import { useAuth } from "@/lib/context";
import { 
  mdiAccountFileText, 
  mdiAccountTieOutline, 
  mdiCommentAccountOutline, 
  mdiPanoramaVariantOutline,
  mdiLogoutVariant,
  mdiCloseCircleOutline
} from '@mdi/js';
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from "@mui/material";

export default function AdminLayout({ children }) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // بررسی وضعیت loading از localStorage
  useEffect(() => {
    const checkLoading = () => {
      const loadingState = localStorage.getItem('adminLoading');
      setIsLoading(loadingState === 'true');
    };

    // بررسی اولیه
    checkLoading();

    // تنظیم interval برای بررسی تغییرات
    const interval = setInterval(checkLoading, 100);

    // گوش دادن به تغییرات storage (برای تب‌های مختلف)
    const handleStorageChange = () => {
      checkLoading();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const confirmLogout = () => {
    logout("/");
    toast.success("شما با موفقیت از حساب خارج شدید.", {
      duration: 2000,
      position: "top-center",
    });
    setLogoutDialogOpen(false);
  };

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  // لیست منوها برای تکرار کمتر
  const menuItems = [
    { href: "/admin/banners", icon: <Icon path={mdiPanoramaVariantOutline} size={1} />, label: "بنرها" },
    { href: "/admin/categories", icon: <CategoryOutlinedIcon className="w-5 h-5" />, label: "دسته‌بندی‌ها" },
    { href: "/admin/products", icon: <ShoppingBag className="w-5 h-5" />, label: "محصولات" },
    { href: "/admin/comments", icon: <Icon path={mdiCommentAccountOutline} size={1} />, label: "نظرات کاربران" },
    { href: "/admin/orders", icon: <Icon path={mdiAccountFileText} size={1} />, label: "سفارش‌های کاربران" },
  ];

  return (
    <>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 2000,
          style: {
            direction: "rtl",
            fontFamily: "Vazirmatn, sans-serif",
          },
        }}
      />
      
      <div className="flex min-h-screen bg-gray-100 overflow-hidden" dir="rtl">
        {/* Sidebar */}
        <aside
          className="bg-white shadow-md p-4 flex flex-col justify-between"
          style={{
            width: "205px",
            flexShrink: 0,
          }}
        >
          <div>
            <Link 
              href="/admin" 
              className={`text-xl font-bold mb-6 text-gray-800 block flex gap-1 ${
                isLoading ? 'pointer-events-none opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Icon path={mdiAccountTieOutline} size={1.2} />
              پنل مدیریت
            </Link>

            <nav className="flex flex-col gap-2 mt-2 text-gray-700">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={isLoading ? '#' : item.href}
                    className={`flex items-center gap-2 px-2 py-2 rounded transition-all duration-200 
                      ${isLoading ? 'pointer-events-none opacity-50 cursor-not-allowed' : ''}
                      ${
                        isActive
                          ? "bg-blue-100 text-blue-600 font-semibold"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {isLoading && !isActive && (
                      <svg 
                        className="animate-spin h-4 w-4 text-gray-400 mr-auto" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                  </Link>
                );
              })}

              <button
                onClick={handleLogout}
                disabled={isLoading}
                className={`mt-6 flex items-center gap-2 px-3 py-2 rounded transition-all duration-200 ${
                  isLoading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer'
                }`}
              >
                <LogoutOutlinedIcon fontSize="small" />
                <span>خروج از حساب</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

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
    </>
  );
}