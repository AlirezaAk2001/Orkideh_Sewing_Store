"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./product/product.css";
import AppImage from "./AppImage";
import ImageLightbox from "./ImageLightbox";
import ImageSlider from "./ImageSlider";
import ProductRail from "./home/ProductRail";
import ProductBackdrop from "./product/ProductBackdrop";
import Reveal from "./product/Reveal";
import SectionNav from "./product/SectionNav";
import QuantityStepper from "./QuantityStepper";
import { Award, BadgePercent, BaggageClaim, ChevronDown, ChevronLeft, Gauge, Info, Layers, MessageSquare, PackageCheck, Palette, Phone, Ruler, Sparkles, Star, Tag, Truck, Weight, Zap, ZoomIn } from "lucide-react";
import { STORE } from "@/lib/contact";
import { brandOf } from "@/lib/brands";
import { useChangeKey } from "@/lib/motion";
import { productImages } from "@/lib/productImages";
import { Tooltip } from 'react-tooltip';
import { useCart, useFavorites, useAuth } from "@/lib/context";
import { authUrl } from "@/lib/redirect";
import { tabHref } from "@/app/profile/_ui/tabs";
import { isSoldOut, maxPurchasable } from "@/lib/stock";
import { LOW_STOCK_THRESHOLD } from "@/lib/statsMath";
import { flyToCart } from "@/lib/flyToCart";
import SellerBox from "./SellerBox";
import ProductComments from "./ProductComments";
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import Icon from "@mdi/react";
import { mdiCartRemove, mdiCartMinus, mdiHeart, mdiHeartPlusOutline, mdiHeartMinusOutline, mdiCloseCircleOutline, mdiDeleteCircleOutline } from "@mdi/js";
import toast from "react-hot-toast";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

const fa = (n) => Number(n).toLocaleString("fa-IR");

// آیکون کاشی هر مشخصه (کلید = همان برچسبی که در specs می‌آید)؛ برچسب ناشناخته آیکون اطلاعات می‌گیرد
const SPEC_ICONS = { جنس: Layers, ابعاد: Ruler, وزن: Weight, رنگ: Palette, ولتاژ: Zap, "توان مصرفی": Gauge };

// امتیاز و تعداد نظر کنار عنوان؛ همان حساب نمایه‌های دیگر (میانگین نظرهای تأییدشده، مثل JSON-LD و کارت محصول).
// لینک به بخش نظرها می‌رود؛ بدون نظر هم همان لینک دعوت به نوشتن اولین نظر است.
function RatingSummary({ comments }) {
  const votes = comments.length;
  const average = votes > 0 ? comments.reduce((sum, c) => sum + (Number(c.rating) || 0), 0) / votes : 0;

  const goToComments = (event) => {
    const section = document.getElementById("comments");
    if (!section) return;
    event.preventDefault();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    section.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    section.focus({ preventScroll: true });
  };

  return (
    <a
      href="#comments"
      onClick={goToComments}
      aria-label={
        votes === 0
          ? "هنوز نظری ثبت نشده؛ رفتن به بخش نظرها"
          : average > 0
          ? `امتیاز ${fa(average.toFixed(1))} از ۵ بر اساس ${fa(votes)} نظر؛ رفتن به بخش نظرها`
          : `${fa(votes)} نظر؛ رفتن به بخش نظرها`
      }
      className="inline-flex w-fit items-center gap-2 rounded-lg text-sm text-gray-600 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      {votes === 0 ? (
        <>
          <MessageSquare className="h-4 w-4 text-gray-400" aria-hidden="true" />
          هنوز نظری ثبت نشده؛ اولین نظر را شما بنویسید
        </>
      ) : (
        <>
          {average > 0 && (
            <>
              <span className="flex" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-4 w-4 ${n <= Math.round(average) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                ))}
              </span>
              <span className="font-semibold text-gray-800">{Number(average.toFixed(1)).toLocaleString("fa-IR", { minimumFractionDigits: 1 })}</span>
            </>
          )}
          <span>({fa(votes)} نظر)</span>
        </>
      )}
    </a>
  );
}

