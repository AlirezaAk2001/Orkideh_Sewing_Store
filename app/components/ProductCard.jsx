"use client";

import Link from "next/link";
import AppImage from "./AppImage";
import { useRouter } from "next/navigation";
import { useCart, useAuth } from "@/lib/context";
import { isSoldOut } from "@/lib/stock";
import { toLatinSlug } from "@/lib/slug";
import toast from "react-hot-toast";
import { ImageOff, ShoppingCart, Star } from "lucide-react";

export default function ProductCard({ product, priority = false }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  // میانگین امتیاز و تعداد رای را صفحهٔ سروری حساب کرده (lib/products.js یا lib/categories.js + lib/comments.js)
  const averageRating = product.averageRating ?? 0;
  const totalVotes = product.totalVotes ?? 0;

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

  const slug = product.slug || toLatinSlug(product.name);

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
    // کل کارت قابل کلیک است: لینک روی نام محصول با ::after تمام کارت را می‌پوشاند و دکمهٔ سبد (z-10) بالاتر از آن می‌ماند
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-brand-500">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        {product.image ? (
          <AppImage
            src={product.image}
            alt={product.name}
            width={300}
            height={200}
            priority={priority}
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 36vw, 64vw"
            className={`h-full w-full object-contain p-3 transition duration-500 group-hover:scale-105 ${
              isOutOfStock ? "opacity-50 grayscale" : ""
            }`}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-400">
            <ImageOff className="h-8 w-8" aria-hidden="true" />
            <span className="text-xs">بدون تصویر</span>
          </div>
        )}
        {hasDiscount && (
          <span className="absolute right-2 top-2 rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
            {discount.toLocaleString("fa-IR")}٪ تخفیف
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute inset-x-0 bottom-0 bg-gray-900/70 py-1 text-center text-xs font-medium text-white">
            ناموجود
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <h2 className="text-sm font-semibold leading-6 text-gray-800 sm:text-base">
          <Link
            href={`/products/${slug}`}
            className="line-clamp-2 min-h-12 outline-none after:absolute after:inset-0"
          >
            {product.name}
          </Link>
        </h2>

        {totalVotes > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="font-medium text-gray-700">{averageRating.toLocaleString("fa-IR")}</span>
            <span>({totalVotes.toLocaleString("fa-IR")} رای)</span>
          </div>
        )}

        <div className="mt-auto pt-1">
          {/* قیمت قبل از تخفیف؛ بدون تخفیف هم جایش می‌ماند تا قیمت‌ها در یک ردیف هم‌تراز باشند */}
          <div className="h-4 text-xs text-gray-400 line-through">
            {hasDiscount ? `${price.toLocaleString("fa-IR")} تومان` : ""}
          </div>
          <div className="flex items-baseline gap-1 text-brand-700">
            <span className="text-base font-extrabold sm:text-lg">{finalPrice.toLocaleString("fa-IR")}</span>
            <span className="text-xs">تومان</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`relative z-10 mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition ${
            isOutOfStock
              ? "cursor-not-allowed bg-gray-200 text-gray-500"
              : "cursor-pointer bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.98]"
          }`}
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          <span>{isOutOfStock ? "ناموجود" : "افزودن به سبد خرید"}</span>
        </button>
      </div>
    </article>
  );
}
