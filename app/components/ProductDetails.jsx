"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, BaggageClaim } from "lucide-react";
import { Tooltip } from 'react-tooltip';
import { useCart, useFavorites, useAuth } from "@/lib/context";
import SellerBox from "./SellerBox";
import ProductComments from "./ProductComments";
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import Icon from "@mdi/react";
import { mdiCartRemove, mdiCartMinus, mdiHeart, mdiHeartPlusOutline, mdiHeartMinusOutline, mdiCloseCircleOutline, mdiDeleteCircleOutline } from "@mdi/js";
import toast, { Toaster } from "react-hot-toast";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

export default function ProductDetails({ slug }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { addToCart, cartItems = [], removeFromCart } = useCart();
  const { addToFavorites, removeFromFavorites, favorites = [] } = useFavorites();
  const [product, setProduct] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Dialog state برای تأییدیه‌های حذف
  const [dialog, setDialog] = useState({ open: false, type: null }); // type: 'cart' | 'favorite'
  const [shake, setShake] = useState(false);
  const handleCloseDialog = () => setDialog({ open: false, type: null });
  const handleBackdropClick = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  function toLatinSlug(input) {
    const persianToLatin = {
      'س': 's', 'ر': 'r', 'د': 'd', 'و': 'oo', 'ز': 'z',
      'آ': 'a', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't',
      'ث': 's', 'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh',
      'ذ': 'z', 'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a',
      'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ک': 'k', 'گ': 'g',
      'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'ی': 'y',
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    };
    return input
      .split('')
      .map(char => persianToLatin[char] || char)
      .join('')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
  }

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const decodedSlug = decodeURIComponent(slug);
        const latinSlug = toLatinSlug(decodedSlug);
        console.log(`Fetching product with slug: ${decodedSlug}, Latin slug: ${latinSlug}`);
        const res = await fetch(`/api/admin/products/by-slug/${encodeURIComponent(latinSlug)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        console.log(`Fetch response status: ${res.status}, statusText: ${res.statusText}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("Fetch error data:", errorData);
          throw new Error(errorData.error || `Failed to fetch product (status: ${res.status}, statusText: ${res.statusText})`);
        }
        const data = await res.json();
        console.log("Fetched product data:", data);
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", {
          message: error.message,
          stack: error.stack,
        });
        toast.error(`خطا در بارگذاری محصول: ${error.message}`);
      }
    };
    if (slug) fetchProduct();
  }, [slug]);

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

