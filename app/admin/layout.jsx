"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Icon from '@mdi/react';
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import { ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/context";
import {
  mdiAccountFileText,
  mdiAccountTieOutline,
  mdiCommentAccountOutline,
  mdiPanoramaVariantOutline,
  mdiLogoutVariant,
  mdiCloseCircleOutline,
  mdiChevronRightCircleOutline,
  mdiChevronLeftCircleOutline,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [tempDisableHover, setTempDisableHover] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('adminSidebarOpen');
    if (saved !== null) setIsSidebarOpen(saved === 'true');
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('adminSidebarOpen', String(next));
      return next;
    });
  };

  useEffect(() => {
    const checkLoading = () => {
      const loadingState = localStorage.getItem('adminLoading');
      setIsLoading(loadingState === 'true');
    };
    checkLoading();
    const interval = setInterval(checkLoading, 100);
    const handleStorageChange = () => checkLoading();
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

      <div className="relative flex h-screen overflow-hidden" dir="rtl">
        {/* بکگراند */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(/image/back-admin.png)`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(6px)",
            opacity: 0.45,
            transform: "scale(1.05)",
          }}
        />

        <aside
          className="bg-white/70 backdrop-blur-md border border-white/40 shadow-2xl z-10 flex flex-col justify-between transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0"
          style={{ width: isSidebarOpen ? "205px" : "60px" }}
        >
          <div>
            <div className="flex items-center justify-between p-4 border-b border-gray-100 min-h-[56px]">
              <Link
                href="/admin"
                className={`flex items-center gap-1 text-xl font-bold text-gray-800 transition-all duration-200 overflow-hidden whitespace-nowrap
                  ${isLoading ? 'pointer-events-none opacity-50 cursor-not-allowed' : ''}
                  ${isSidebarOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}
              >
                <Icon path={mdiAccountTieOutline} size={1.2} />
                <span>پنل مدیریت</span>
              </Link>

              {/* دکمه باز/بستن منو - غیرفعال در حالت لودینگ */}
              <button
                onClick={() => {
                  toggleSidebar();
                  setTempDisableHover(true);
                  setTimeout(() => setTempDisableHover(false), 400);
                }}
                onMouseLeave={() => setTempDisableHover(false)}
                className={`pin-btn p-1.5 rounded-md flex-shrink-0 mt-3 ${isLoading ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''
                  }`}
                title={isSidebarOpen ? "بستن منو" : "باز کردن منو"}
              >
                <div className={`icon-wrapper ${isSidebarOpen ? 'pinned' : ''} ${tempDisableHover ? 'disable-hover' : ''}`}>
                  {isSidebarOpen
                    ? <Icon path={mdiChevronRightCircleOutline} size={1} />
                    : <Icon path={mdiChevronLeftCircleOutline} size={1} />
                  }
                </div>
              </button>
            </div>

            {!isSidebarOpen && (
              <div className="flex justify-center py-3">
                <Link
                  href={isLoading ? '#' : "/admin"}
                  className={`text-gray-700 ${isLoading ? 'pointer-events-none opacity-50 cursor-not-allowed' : ''}`}
                  title="پنل مدیریت"
                >
                  <Icon path={mdiAccountTieOutline} size={1.2} />
                </Link>
              </div>
            )}

            <nav className="flex flex-col gap-2 mt-2 px-2 text-gray-700">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={isLoading ? '#' : item.href}
                    title={!isSidebarOpen ? item.label : undefined}
                    className={`flex items-center gap-2 px-2 py-2 rounded transition-all duration-200 
                      ${isSidebarOpen ? '' : 'justify-center'}
                      ${isLoading ? 'pointer-events-none opacity-50 cursor-not-allowed' : ''}
                      ${isActive
                        ? "bg-blue-100 text-blue-600 font-semibold"
                        : "hover:bg-gray-100 text-gray-700"
                      }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>

                    {isSidebarOpen && (
                      <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
                    )}

                    {isLoading && !isActive && isSidebarOpen && (
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
                title={!isSidebarOpen ? "خروج از حساب" : undefined}
                className={`mt-6 flex items-center gap-2 px-3 py-2 rounded transition-all duration-300
                ${!isSidebarOpen ? 'justify-center' : ''}
                ${isLoading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer'
                  }`}
              >
                <LogoutOutlinedIcon fontSize="small" className="flex-shrink-0" />

                <span
                  className="whitespace-nowrap overflow-hidden transition-all duration-300"
                  style={{
                    maxWidth: isSidebarOpen ? '200px' : '0px',
                    opacity: isSidebarOpen ? 1 : 0,
                  }}
                >
                  خروج از حساب
                </span>
              </button>
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-4 overflow-y-auto overflow-x-hidden z-10">
          {children}
        </main>
      </div>

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

      <style jsx>{`
        .pin-btn {
          background: transparent;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .pin-btn .icon-wrapper {
          display: inline-flex;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
          color 0.3s ease;
          // color: #009688;
        }
        .pin-btn .icon-wrapper.pinned {
          transform: rotate(0deg);
        }
        .pin-btn:hover .icon-wrapper:not(.disable-hover) {
          // color: #009688;
          transform: scale(1.2);
        }
        .pin-btn:hover .icon-wrapper.disable-hover {
          transform: none !important;
          color: #9e9e9e !important;
        }
        .pin-btn:hover .icon-wrapper.pinned:not(.disable-hover) {
          transform: rotate(180deg) scale(1.2);
        }
        .pin-btn:hover .icon-wrapper:not(.pinned):not(.disable-hover) {
          transform: rotate(180deg) scale(1.2);
        }
      `}</style>
    </>
  );
}