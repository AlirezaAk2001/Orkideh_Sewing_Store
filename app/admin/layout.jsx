"use client";

import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/context";
import { useState, useEffect, useCallback, useRef } from "react";
import { DesktopSidebar, MobileDrawer } from "./_shell/AdminSidebar";
import AdminTopBar from "./_shell/AdminTopBar";
import BrandMark from "./_shell/BrandMark";
import ConfirmDialog from "./_shell/ConfirmDialog";
import { findNavItem } from "./_shell/nav";

export default function AdminLayout({ children }) {
  const { currentUser, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdminUser = Boolean(currentUser?.is_admin);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButton = useRef(null);

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

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // با هر رفتن به صفحهٔ دیگر (کلیک روی منو، دکمهٔ برگشت مرورگر) کشوی موبایل بسته می‌شود
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

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

  // گارد ادمین: فقط برای تجربهٔ کاربری است؛ امنیت واقعی را خود APIها تأمین می‌کنند
  useEffect(() => {
    if (authLoading || isAdminUser || isLoggingOut) return;
    toast.error(currentUser ? "شما دسترسی ادمین ندارید" : "لطفاً ابتدا وارد شوید", {
      id: "admin-guard",
      position: "top-center",
    });
    router.replace(currentUser ? "/" : "/auth");
  }, [authLoading, isAdminUser, isLoggingOut, currentUser, router]);

  const confirmLogout = () => {
    setIsLoggingOut(true); // تا گارد بالا وسط خروج، ریدایرکت دومی نکند
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

  // تا مشخص نشدن دسترسی، پنل نمایش داده نمی‌شود (غیرادمین پنل را حتی لحظه‌ای نمی‌بیند)
  if (!isLoggingOut && (authLoading || !isAdminUser)) {
    return (
      <div className="admin-canvas relative grid min-h-dvh place-items-center" dir="rtl" role="status">
        <div className="relative z-10 flex flex-col items-center gap-5">
          <span className="relative grid h-20 w-20 place-items-center">
            <span aria-hidden="true" className="absolute inset-0 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600 motion-reduce:animate-none" />
            <BrandMark className="h-12 w-12" px={48} />
          </span>
          <p className="animate-pulse text-sm font-medium text-gray-500 motion-reduce:animate-none">در حال بررسی دسترسی...</p>
        </div>
      </div>
    );
  }

  const shell = { busy: isLoading, pathname };

  return (
    <>
      <div className="admin-canvas relative flex h-dvh overflow-hidden" dir="rtl">
        <DesktopSidebar collapsed={!isSidebarOpen} onToggleCollapsed={toggleSidebar} onLogout={handleLogout} {...shell} />
        <MobileDrawer
          open={drawerOpen}
          onClose={closeDrawer}
          returnFocusRef={menuButton}
          onLogout={() => {
            setDrawerOpen(false);
            handleLogout();
          }}
          {...shell}
        />

        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <AdminTopBar
            title={findNavItem(pathname)?.label ?? "پنل مدیریت"}
            onOpenMenu={() => setDrawerOpen(true)}
            menuRef={menuButton}
            drawerOpen={drawerOpen}
          />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 [scrollbar-color:var(--color-gray-300)_transparent] [scrollbar-width:thin]">
            <div key={pathname} className="admin-page-in h-full">
              {children}
            </div>
          </main>
        </div>
      </div>

      <ConfirmDialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={confirmLogout}
        title="خروج از حساب"
        confirmLabel="بله، خروج"
        icon={LogOut}
      >
        آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟
      </ConfirmDialog>
    </>
  );
}
