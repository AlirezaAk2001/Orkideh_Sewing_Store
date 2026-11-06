"use client";

import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/context";
import { useState, useEffect, useCallback, useRef } from "react";
import { DesktopSidebar, MobileDrawer } from "./_shell/AdminSidebar";
import AdminTopBar from "./_shell/AdminTopBar";
import PageLoader from "@/app/components/PageLoader";
import ScrollArea from "@/app/components/ScrollArea";
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
      <div className="admin-canvas relative grid min-h-dvh place-items-center" dir="rtl">
        <PageLoader className="relative z-10" label="در حال بررسی دسترسی..." />
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
          {/* container-type:size = واحد cqh (ارتفاع محتوای خود main) برای صفحه‌های جدول‌دار: TablePage با h-[100cqh] دقیقاً به اندازهٔ main می‌شود و فقط ردیف‌های جدول اسکرول می‌خورند. ScrollArea: اسکرولر main با شست سفارشی سمت راست */}
          <ScrollArea as="main" className="min-h-0 flex-1" innerClassName="overflow-x-hidden p-4 [container-type:size]">
            {/* min-h-full و نه h-full: با h-full لفاف همیشه هم‌قد پنجره می‌ماند و محتوای بلندتر از آن بیرون می‌زند، پس فاصلهٔ پایینِ p-4 در اسکرول حساب نمی‌شد و کارت‌های آخر هر صفحه (مثل دو کارت آخر داشبورد) به لبهٔ پنجره می‌چسبیدند و پایینشان بریده دیده می‌شد */}
            <div key={pathname} className="admin-page-in min-h-full">
              {children}
            </div>
          </ScrollArea>
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
