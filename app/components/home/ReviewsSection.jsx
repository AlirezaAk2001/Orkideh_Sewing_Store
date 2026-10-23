import Link from "next/link";
import { Quote, Star } from "lucide-react";
import SectionHeading from "./SectionHeading";

// آخرین نظرهای تأییدشدهٔ مشتریان؛ فقط نام کوچک نویسنده نمایش داده می‌شود
export default function ReviewsSection({ reviews }) {
  // «نظر مشتریان» برای یک و چند نظر درست است؛ فقط زیرعنوان مفرد می‌شود
  const subtitle = reviews.length === 1 ? "آخرین نظر ثبت‌شده برای محصولات فروشگاه" : "آخرین نظرهای ثبت‌شده برای محصولات فروشگاه";
  return (
    <section aria-labelledby="home-reviews">
      <SectionHeading id="home-reviews" title="نظر مشتریان" subtitle={subtitle} />
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <li key={review.id} className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-gray-200">
            <div className="flex items-start justify-between gap-3">
              <Quote className="h-7 w-7 text-brand-200" aria-hidden="true" />
              {review.rating > 0 && (
                <div className="flex gap-0.5" role="img" aria-label={`امتیاز ${review.rating.toLocaleString("fa-IR")} از ۵`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-4 w-4 ${n <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              )}
            </div>
            <p className="mt-3 line-clamp-4 flex-1 text-sm leading-7 text-gray-700">{review.text}</p>
            <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                {review.author.charAt(0)}
              </span>
              <div className="min-w-0 text-sm">
                <p className="font-medium text-gray-800">{review.author}</p>
                {review.Product?.slug ? (
                  <Link
                    href={`/products/${review.Product.slug}`}
                    className="block truncate text-xs text-gray-500 transition-colors hover:text-brand-600"
                  >
                    درباره {review.Product.name}
                  </Link>
                ) : (
                  <p className="truncate text-xs text-gray-500">درباره {review.Product?.name}</p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