// نوار خرید چسبان پایین صفحه، فقط روی موبایل: قیمت + دکمهٔ اصلی + تماس. visible از IntersectionObserverهای ProductDetails می‌آید؛
// نوار پنهان با visibility از فوکوس و خواننده‌ها کنار است. با «کاهش حرکت» بدون لغزش ظاهر می‌شود.
function StickyBuyBar({ visible, oldPrice, price, callHref, callLabel, children }) {
  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none md:hidden ${
        visible ? "visible translate-y-0" : "invisible translate-y-full"
      }`}
    >
      {/* کارت شناور گرد و شیشه‌ای (نه نوار تمام‌عرض)، مثل زبان طراحی بقیهٔ صفحه */}
      <div className="px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-xl items-center gap-3 rounded-[22px] bg-white/90 p-2.5 shadow-[0_24px_40px_-18px_rgb(60_10_70/0.55)] ring-1 ring-[rgb(80_30_90/0.09)] backdrop-blur-xl" dir="rtl">
          <div className="shrink-0 pe-1 leading-tight">
            {oldPrice && <div className="text-[11px] text-gray-400 line-through">{oldPrice}</div>}
            <div className="whitespace-nowrap text-sm font-extrabold text-brand-600">{price} تومان</div>
          </div>
          {children}
          <a
            href={callHref}
            aria-label={callLabel}
            className="btn-lift grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-brand-50 text-brand-600 transition hover:bg-brand-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Phone className="h-5 w-5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}

// جزئیات محصول؛ داده، نظرهای تأییدشده و محصولات مرتبط را صفحهٔ سروری (app/products/[slug]/page.jsx) می‌دهد تا در همان HTML اولیه باشند
export default function ProductDetails({ product, initialComments = [], related = [] }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { addToCart, cartItems = [], removeFromCart, updateQuantity } = useCart();
  const { addToFavorites, removeFromFavorites, favorites = [] } = useFavorites();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  // مثل سبد خرید پروفایل: تا ذخیرهٔ تعدادِ تازه روی سرور (یا تا پایان افزودن به سبد) دکمه‌های گام‌شمار قفل‌اند
  const [qtyBusy, setQtyBusy] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  // انیمیشن‌های بعد از کنش کاربر: دکمه‌هایی که جای هم را می‌گیرند (pop-in) و قلبی که تازه پر شده (heart-pop)؛ تا کاربر کاری نکرده صفر می‌مانند
  // تا هنگام نمایش اولیهٔ صفحه چیزی نپرد
  const [popButtons, setPopButtons] = useState(false);
  const [heartPop, setHeartPop] = useState(false);
  // گالری: تصویر اصلی + بقیه به ترتیب. active شمارهٔ تصویر جاری است؛ اسلایدر هنگام کشیدن یا فلش خبرش می‌دهد (onIndexChange)
  // و کوچک‌نماها و دیالوگ بزرگ‌نمایی با sliderRef.goTo اسلایدر را می‌برند
  const photos = productImages(product);
  const [active, setActive] = useState(0);
  const sliderRef = useRef(null);
  const stageRef = useRef(null);
  const current = Math.min(active, Math.max(photos.length - 1, 0));
  const many = photos.length > 1;
  const showPhoto = (index, options) => {
    setActive(index);
    sliderRef.current?.goTo(index, options);
  };
  // بعد از بستن دیالوگ فوکوس به دکمهٔ بزرگ‌نمایی اسلاید جاری برمی‌گردد (اسلایدهای دیگر inert‌اند)
  const focusZoomButton = () => stageRef.current?.querySelector('[data-active="true"] button[aria-label="بزرگ‌نمایی تصویر محصول"]')?.focus({ preventScroll: true });
  const photoAlt = (index) => (index === 0 ? product.name : `${product.name} (تصویر ${fa(index + 1)})`);
  // نوار خرید چسبان موبایل: وقتی دکمه‌های اصلی خرید از دید بیرون‌اند نشان داده می‌شود، و وقتی فوتر دیده می‌شود پنهان
  const actionsRef = useRef(null);
  const [barVisible, setBarVisible] = useState(false);

  // Dialog state برای تأییدیه‌های حذف
  const [dialog, setDialog] = useState({ open: false, type: null }); // type: 'cart' | 'favorite'
  const [shake, setShake] = useState(false);
  const handleCloseDialog = () => setDialog({ open: false, type: null });
  const handleBackdropClick = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  useEffect(() => {
    const cartItem = cartItems.find((item) => item.id === product?.id);
    setIsInCart(!!cartItem);
    if (cartItem) {
      setQuantity(cartItem.quantity); // تنظیم تعداد بر اساس سبد خرید
    } else {
      setQuantity(1); // ریست تعداد وقتی محصول در سبد نیست
    }
    setIsFavorite(Array.isArray(favorites) && favorites.some((item) => item.id === product?.id));
  }, [cartItems, favorites, product]);

  useEffect(() => {
    const actions = actionsRef.current;
    if (!actions || typeof IntersectionObserver === "undefined") return;
    let actionsOut = false;
    let footerIn = false;
    const update = () => setBarVisible(actionsOut && !footerIn);
    // هدر چسبان بالای صفحه چیزی را که زیرش رفته می‌پوشاند: دکمه‌هایی که زیر هدرند «دیده‌نشده» حساب می‌شوند
    const headerHeight = Math.round(document.querySelector("header")?.getBoundingClientRect().height ?? 0);
    const actionsObserver = new IntersectionObserver(
      ([entry]) => {
        actionsOut = !entry.isIntersecting;
        update();
      },
      { rootMargin: `-${headerHeight}px 0px 0px 0px` }
    );
    actionsObserver.observe(actions);
    const footer = document.querySelector("footer");
    let footerObserver = null;
    if (footer) {
      footerObserver = new IntersectionObserver(([entry]) => {
        footerIn = entry.isIntersecting;
        update();
      });
      footerObserver.observe(footer);
    }
    return () => {
      actionsObserver.disconnect();
      footerObserver?.disconnect();
    };
  }, []);

  // موجودی کالا؛ قاعده همان lib/stock.js است (null = پیگیری نمی‌شود، «لوازم جانبی» معاف است)
  const stock = product?.stock;
  const isAccessories = product.Category?.name === "لوازم جانبی";
  const isOutOfStock = isSoldOut(product);
  const maxQuantity = maxPurchasable(product);

  // null = موجودی ثبت نشده؛ در این حالت چیزی نشان داده نمی‌شود (به‌جای «نامشخص»)
  const renderInventory = () => {
    if (isOutOfStock) return "ناموجود";
    if (isAccessories) return "موجود";
    if (stock == null || stock === "") return null;
    return `${Number(stock).toLocaleString("fa-IR")} عدد`;
  };
  const inventoryText = renderInventory();

  // فقط مشخصاتی که مقدار دارند نمایش داده می‌شوند؛ ردیف‌های خالی «نامشخص» نمی‌گیرند
  const hasValue = (value) => value != null && String(value).trim() !== "";
  const specs = [
    ["جنس", product.material],
    ["ابعاد", product.size],
    ["وزن", product.weight],
    ["رنگ", product.color],
    ["ولتاژ", product.voltage],
    ["توان مصرفی", product.powerConsumption],
  ].filter(([, value]) => hasValue(value));
  const extras = [
    ["توضیحات", product.additionalFeatures],
    ["مناسب برای", product.suitableFor],
  ].filter(([, value]) => hasValue(value));

  // همان منطق گام‌شمار سبد (CartView): وقتی محصول در سبد است تعداد همان لحظه روی سبد (و سرور) اعمال می‌شود و در صورت خطا به تعداد قبلی برمی‌گردد (updateQuantity)؛
  // وقتی هنوز در سبد نیست فقط تعدادِ افزودنی عوض می‌شود. سقف و کفِ تعداد را خود دکمه‌های گام‌شمار با غیرفعال شدن رعایت می‌کنند
  const changeQuantity = async (next) => {
    if (!isInCart) {
      setQuantity(next);
      return;
    }
    setQtyBusy(true);
    try {
      await updateQuantity(product.id, next);
    } finally {
      setQtyBusy(false);
    }
  };

  const handleAddToCart = (event) => {
    // رویداد را همین‌جا می‌خوانیم: currentTarget بعد از پایان کنترل‌کننده دیگر در دسترس نیست
    const button = event?.currentTarget;
    if (!currentUser) {
      toast("برای افزودن محصول موردنظر به سبد خرید، لطفاً ابتدا وارد حساب کاربری خود شوید.", { icon: "⚠️" });
      setTimeout(() => router.push(authUrl(window.location.pathname)), 2000);
      return;
    }

    if (isOutOfStock) {
      toast("این محصول در حال حاضر ناموجود است!", { icon: "⚠️" });
      return;
    }

    const discountedPrice = product.discount
      ? Math.round(product.price - (product.price * product.discount) / 100)
      : product.price;

    const adding = addToCart({
      id: product.id,
      name: product.name,
      price: discountedPrice,
      quantity,
      image: product.image,
      slug: product.slug,
    });
    // تا پاسخ سرور نیامده گام‌شمار قفل می‌ماند تا درخواست تغییر تعداد پیش از خودِ افزودن به سرور نرسد
    setQtyBusy(true);
    adding.finally(() => setQtyBusy(false));
    // پیام موفقیت (یا خطا) را خود addToCart بعد از پاسخ سرور نشان می‌دهد

    // تصویر جاری گالری به آیکون سبد هدر می‌پرد (اگر تصویر از پنجره بیرون است، از خود دکمه، مثلاً دکمهٔ نوار چسبان)
    flyToCart(stageRef.current?.querySelector('[data-active="true"] img') ?? stageRef.current, button);
    setPopButtons(true);
    setIsInCart(true);
  };

  const handleRemoveFromCart = () => {
     setDialog({ open: true, type: "cart", name: product.name });
  };

  const confirmRemoveFromCart = () => {
    removeFromCart(product.id);
    setPopButtons(true);
    setIsInCart(false);
    setQuantity(1);
    handleCloseDialog();
    toast("محصول موردنظر از سبد خرید شما حذف شد.", { icon: "🗑️" });
  };

  const handleFavoriteToggle = () => {
    if (!currentUser) {
      toast("برای افزودن محصول موردنظر به علاقه‌مندی‌ها، ابتدا وارد حساب کاربری خود شوید.", { icon: "⚠️" });
      setTimeout(() => router.push(authUrl(window.location.pathname)), 2000);
      return;
    }

    if (isFavorite) {
      setDialog({ open: true, type: "favorite", name: product.name });
    } else {
      // قیمت نهایی (همان که API علاقه‌مندی‌ها برمی‌گرداند) و نشان تخفیف و لینک برای کارت علاقه‌مندی‌های پنل کاربری
      const discounted = product.discount > 0 && product.finalPrice < product.price;
      addToFavorites({
        id: product.id,
        name: product.name,
        price: product.finalPrice || product.price,
        oldPrice: discounted ? product.price : null,
        discount: discounted ? product.discount : null,
        slug: product.slug,
        image: product.image,
      });
      setHeartPop(true);
      setIsFavorite(true);
      toast.success("محصول با موفقیت به علاقه‌مندی‌های شما اضافه شد.");
    }
  };

  const confirmRemoveFromFavorites = () => {
    removeFromFavorites(product.id);
    setIsFavorite(false);
    handleCloseDialog();
    toast("محصول موردنظر از علاقه‌مندی‌های شما حذف شد.", { icon: "🗑️" });
  };

  const hasDiscount = product.discount > 0;
  // قیمت نهایی یک عدد (همان عددی که addToCart در سبد می‌گذارد، پس جمع ردیف با سبد یکی است)
  const unitPrice = hasDiscount ? Math.round(product.price - (product.price * product.discount) / 100) : product.price;
  const finalPriceText = fa(unitPrice);
  const savings = Math.max(0, product.price - unitPrice) * quantity;
  // با عوض‌شدن تعداد، عدد جمع ردیف یک بار می‌پرد (num-tick)؛ هنگام نمایش اولیه نه
  const totalKey = useChangeKey(quantity);
  const categoryHref = product.Category?.slug ? `/categories/${encodeURIComponent(product.Category.slug)}` : null;
  // جدول Product ستون برند ندارد؛ برند از نام محصول حدس زده می‌شود (lib/brands.js) و اگر حدس نخورد چیپ برند نیست
  const brand = brandOf(product.name);
  // چیپ موجودی: ناموجود، کم‌موجودی (۵ عدد یا کمتر، همان آستانهٔ داشبورد ادمین) با نبض نارنجی، وگرنه موجودی عادی؛ بدون موجودی ثبت‌شده چیزی نیست
  const lowStock = !isOutOfStock && !isAccessories && stock != null && stock !== "" && Number(stock) <= LOW_STOCK_THRESHOLD;
  const stockChip = isOutOfStock
    ? { tone: "out", text: "ناموجود" }
    : lowStock
    ? { tone: "low", text: `فقط ${fa(stock)} عدد در انبار مانده` }
    : inventoryText
    ? { tone: "ok", text: isAccessories ? "موجود" : `موجودی: ${inventoryText}` }
    : null;
  const callPhone = STORE.phones.find((phone) => phone.label.includes("همراه")) ?? STORE.phones[0];

  // دکمهٔ اصلی نوار چسبان با همان وضعیت‌ها و همان کنترل‌کننده‌های دکمهٔ اصلی صفحه
  const stickyAction = isOutOfStock ? (
    <button type="button" disabled className="h-11 flex-1 cursor-not-allowed rounded-xl bg-gray-400 text-sm font-medium text-white">
      ناموجود
    </button>
  ) : isInCart ? (
    <button
      key="in-cart"
      type="button"
      onClick={() => router.push(tabHref("cart"))}
      className={`flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-900 text-sm font-medium text-white transition hover:bg-gray-800 active:scale-[0.98] ${popButtons ? "pop-in" : ""}`}
    >
      <BaggageClaim className="h-5 w-5" />
      مشاهده سبد خرید
    </button>
  ) : (
    <button
      key="add"
      type="button"
      onClick={handleAddToCart}
      className={`bar-sheen flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-medium text-white transition hover:bg-brand-700 active:scale-[0.98] ${popButtons ? "pop-in" : ""}`}
    >
      <AddShoppingCartIcon className="h-5 w-5" />
      افزودن به سبد خرید
    </button>
  );

  // دکمهٔ خرید فشردهٔ نوار بخش‌ها (دسکتاپ): همان وضعیت‌ها و همان کنترل‌کننده‌های دکمهٔ اصلی صفحه
  const miniAction = isOutOfStock ? (
    <button type="button" disabled className="pd-mini-btn pd-mini-btn--out">
      ناموجود
    </button>
  ) : isInCart ? (
    <button type="button" onClick={() => router.push(tabHref("cart"))} className="pd-mini-btn pd-mini-btn--view">
      <BaggageClaim className="h-[18px] w-[18px]" aria-hidden="true" />
      مشاهده سبد
    </button>
  ) : (
    <button type="button" onClick={handleAddToCart} className="pd-mini-btn bar-sheen">
      <AddShoppingCartIcon className="h-[18px] w-[18px]" />
      افزودن به سبد
    </button>
  );

  // تب‌های نوار بخش‌ها: فقط بخش‌هایی که در صفحه هستند
  const navItems = [
    specs.length > 0 && { id: "specs", label: "مشخصات" },
    extras.length > 0 && { id: "more", label: "ویژگی‌های بیشتر" },
    related.length > 0 && { id: "related", label: "محصولات مرتبط" },
    { id: "comments", label: "نظرات", count: initialComments.length },
  ].filter(Boolean);

  return (
    <div className="pd">
    {/* پس‌زمینهٔ صفحه (مش برند + ابزارهای خیاطی معلق)؛ استایل کل صفحه در product/product.css */}
    <ProductBackdrop />
    <div className="container mx-auto px-2 sm:px-4 md:px-6 py-2 sm:py-4">
      <nav className="pd-crumbs pd-rise" aria-label="مسیر صفحه">
        <Link href="/">خانه</Link>
        <ChevronLeft aria-hidden="true" />
        <Link href="/products">محصولات</Link>
        {categoryHref && (
          <>
            <ChevronLeft aria-hidden="true" />
            <Link href={categoryHref}>{product.Category.name}</Link>
          </>
        )}
        <ChevronLeft aria-hidden="true" />
        <b aria-current="page">{product.name}</b>
      </nav>
      <div className="pd-hero">
        <div ref={stageRef} className="pd-gal pd-rise" style={{ "--i": 1 }}>
          {photos.length > 0 ? (
            <>
              {/* تصویر کل کادر را پر می‌کند (object-cover، کادر ۴:۳ مثل بیشتر عکس‌های محصول)؛ اسلایدر مثل بنر صفحهٔ اصلی ولی بدون جابه‌جایی خودکار */}
              <ImageSlider
                ref={sliderRef}
                images={photos}
                label={product.name}
                className="relative aspect-[4/3] w-full rounded-[22px] bg-gray-100"
                onIndexChange={setActive}
                renderSlide={(src, index, { load }) => (
                  <button
                    type="button"
                    onClick={() => setZoomOpen(true)}
                    aria-label="بزرگ‌نمایی تصویر محصول"
                    className="btn-flat group relative block h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
                  >
                    {load && (
                      <AppImage src={src} alt={photoAlt(index)} fill priority={index === 0} sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
                    )}
                    <span
                      aria-hidden="true"
                      className="absolute bottom-3 left-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-gray-700 shadow ring-1 ring-gray-200 transition duration-300 group-hover:scale-110 group-hover:text-brand-600"
                    >
                      <ZoomIn className="h-5 w-5" />
                    </span>
                  </button>
                )}
              />
              {many && (
                <ul className="pd-thumbs no-scrollbar" aria-label="تصویرهای محصول">
                  {photos.map((src, index) => (
                    <li key={src} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => showPhoto(index)}
                        aria-label={`نمایش تصویر ${fa(index + 1)} از ${fa(photos.length)}`}
                        aria-current={index === current ? "true" : undefined}
                        className="pd-thumb btn-flat"
                      >
                        <AppImage src={src} alt="" fill sizes="78px" className="object-cover" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <ImageLightbox open={zoomOpen} onClose={() => setZoomOpen(false)} images={photos} index={current} onIndexChange={(index) => showPhoto(index, { instant: true })} onExited={focusZoomButton} alt={product.name} />
            </>
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center bg-gray-200">بدون تصویر</div>
          )}
          {hasDiscount && (
            // کارت گالری ۱۲ پیکسل پدینگ دارد؛ ۲۴ یعنی همان ۱۲ پیکسل فاصلهٔ قبلی از گوشهٔ خود عکس
            <div className="discount-chip left-6 top-6">
              <span className="discount-chip__value">{fa(product.discount)}٪</span>
              <span className="discount-chip__label">تخفیف</span>
            </div>
          )}
        </div>
        <div className="pd-info" dir="rtl">
          <div className="pd-chips pd-rise" style={{ "--i": 0 }}>
            {product.Category?.name &&
              (categoryHref ? (
                <Link href={categoryHref} className="pd-chip">
                  <Tag aria-hidden="true" />
                  {product.Category.name}
                </Link>
              ) : (
                <span className="pd-chip">
                  <Tag aria-hidden="true" />
                  {product.Category.name}
                </span>
              ))}
            {brand && (
              <Link href={`/products?q=${encodeURIComponent(brand.name)}`} className="pd-chip">
                <Award aria-hidden="true" />
                برند: {brand.name}
              </Link>
            )}
            {stockChip && (
              <span className={`pd-stock ${stockChip.tone === "ok" ? "pd-stock--ok" : stockChip.tone === "out" ? "pd-stock--out" : ""}`}>
                <i aria-hidden="true" />
                {stockChip.text}
              </span>
            )}
          </div>
          <h1 className="pd-title pd-rise" style={{ "--i": 1 }}>{product.name}</h1>
          <div className="pd-rise" style={{ "--i": 2 }}>
            <RatingSummary comments={initialComments} />
          </div>
          <div className="pd-price pd-rise" style={{ "--i": 3 }}>
            <div className="pd-prow">
              <span className="pd-now">
                <b>{finalPriceText}</b>
                <small>تومان</small>
              </span>
              {hasDiscount && (
                <span className="pd-old">
                  <s>{fa(product.price)} تومان</s>
                  <em className="pd-off">{fa(product.discount)}٪ تخفیف</em>
                </span>
              )}
            </div>
            {hasDiscount && savings > 0 && (
              <p className="pd-save">
                <BadgePercent aria-hidden="true" />
                با این خرید {fa(savings)} تومان صرفه‌جویی می‌کنید
              </p>
            )}
          </div>
          {!isOutOfStock && (
            <div className="pd-qrow pd-rise" style={{ "--i": 4 }}>
              <span className="pd-lbl">تعداد:</span>
              <QuantityStepper value={quantity} max={maxQuantity} busy={qtyBusy} onChange={changeQuantity} />
              <span className="pd-sum">
                جمع:
                <b key={totalKey} className={totalKey ? "num-tick" : undefined}>{fa(unitPrice * quantity)}</b>
                <small>تومان</small>
              </span>
            </div>
          )}
          <div ref={actionsRef} className="pd-cta pd-rise" style={{ "--i": 5 }}>
            <div className="pd-cta-main">
              {isOutOfStock ? (
                <button type="button" disabled className="pd-btn pd-btn-out">
                  ناموجود
                </button>
              ) : isInCart ? (
                <>
                  {/* pop-in روی خود دکمه‌هاست: با جابه‌جایی «افزودن» و «مشاهده سبد» دکمه‌های تازه ساخته می‌شوند و انیمیشن دوباره اجرا می‌شود */}
                  <button type="button" onClick={() => router.push(tabHref("cart"))} className={`pd-btn pd-btn-view ${popButtons ? "pop-in" : ""}`}>
                    <BaggageClaim className="h-5 w-5" aria-hidden="true" />
                    مشاهده سبد خرید
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFromCart}
                    className={`pd-sq pd-sq-rm ${popButtons ? "pop-in" : ""}`}
                    aria-label="حذف از سبد خرید"
                    data-tooltip-id="remove-cart-tooltip"
                    data-tooltip-content="حذف از سبد خرید"
                  >
                    <Icon path={mdiCartRemove} className="h-6 w-6" />
                  </button>
                </>
              ) : (
                // bar-sheen: برق هاور دکمه، همان برق دکمهٔ «رفتن به فروشگاه» (globals.css)
                <button type="button" onClick={handleAddToCart} className={`pd-btn pd-btn-add bar-sheen ${popButtons ? "pop-in" : ""}`}>
                  <AddShoppingCartIcon className="h-5 w-5" />
                  افزودن به سبد خرید
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleFavoriteToggle}
              className="pd-sq pd-sq-fav"
              aria-pressed={isFavorite}
              aria-label={isFavorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
              data-tooltip-id="favorite-tooltip"
              data-tooltip-content={isFavorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
            >
              {isFavorite ? (
                <>
                  {heartPop && <span className="pd-ring" aria-hidden="true" />}
                  <Icon path={mdiHeart} className={`h-6 w-6 ${heartPop ? "heart-pop" : ""}`} />
                </>
              ) : (
                <Icon path={mdiHeartPlusOutline} className="h-6 w-6" />
              )}
            </button>
          </div>
          <ul className="pd-perks pd-rise" style={{ "--i": 6 }}>
            <li className="pd-perk">
              <span className="pd-perk-i" aria-hidden="true">
                <Truck />
              </span>
              ارسال به سراسر کشور
            </li>
            <li className="pd-perk">
              <span className="pd-perk-i" aria-hidden="true">
                <PackageCheck />
              </span>
              ارسال رایگان در تهران
            </li>
          </ul>
          {/* فروشنده و تماس در یک کارت */}
          <div className="pd-rise" style={{ "--i": 7 }}>
            <SellerBox sellerName={product.seller || "فروشگاه چرخ خیاطی ارکیده"} />
          </div>
        </div>
      </div>
      {/* نوار بخش‌ها: اگر فقط «نظرات» باشد تبی برای جابه‌جایی نیست؛ خرید فشرده سمت چپش وقتی دکمهٔ اصلی خرید از دید رفته می‌آید (روی موبایل نوار خرید پایین صفحه است) */}
      {navItems.length > 1 && (
        <SectionNav items={navItems} showMini={barVisible}>
          {photos[0] && (
            <span className="pd-mini-img" aria-hidden="true">
              <AppImage src={photos[0]} alt="" fill sizes="40px" className="object-cover" />
            </span>
          )}
          <div className="min-w-0">
            <div className="pd-mini-name">{product.name}</div>
            <span className="pd-mini-price">{finalPriceText} تومان</span>
          </div>
          {miniAction}
        </SectionNav>
      )}
      <div className={`pd-sections ${navItems.length > 1 ? "" : "mt-8"}`}>
        {specs.length > 0 && (
          <Reveal as="section" id="specs" aria-labelledby="specs-h" className="pd-anchor pd-panel">
            <div className="pd-sec-h">
              <span className="pd-sec-i" aria-hidden="true">
                <Info />
              </span>
              <h2 id="specs-h">مشخصات کلی</h2>
            </div>
            <dl className="pd-specs">
              {specs.map(([label, value], index) => {
                const SpecIcon = SPEC_ICONS[label] ?? Info;
                return (
                  <div key={label} className={`pd-spec pd-st ${String(value).length > 28 ? "pd-spec--wide" : ""}`} style={{ "--i": index }}>
                    <span className="pd-spec-i" aria-hidden="true">
                      <SpecIcon />
                    </span>
                    <div>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </Reveal>
        )}
        {extras.length > 0 && (
          <Reveal as="section" id="more" aria-label="ویژگی‌های بیشتر" className={`pd-anchor pd-panel pd-acc ${isExpanded ? "open" : ""}`}>
            <h2 className="pd-acc-h">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                aria-controls="pd-acc-body"
                className="pd-acc-btn btn-flat"
              >
                <span className="pd-sec-i" aria-hidden="true">
                  <Sparkles />
                </span>
                مشاهده ویژگی‌های بیشتر
                <span className="pd-chev" aria-hidden="true">
                  <ChevronDown />
                </span>
              </button>
            </h2>
            <div className="pd-acc-body" id="pd-acc-body">
              <div inert={!isExpanded}>
                {extras.map(([label, value]) => (
                  <div key={label} className="pd-acc-row">
                    <b>{label}</b>
                    <p>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        )}
        {related.length > 0 && (
          // ردیف برای لبه‌به‌لبه شدن -mx-4 دارد و پدینگ ۱۶ پیکسلی لازم دارد؛ این صفحه روی موبایل فقط ۸ پیکسل دارد، پس ۸ پیکسل دیگر از همین‌جا
          <Reveal id="related" className="pd-anchor px-2 sm:px-0">
            <ProductRail
              id="related-products"
              title="محصولات مرتبط"
              subtitle={product.Category?.name ? `از دستهٔ ${product.Category.name}` : undefined}
              href={categoryHref}
              hint={product.Category?.name ? `همهٔ محصولات ${product.Category.name}` : undefined}
              products={related}
            />
          </Reveal>
        )}
        {/* تکیه‌گاه لینک امتیاز بالای صفحه و تب «نظرات» نوار بخش‌ها: pd-anchor جای هدر و نوار چسبان را نگه می‌دارد */}
        <Reveal as="section" id="comments" tabIndex={-1} aria-label="نظرات کاربران" className="pd-anchor outline-none">
          <ProductComments productId={product.id} initialComments={initialComments} />
        </Reveal>
      </div>

      <StickyBuyBar
        visible={barVisible}
        oldPrice={hasDiscount ? fa(product.price) : null}
        price={finalPriceText}
        callHref={callPhone.href}
        callLabel={`تماس با ${callPhone.label}`}
      >
        {stickyAction}
      </StickyBuyBar>

      {/* Tooltip Definitions - فقط برای ۵ مورد درخواستی */}
      <Tooltip id="remove-cart-tooltip" />
      <Tooltip id="favorite-tooltip" />

      {/* Toast */}

      {/* Dialog تأییدیه حذف */}
      <Dialog open={dialog.open} onClose={handleBackdropClick} dir="rtl"
        PaperProps={{
          sx: {
            animation: shake ? "dialogShake 0.5s ease" : "none",
            borderRadius: "12px"
          }
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "Vazirmatn, sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 1,
            backgroundColor: dialog.type === "cart" ? "#3b82f6" : "#ef4444",
            color: "#ffffff",
            borderBottom: "3px solid",
            borderColor: dialog.type === "cart" ? "#1d4ed8" : "#b91c1c",
            px: 3,
            py: 1.5,
          }}
        >
          <Icon
            path={dialog.type === "cart" ? mdiCartMinus : mdiHeartMinusOutline}
            size={1}
            color="#ffffff"
          />
          {dialog.type === "cart" ? "حذف از سبد خرید" : "حذف از علاقه‌مندی‌ها"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "Vazirmatn, sans-serif" }}>
            {dialog.type === "cart"
              ? `آیا مطمئن هستید؟ محصول "${dialog.name}" از سبد خرید شما حذف خواهد شد.`
              : `آیا مطمئن هستید؟ محصول "${dialog.name}" از علاقه‌مندی‌های شما حذف خواهد شد.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ fontFamily: "Vazirmatn, sans-serif" }}>
            <Icon path={mdiCloseCircleOutline} size={1} />
            لغو
          </Button>
          <Button
            onClick={dialog.type === "cart" ? confirmRemoveFromCart : confirmRemoveFromFavorites}
            color="error"
            variant="contained"
            sx={{ fontFamily: "Vazirmatn, sans-serif" }}
          >
            <Icon path={mdiDeleteCircleOutline} size={1} />
            بله، حذف کن
          </Button>
        </DialogActions>
      </Dialog>

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
      }
    `}</style>
    </div>
    </div>
  );
}