if (!product) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Image
        src="/image/logo.png"
        alt="در حال بارگذاری جزئیات محصول..."
        width={80}
        height={80}
        className="animate-spin object-contain"
        priority
      />
      <p className="mt-4 text-gray-500 text-sm font-medium animate-pulse">
        در حال بارگذاری جزئیات محصول...
      </p>
    </div>
  );
}

  const approvedComments = product?.comments?.filter((c) => c.approved === true) || [];
  const totalVotes = approvedComments.length;
  const averageRating =
    totalVotes > 0
      ? (approvedComments.reduce((acc, comment) => acc + (comment.rating || 0), 0) / totalVotes).toFixed(1)
      : 0;

  // موجودی کالا
  const stock = product?.stock;
  const hasStockValue = stock !== null && stock !== undefined && stock !== "";
  const stockNumber = hasStockValue ? Number(stock) : null;
  const isAccessories = product.Category?.name === "لوازم جانبی";
  const isOutOfStock = hasStockValue && stockNumber <= 0;

  const renderInventory = () => {
    if (isAccessories) {
      if (stock === 0) return "ناموجود";
      return "موجود";
    }
    if (stock === 0) return "ناموجود";
    if (stock == null || stock === "") return "نامشخص";
    return `${stock.toLocaleString("fa-IR")} عدد`;
  };

  const increaseQuantity = () => {
    if (!isAccessories && quantity >= stockNumber) {
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
      toast("برای افزودن به سبد خرید، لطفاً ابتدا وارد حساب کاربری خود شوید.", { icon: "⚠️" });
      setTimeout(() => router.push("/auth"), 2000);
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

    toast.success("محصول با موفقیت به سبد خرید شما اضافه شد.");

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
    toast("محصول از سبد خرید شما حذف شد.", { icon: "🗑️" });
  };

  const handleFavoriteToggle = () => {
    if (!currentUser) {
      toast("برای افزودن به علاقه‌مندی‌ها، ابتدا وارد حساب کاربری خود شوید.", { icon: "⚠️" });
      setTimeout(() => router.push("/auth"), 2000);
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
    toast("محصول از علاقه‌مندی‌های شما حذف شد.", { icon: "🗑️" });
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 py-2 sm:py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="relative bg-white rounded-xl shadow-lg p-4 flex justify-center items-center">
          {product.discount && product.discount > 0 && (
            <div className="absolute top-4 left-4 w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center overflow-hidden">
            {/* افکت برق زدن (شاین) */}
            <div className="absolute inset-0 w-full h-full shine-animation"></div>
              <span className="text-white font-bold text-sm z-10">{product.discount.toLocaleString("fa-IR")}%</span>
            </div>
          )}
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              width={500}
              height={500}
              className="w-full h-72 md:h-96 object-contain"
            />
          ) : (
            <div className="w-full h-72 md:h-96 bg-gray-200 flex items-center justify-center">
              بدون تصویر
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4" dir="rtl">
          <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
          <div className="flex items-center gap-3 text-xl font-semibold">
            {product.discount > 0 ? (
              <>
                <span className="line-through text-gray-400 text-lg">
                  {product.price.toLocaleString("fa-IR")} تومان
                </span>
                <span className="text-pink-600 text-2xl">
                  {(product.price - (product.price * product.discount) / 100).toLocaleString("fa-IR")}{" "}
                  تومان
                </span>
              </>
            ) : (
              <span className="text-pink-600 text-2xl">
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
                  disabled={!isAccessories && quantity >= stockNumber}
                  data-tooltip-id="increase-tooltip"
                  data-tooltip-content="افزایش تعداد"
                >
                  <span className="mb-1">+</span>
                </button>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            {!isOutOfStock && (
              <>
                {isInCart ? (
                  <div className="flex gap-2 flex-1">
                    <button
                      onClick={() => router.push("/cart")}
                      className="w-full flex items-center justify-center gap-1 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition cursor-pointer"
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
                    className="flex items-center justify-center gap-1 flex-1 py-3 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition cursor-pointer"
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
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">🚚 ارسال به سراسر کشور</span>
            <span className="flex items-center gap-1">📦 ارسال رایگان در تهران</span>
          </div>
          <SellerBox sellerName={product.seller || "فروشگاه چرخ خیاطی ارکیده"} />
          <div className="bg-gray-50 border rounded-lg p-4 text-base text-gray-700">
            <strong>موجودی:</strong> {renderInventory()}
          </div>
        </div>
      </div>
      <div className="mt-8 space-y-6">
        <div className="bg-white p-4 rounded-xl shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">مشخصات کلی</h3>
          <ul className="space-y-1 text-gray-600 text-base" dir="rtl">
            <li><strong>جنس:</strong> {product.material || "نامشخص"}</li>
            <li><strong>ابعاد:</strong> {product.size || "نامشخص"}</li>
            <li><strong>وزن:</strong> {product.weight || "نامشخص"}</li>
            {product.color && <li><strong>رنگ:</strong> {product.color}</li>}
            {product.voltage && <li><strong>ولتاژ:</strong> {product.voltage}</li>}
            {product.powerConsumption && <li><strong>توان مصرفی:</strong> {product.powerConsumption}</li>}
          </ul>
        </div>
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
              <p><strong>توضیحات:</strong> {product.additionalFeatures || "—"}</p>
              <p><strong>مناسب برای:</strong> {product.suitableFor || "نامشخص"}</p>
            </div>
          )}
        </div>
        <ProductComments productId={product.id} />
      </div>

      {/* Tooltip Definitions - فقط برای ۵ مورد درخواستی */}
      <Tooltip id="decrease-tooltip" />
      <Tooltip id="increase-tooltip" />
      <Tooltip id="remove-cart-tooltip" />
      <Tooltip id="favorite-tooltip" />

      {/* Toast */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            fontFamily: "Vazirmatn, sans-serif",
            direction: "rtl",
            borderRadius: "10px",
            fontSize: "14px",
          },
        }}
      />

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
  
      @keyframes shine {
        0% {
          transform: translateX(-150%) translateY(-150%) rotate(30deg);
        }
        30%, 100% {
          transform: translateX(150%) translateY(150%) rotate(30deg);
        }
      }
  
      .shine-animation {
        background: linear-gradient(
          120deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.6) 50%,
        rgba(255, 255, 255, 0) 100%
      );
      animation: shine 3s infinite ease-in-out;
      pointer-events: none;
    }
    `}</style>
  </div>
  );
}