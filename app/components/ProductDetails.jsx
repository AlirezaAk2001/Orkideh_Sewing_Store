"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AppImage from "./AppImage";
import ImageLightbox from "./ImageLightbox";
import ImageSlider from "./ImageSlider";
import ProductRail from "./home/ProductRail";
import { ChevronDown, BaggageClaim, Headset, MessageSquare, PackageCheck, Phone, Star, Truck, ZoomIn } from "lucide-react";
import { STORE } from "@/lib/contact";
import { productImages } from "@/lib/productImages";
import { Tooltip } from 'react-tooltip';
import { useCart, useFavorites, useAuth } from "@/lib/context";
import { authUrl } from "@/lib/redirect";
import { isSoldOut, maxPurchasable } from "@/lib/stock";
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
      <div className="border-t border-gray-200 bg-white/95 px-4 pt-3 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.3)] backdrop-blur pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-xl items-center gap-3" dir="rtl">
          <div className="shrink-0 leading-tight">
            {oldPrice && <div className="text-xs text-gray-400 line-through">{oldPrice}</div>}
            <div className="whitespace-nowrap text-sm font-bold text-brand-600">{price} تومان</div>
          </div>
          {children}
          <a
            href={callHref}
            aria-label={callLabel}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-gray-300 bg-white text-brand-600 transition hover:border-brand-200 hover:bg-brand-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
  const { addToCart, cartItems = [], removeFromCart } = useCart();
  const { addToFavorites, removeFromFavorites, favorites = [] } = useFavorites();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [zoomOpen, setZoomOpen] = useState(false);
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

  const increaseQuantity = () => {
    if (quantity >= maxQuantity) {
      toast("تعداد درخواستی بیش از موجودی است!", { icon: "⚠️" });
      return;
    }
    setQuantity(quantity + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
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

    addToCart({
      id: product.id,
      name: product.name,
      price: discountedPrice,
      quantity,
      image: product.image,
      slug: product.slug,
    });
    // پیام موفقیت (یا خطا) را خود addToCart بعد از پاسخ سرور نشان می‌دهد

    setIsInCart(true);
  };

  const handleRemoveFromCart = () => {
     setDialog({ open: true, type: "cart", name: product.name });
  };

  const confirmRemoveFromCart = () => {
    removeFromCart(product.id);
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
      addToFavorites({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      });
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
  const finalPriceText = fa(hasDiscount ? product.price - (product.price * product.discount) / 100 : product.price);
  const categoryHref = product.Category?.slug ? `/categories/${encodeURIComponent(product.Category.slug)}` : null;
  const callPhone = STORE.phones.find((phone) => phone.label.includes("همراه")) ?? STORE.phones[0];

  // دکمهٔ اصلی نوار چسبان با همان وضعیت‌ها و همان کنترل‌کننده‌های دکمهٔ اصلی صفحه
  const stickyAction = isOutOfStock ? (
    <button type="button" disabled className="h-11 flex-1 cursor-not-allowed rounded-xl bg-gray-400 text-sm font-medium text-white">
      ناموجود
    </button>
  ) : isInCart ? (
    <button
      type="button"
      onClick={() => router.push("/cart")}
      className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-900 text-sm font-medium text-white transition hover:bg-gray-800 active:scale-[0.98]"
    >
      <BaggageClaim className="h-5 w-5" />
      مشاهده سبد خرید
    </button>
  ) : (
    <button
      type="button"
      onClick={handleAddToCart}
      className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-medium text-white transition hover:bg-brand-700 active:scale-[0.98]"
    >
      <AddShoppingCartIcon className="h-5 w-5" />
      افزودن به سبد خرید
    </button>
  );

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 py-2 sm:py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div ref={stageRef} className="relative overflow-hidden rounded-xl bg-white shadow-lg">
          {photos.length > 0 ? (
            <>
              {/* تصویر کل کادر را پر می‌کند (object-cover، کادر ۴:۳ مثل بیشتر عکس‌های محصول)؛ اسلایدر مثل بنر صفحهٔ اصلی ولی بدون جابه‌جایی خودکار */}
              <ImageSlider
                ref={sliderRef}
                images={photos}
                label={product.name}
                className="relative aspect-[4/3] w-full bg-gray-100"
                onIndexChange={setActive}
                renderSlide={(src, index, { load }) => (
                  <button
                    type="button"
                    onClick={() => setZoomOpen(true)}
                    aria-label="بزرگ‌نمایی تصویر محصول"
                    className="group relative block h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
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
                <ul className="no-scrollbar mx-auto flex w-max max-w-full gap-2 overflow-x-auto p-3" aria-label="تصویرهای محصول">
                  {photos.map((src, index) => (
                    <li key={src} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => showPhoto(index)}
                        aria-label={`نمایش تصویر ${fa(index + 1)} از ${fa(photos.length)}`}
                        aria-current={index === current ? "true" : undefined}
                        className={`relative block h-16 w-16 cursor-pointer overflow-hidden rounded-lg border bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                          index === current ? "border-brand-600 ring-1 ring-brand-600" : "border-gray-200 opacity-75 hover:border-gray-300 hover:opacity-100"
                        }`}
                      >
                        <AppImage src={src} alt="" fill sizes="64px" className="object-cover" />
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
            <div className="discount-chip left-3 top-3">
              <span className="discount-chip__value">{fa(product.discount)}٪</span>
              <span className="discount-chip__label">تخفیف</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4" dir="rtl">
          <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
          <RatingSummary comments={initialComments} />
          <div className="flex items-center gap-3 text-xl font-semibold">
            {product.discount > 0 ? (
              <>
                <span className="line-through text-gray-400 text-lg">
                  {product.price.toLocaleString("fa-IR")} تومان
                </span>
                <span className="text-brand-600 text-2xl">
                  {(product.price - (product.price * product.discount) / 100).toLocaleString("fa-IR")}{" "}
                  تومان
                </span>
              </>
            ) : (
              <span className="text-brand-600 text-2xl">
                {product.price.toLocaleString("fa-IR")} تومان
              </span>
            )}
          </div>
          {!isOutOfStock && (
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-semibold">تعداد:</span>
              <div className="flex items-center gap-2 border rounded-xl px-3 py-1">
                <button
                  onClick={decreaseQuantity}
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition cursor-pointer"
                  disabled={quantity <= 1}
                  data-tooltip-id="decrease-tooltip"
                  data-tooltip-content="کاهش تعداد"
                >
                  <span className="mb-1">-</span>
                </button>
                <span className="text-lg font-medium">{quantity.toLocaleString('fa-IR')}</span>
                <button
                  onClick={increaseQuantity}
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition cursor-pointer"
                  disabled={quantity >= maxQuantity}
                  data-tooltip-id="increase-tooltip"
                  data-tooltip-content="افزایش تعداد"
                >
                  <span className="mb-1">+</span>
                </button>
              </div>
            </div>
          )}
          <div ref={actionsRef} className="flex gap-2">
            {!isOutOfStock && (
              <>
                {isInCart ? (
                  <div className="flex gap-2 flex-1">
                    <button
                      onClick={() => router.push("/cart")}
                      className="w-full flex items-center justify-center gap-1 py-3 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition cursor-pointer"
                    >
                      <BaggageClaim className="w-5 h-5" />
                      مشاهده سبد خرید
                    </button>

                    <button
                      onClick={handleRemoveFromCart}
                      className="w-12 h-12 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center justify-center cursor-pointer"
                      data-tooltip-id="remove-cart-tooltip"
                      data-tooltip-content="حذف از سبد خرید"
                    >
                      <Icon path={mdiCartRemove} className="w-6 h-6 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="flex items-center justify-center gap-1 flex-1 py-3 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition cursor-pointer"
                  >
                    <AddShoppingCartIcon className="w-5 h-5" />
                    افزودن به سبد خرید
                  </button>
                )}
              </>
            )}
            {isOutOfStock && (
              <button disabled className="flex-1 bg-gray-400 text-white py-3 rounded-lg cursor-not-allowed">
                ناموجود
              </button>
            )}
            <button
              onClick={handleFavoriteToggle}
              className="w-12 h-12 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center justify-center cursor-pointer"
              data-tooltip-id="favorite-tooltip"
              data-tooltip-content={isFavorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
            >
              {isFavorite ? (
                <Icon path={mdiHeart} className="w-5 h-5 text-red-500" />
              ) : (
                <Icon path={mdiHeartPlusOutline} className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-brand-600" aria-hidden="true" />
              ارسال به سراسر کشور
            </span>
            <span className="flex items-center gap-1.5">
              <PackageCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />
              ارسال رایگان در تهران
            </span>
          </div>
          {/* تماس: اگر کاربر سؤال یا نیاز به خرید تلفنی دارد؛ روی موبایل با لمس شماره‌گیر باز می‌شود */}
          <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">
              <Headset className="h-4 w-4 text-brand-600" aria-hidden="true" />
              برای مشاوره و خرید تلفنی تماس بگیرید
            </p>
            <div className="flex flex-wrap gap-2">
              {STORE.phones.map((phone) => (
                <a
                  key={phone.href}
                  href={phone.href}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <Phone className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  <span className="text-gray-500">{phone.label}</span>
                  <span dir="ltr" className="font-medium">
                    {phone.display}
                  </span>
                </a>
              ))}
            </div>
          </div>
          <SellerBox sellerName={product.seller || "فروشگاه چرخ خیاطی ارکیده"} />
          {inventoryText && (
            <div className="bg-gray-50 border rounded-lg p-4 text-base text-gray-700">
              <strong>موجودی:</strong> {inventoryText}
            </div>
          )}
        </div>
      </div>
      <div className="mt-8 space-y-6">
        {specs.length > 0 && (
          <div className="bg-white p-4 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">مشخصات کلی</h3>
            <ul className="space-y-1 text-gray-600 text-base" dir="rtl">
              {specs.map(([label, value]) => (
                <li key={label}><strong>{label}:</strong> {value}</li>
              ))}
            </ul>
          </div>
        )}
        {extras.length > 0 && (
          <div className="bg-white p-4 rounded-xl shadow-md">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex justify-between w-full text-gray-700 font-semibold hover:text-pink-500 cursor-pointer"
            >
              <span>مشاهده ویژگی‌های بیشتر</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </button>
            {isExpanded && (
              <div className="mt-2 text-gray-600 text-base space-y-2" dir="rtl">
                {extras.map(([label, value]) => (
                  <p key={label}><strong>{label}:</strong> {value}</p>
                ))}
              </div>
            )}
          </div>
        )}
        {related.length > 0 && (
          // ردیف برای لبه‌به‌لبه شدن -mx-4 دارد و پدینگ ۱۶ پیکسلی لازم دارد؛ این صفحه روی موبایل فقط ۸ پیکسل دارد، پس ۸ پیکسل دیگر از همین‌جا
          <div className="px-2 sm:px-0">
            <ProductRail
              id="related-products"
              title="محصولات مرتبط"
              subtitle={product.Category?.name ? `از دستهٔ ${product.Category.name}` : undefined}
              href={categoryHref}
              hint={product.Category?.name ? `همهٔ محصولات ${product.Category.name}` : undefined}
              products={related}
            />
          </div>
        )}
        {/* تکیه‌گاه لینک امتیاز بالای صفحه: scroll-mt جای هدر ثابت را نگه می‌دارد */}
        <section id="comments" tabIndex={-1} aria-label="نظرات کاربران" className="scroll-mt-24 outline-none">
          <ProductComments productId={product.id} initialComments={initialComments} />
        </section>
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
      <Tooltip id="decrease-tooltip" />
      <Tooltip id="increase-tooltip" />
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

      @keyframes dialogShake {
        0%   { transform: translateX(0); }
        20%  { transform: translateX(-8px); }
        40%  { transform: translateX(8px); }
        60%  { transform: translateX(-5px); }
        80%  { transform: translateX(5px); }
        100% { transform: translateX(0); }
      }
    `}</style>
  </div>
  );
}