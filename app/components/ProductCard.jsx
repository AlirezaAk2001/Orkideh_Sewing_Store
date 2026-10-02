"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart, useAuth } from "@/lib/context";
import { isSoldOut } from "@/lib/stock";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import StarRating from "./StarRating";
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';
import Icon from '@mdi/react';
import { mdiBriefcaseEyeOutline } from '@mdi/js';

export default function ProductCard({ product }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const [averageRating, setAverageRating] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);

  const price = parseFloat(product.price) || 0;
  const discount = parseFloat(product.discount) || 0;
  const hasDiscount = discount > 0;
  const finalPrice = product.finalPrice != null
    ? parseFloat(product.finalPrice)
    : hasDiscount
    ? Math.round(price - (price * discount) / 100)
    : price;

  // همان قاعدهٔ سرور (lib/stock.js): موجودی خالی (null) یعنی پیگیری نمی‌شود، نه ناموجود
  const isOutOfStock = isSoldOut(product);

  const toLatinSlug = (name) => {
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
    return name
      .split('')
      .map(char => persianToLatin[char] || char)
      .join('')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
  };

  const slug = product.slug || toLatinSlug(product.name);

  useEffect(() => {
    const approved = (product.comments || []).filter((c) => c.approved === true);
    const votes = approved.length;
    const avg = votes > 0
      ? (approved.reduce((acc, c) => acc + (c.rating || 0), 0) / votes).toFixed(1)
      : 0;
    setAverageRating(parseFloat(avg));
    setTotalVotes(votes);
  }, [product.id, product.comments]);

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

    addToCart({
      id: product.id,
      name: product.name,
      price: finalPrice,
      quantity: 1,
      image: product.image,
    });

    toast.success("محصول موردنظر با موفقیت به سبد خرید اضافه شد!");
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-2 sm:p-3 md:p-4 hover:shadow-xl transition border border-gray-200 w-full flex flex-col h-full">
      <div className="relative flex-shrink-0">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            width={300}
            height={200}
            className={`w-full h-32 sm:h-40 md:h-48 object-contain rounded-lg mb-2 sm:mb-3 ${isOutOfStock ? "opacity-50" : ""}`}
          />
        ) : (
          <div className="w-full h-32 sm:h-40 md:h-48 bg-gray-200 rounded-lg mb-2 sm:mb-3 flex items-center justify-center">
            بدون تصویر
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs sm:text-sm md:text-base font-bold px-1 sm:px-2 py-1 rounded-full">
            {discount.toLocaleString("fa-IR")}% تخفیف
          </div>
        )}
      </div>

      <div className="flex-shrink-0 mb-1 sm:mb-2">
        <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 text-center line-clamp-1">
          {product.name}
        </h2>
        {totalVotes > 0 && (
          <div className="flex items-center justify-center gap-1 sm:gap-2 mt-1 text-xs sm:text-sm md:text-base text-gray-500">
            <StarRating rating={averageRating} />
            <span className="text-xs sm:text-sm md:text-base text-gray-600">
              ({averageRating} - {totalVotes} رای)
            </span>
          </div>
        )}
      </div>

      <div className="flex-grow min-h-[60px] sm:min-h-[65px] md:min-h-[70px] mb-2 sm:mb-3 flex flex-col justify-center">
        <div className="text-right">
          <div className="text-pink-700 text-sm sm:text-base md:text-lg font-bold leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
            {finalPrice.toLocaleString("fa-IR")}{" "}
            <span className="text-xs sm:text-sm md:text-base font-normal">تومان</span>
          </div>
          {hasDiscount && (
            <div className="text-gray-500 text-xs sm:text-sm md:text-base line-through mt-1">
              {price.toLocaleString("fa-IR")} تومان
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 sm:gap-2 flex-shrink-0">
        <button
          onClick={handleAddToCart}
          className={`flex items-center justify-center gap-1 sm:gap-2 py-1 sm:py-2 md:py-2 rounded w-full text-xs sm:text-sm md:text-base font-medium ${
            isOutOfStock
              ? "bg-gray-400 text-gray-800 cursor-not-allowed"
              : "bg-red-500 text-white hover:bg-red-600 cursor-pointer"
          }`}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? (
            <>
              <RemoveShoppingCartIcon fontSize="small" />
              <span>ناموجود</span>
            </>
          ) : (
            <>
              <AddShoppingCartIcon fontSize="small" />
              <span>افزودن به سبد خرید</span>
            </>
          )}
        </button>
        <Link href={`/products/${slug}`}>
          <button className="flex items-center justify-center gap-1 sm:gap-2 bg-pink-600 text-white py-1 sm:py-2 md:py-2 rounded w-full text-xs sm:text-sm md:text-base font-medium hover:bg-pink-700 cursor-pointer">
            <Icon path={mdiBriefcaseEyeOutline} size={0.8} />
            <span>مشاهده جزئیات</span>
          </button>
        </Link>
      </div>
    </div>
  );
}