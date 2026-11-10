"use client";

import "./_ui/profile.css";
import { Suspense, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { mdiDeleteCircleOutline, mdiHeartOutline, mdiLogoutVariant } from "@mdi/js";
import PageLoader from "@/app/components/PageLoader";
import { useAuth, useCart, useFavorites } from "@/lib/context";
import { flyToCart } from "@/lib/flyToCart";
import { prefersReducedMotion } from "@/lib/motion";
import AddressesView from "./_ui/AddressesView";
import CartView from "./_ui/CartView";
import ConfirmDialog from "./_ui/ConfirmDialog";
import { Dock, TabBar } from "./_ui/Dock";
import FavoritesView from "./_ui/FavoritesView";
import OrdersView from "./_ui/OrdersView";
import Overview from "./_ui/Overview";
import ProfileBackdrop from "./_ui/ProfileBackdrop";
import SettingsView from "./_ui/SettingsView";
import { normalizeTab, tabHref } from "./_ui/tabs";
import { useOrders } from "./_ui/useOrders";

// عوض‌شدن بخش با View Transitions مرورگر (روی مرورگرهای بی‌پشتیبانی یا با «کاهش حرکت» فوری): محتوا نرم جابه‌جا می‌شود و اگر از یک کاشی نمای کلی آمده باشیم،
// همان کاشی به عنوان بخش مقصد باز می‌شود (هر دو نام morph می‌گیرند). نام‌ها بعد از پایان گذار پاک می‌شوند
function runTransition(update, from) {
  if (typeof document.startViewTransition !== "function" || prefersReducedMotion()) {
    update();
    return;
  }
  const root = document.documentElement;
  root.classList.add("pf-vt");
  if (from) from.style.viewTransitionName = "morph";
  const transition = document.startViewTransition(() => {
    if (from) from.style.viewTransitionName = "";
    update();
    const head = document.querySelector(".pf .vh");
    if (from && head) head.style.viewTransitionName = "morph";
  });
  transition.finished.finally(() => {
    root.classList.remove("pf-vt");
    if (from) from.style.viewTransitionName = "";
    document.querySelectorAll('.pf [style*="view-transition-name"]').forEach((el) => {
      el.style.viewTransitionName = "";
    });
  });
}

// بعد از عوض‌شدن بخش: اگر مقصد کارت مشخصی است (مدادِ آواتار در کارت صورتی) صفحه تا همان کارت می‌رود و فوکوس و یک چشمک ملایم می‌گیرد
// (data-spot در profile.css)، وگرنه بالای صفحه. اسکرول فوری است؛ نرم‌بودن حرکت را خود گذار بین بخش‌ها می‌دهد
function arrive(anchor) {
  const target = anchor ? document.getElementById(anchor) : null;
  if (!target) {
    window.scrollTo({ top: 0 });
    return;
  }
  // جای کارت از offsetTop حساب می‌شود، نه از getBoundingClientRect: کارت هنوز در انیمیشن ورودش ۲۰ پیکسل پایین‌تر است و scrollIntoView همان را می‌دید
  let top = 0;
  for (let el = target; el; el = el.offsetParent) top += el.offsetTop;
  window.scrollTo({ top: Math.max(0, top - (parseFloat(getComputedStyle(target).scrollMarginTop) || 0)) });
  target.focus({ preventScroll: true });
  target.setAttribute("data-spot", "");
  target.addEventListener("animationend", (e) => e.animationName === "pf-spot" && target.removeAttribute("data-spot"));
}

// نور دنبال‌کنندهٔ ماوس روی کاشی‌ها
function spotlight(e) {
  const tile = e.target.closest?.(".tile");
  if (!tile) return;
  const r = tile.getBoundingClientRect();
  tile.style.setProperty("--mx", `${e.clientX - r.left}px`);
  tile.style.setProperty("--my", `${e.clientY - r.top}px`);
}

// پنل کاربری: داشبورد بنتو با دوک شناور کنار صفحه (روی موبایل نوار پایین). بخش فعال در آدرس است (/profile?tab=orders)، ولی عوض‌شدنش بدون رفت‌وآمد
// به سرور و با گذار نرم انجام می‌شود؛ دکمهٔ برگشت و لینک‌دادن مثل قبل کار می‌کنند
function ProfileView() {
  const { currentUser, logout, loading, addresses } = useAuth();
  const { cartItems, cartCount, addToCart } = useCart();
  const { favorites, favoritesCount, removeFromFavorites } = useFavorites();
  const router = useRouter();
  const params = useSearchParams();

  const urlTab = normalizeTab(params.get("tab"));
  const [tab, setTab] = useState(urlTab);
  // آدرس از بیرون عوض شد (برگشت مرورگر، لینک): بخش را دنبالش بیاور
  useEffect(() => setTab(urlTab), [urlTab]);

  const { orders, payingId, deletingId, payOrder, deleteOrder } = useOrders(currentUser?.id, tab);

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [askFav, setAskFav] = useState(null);
  const [leavingFav, setLeavingFav] = useState(null);

  useEffect(() => {
    const name = sessionStorage.getItem("welcomeMessage");
    if (name) {
      toast.success(`خوش آمدید ${name} عزیز 🎉`, { position: "top-center" });
      sessionStorage.removeItem("welcomeMessage");
    }
  }, []);

  if (loading || !currentUser) {
    return <PageLoader className="min-h-[60vh]" label="در حال بارگذاری اطلاعات کاربر..." />;
  }

  // anchor (اختیاری): شناسهٔ کارتی که بعد از رسیدن به بخش باید به آن رفت
  const go = (key, from, anchor) => {
    if (key === tab) {
      if (anchor) arrive(anchor);
      return;
    }
    runTransition(() => {
      flushSync(() => setTab(key));
      window.history.pushState(null, "", tabHref(key));
      arrive(anchor);
    }, from);
  };

  const confirmLogout = async () => {
    setLogoutOpen(false);
    try {
      await logout();
      toast.success("شما با موفقیت از حساب خارج شدید.");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("در خروج از حساب مشکلی پیش آمد.");
    }
  };

  // برداشتن از علاقه‌مندی‌ها (از نمای کلی و بخش علاقه‌مندی‌ها): بعد از تأیید، کارت کم‌رنگ می‌شود و بعد برداشته می‌شود
  const confirmUnfav = () => {
    const item = askFav;
    setAskFav(null);
    setLeavingFav(item.id);
    setTimeout(() => {
      removeFromFavorites(item.id);
      setLeavingFav(null);
      toast.success("محصول موردنظر از علاقه‌مندی‌های شما حذف شد.", { icon: "🗑️" });
    }, 330);
  };

  // افزودن به سبد با پرواز تصویر؛ پیام موفقیت یا خطا را خود سبد بعد از پاسخ سرور نشان می‌دهد
  const addCart = (item, button) => {
    addToCart({ id: item.id, name: item.name, price: item.price, quantity: 1, image: item.image });
    flyToCart(button.closest("article"), button);
  };

  const placed = orders ? orders.filter((o) => o.status !== "pending").length : null;
  const counts = { orders: placed, addresses: addresses.length, cart: cartCount, favorites: favoritesCount };

  const views = {
    overview: (
      <Overview
        user={currentUser}
        orders={orders}
        cartItems={cartItems}
        cartCount={cartCount}
        favorites={favorites}
        addresses={addresses}
        payingId={payingId}
        onGo={go}
        onPay={payOrder}
      />
    ),
    orders: <OrdersView orders={orders} payingId={payingId} deletingId={deletingId} onPay={payOrder} onDelete={deleteOrder} />,
    addresses: <AddressesView />,
    cart: <CartView onGo={go} />,
    favorites: <FavoritesView favorites={favorites} leavingId={leavingFav} onUnfav={setAskFav} onAdd={addCart} />,
    settings: <SettingsView user={currentUser} placedOrders={placed} onLogout={() => setLogoutOpen(true)} />,
  };

  return (
    <div className="pf" dir="rtl" data-tab={tab} onPointerMove={spotlight}>
      <ProfileBackdrop />

      <div className="app">
        <Dock tab={tab} counts={counts} onNav={go} onLogout={() => setLogoutOpen(true)} />
        <div className="main" id="profile-content">
          {views[tab]}
        </div>
      </div>

      <TabBar tab={tab} counts={counts} onNav={go} />

      <ConfirmDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} onConfirm={confirmLogout} title="خروج از حساب" icon={mdiLogoutVariant} confirmLabel="بله، خروج" confirmIcon={mdiLogoutVariant} cancelLabel="انصراف">
        آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟
      </ConfirmDialog>

      <ConfirmDialog open={!!askFav} onClose={() => setAskFav(null)} onConfirm={confirmUnfav} title="حذف از علاقه‌مندی‌ها" icon={mdiHeartOutline} confirmLabel="بله، حذف کن" confirmIcon={mdiDeleteCircleOutline}>
        محصول
        <strong style={{ color: "#E53935", margin: "0 4px" }}>«{askFav?.name}»</strong>
        از علاقه‌مندی‌های شما حذف خواهد شد. آیا مطمئن هستید؟
      </ConfirmDialog>
    </div>
  );
}

// useSearchParams (بخش فعال در آدرس) باید پشت Suspense باشد تا ساخت صفحه نشکند
export default function ProfilePage() {
  return (
    <Suspense fallback={<PageLoader className="min-h-[60vh]" label="در حال بارگذاری اطلاعات کاربر..." />}>
      <ProfileView />
    </Suspense>
  );
}
