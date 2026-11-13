"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Icon from "@mdi/react";
import { mdiHeart, mdiHeartPlusOutline } from "@mdi/js";
import toast from "react-hot-toast";
import { useAuth, useFavorites } from "@/lib/context";
import { authUrl } from "@/lib/redirect";

// پنجرهٔ تأیید حذف فقط بعد از اولین نیاز بار می‌شود (MUI Dialog روی همهٔ کارت‌های فهرست سنگین است)
const RemoveDialog = dynamic(() => import("./FavoriteRemoveDialog"), { ssr: false });

// دکمهٔ قلبِ کارت محصول؛ ظاهر و رفتارش همان دکمهٔ علاقه‌مندی صفحهٔ جزئیات محصول است (ProductDetails.jsx): مربع خاکستری گوشه‌گرد، قلب توخالیِ «+» خاکستری که بعد از افزودن
// قلب پرِ قرمز با جهش (heart-pop) می‌شود، راهنمای «افزودن/حذف …»، کاربرِ وارد‌نشده پیام و انتقال به ورود، و حذف با پنجرهٔ تأیید.
// product: { id, name, slug, image, price (قیمت اصلی), discount, finalPrice }. راهنمای شناور (Tooltip card-favorite-tooltip) یک‌بار در Header تعریف شده است
export default function FavoriteButton({ product, className = "" }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { addToFavorites, removeFromFavorites, favorites = [] } = useFavorites();
  const [heartPop, setHeartPop] = useState(false);
  const [askMounted, setAskMounted] = useState(false); // بعد از اولین پرسش پنجره می‌ماند تا انیمیشن بسته شدنش هم دیده شود
  const [askOpen, setAskOpen] = useState(false);

  const isFavorite = Array.isArray(favorites) && favorites.some((item) => item.id === product.id);
  const label = isFavorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها";

  const toggle = () => {
    if (!currentUser) {
      toast("برای افزودن محصول موردنظر به علاقه‌مندی‌ها، ابتدا وارد حساب کاربری خود شوید.", { icon: "⚠️" });
      setTimeout(() => router.push(authUrl(window.location.pathname)), 2000);
      return;
    }

    if (isFavorite) {
      setAskMounted(true);
      setAskOpen(true);
      return;
    }

    // همان داده‌ای که صفحهٔ جزئیات می‌فرستد: قیمت نهایی، قیمت و درصد قبل از تخفیف (فقط وقتی تخفیف واقعی است)، لینک و تصویر برای کارت علاقه‌مندی‌های پنل
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
    toast.success("محصول با موفقیت به علاقه‌مندی‌های شما اضافه شد.");
  };

  const confirmRemove = () => {
    removeFromFavorites(product.id);
    setAskOpen(false);
    toast("محصول موردنظر از علاقه‌مندی‌های شما حذف شد.", { icon: "🗑️" });
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-pressed={isFavorite}
        className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 ${className}`}
        data-tooltip-id="card-favorite-tooltip"
        data-tooltip-content={label}
      >
        {isFavorite ? (
          <Icon path={mdiHeart} className={`h-5 w-5 text-red-500 ${heartPop ? "heart-pop" : ""}`} />
        ) : (
          <Icon path={mdiHeartPlusOutline} className="h-5 w-5 text-gray-600" />
        )}
      </button>
      {askMounted && <RemoveDialog open={askOpen} name={product.name} onClose={() => setAskOpen(false)} onConfirm={confirmRemove} />}
    </>
  );
}
