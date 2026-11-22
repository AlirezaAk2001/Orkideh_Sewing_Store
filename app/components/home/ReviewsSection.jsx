import Link from "next/link";
import { Quote, Star } from "lucide-react";
import SectionHeading from "./SectionHeading";
import "./marquee.css";

const fa = (n, decimals = 0) => Number(n).toLocaleString("fa-IR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const MARQUEE_MIN = 4; // کمتر از این تعداد نظر، نوار متحرک خالی و تکراری دیده می‌شود: شبکهٔ ثابت می‌آید
const SECONDS_PER_CARD = 15; // سرعت نوار: هر کارت حدود ۱۵ ثانیه در مسیر است

function Stars({ value, size = 16, label }) {
  return (
    <span className="rc-stars" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-gray-300"} aria-hidden="true" />
      ))}
    </span>
  );
}

function ReviewCard({ review, hidden = false }) {
  return (
    <li className="rc" {...(hidden ? { "aria-hidden": "true", inert: true } : {})}>
      <Quote className="rc-q" size={34} aria-hidden="true" />
      {review.rating > 0 && <Stars value={review.rating} label={`امتیاز ${fa(review.rating)} از ۵`} />}
      <p className="rc-text">{review.text}</p>
      <div className="rc-by">
        <span className="rc-av">{review.author.charAt(0)}</span>
        <div className="min-w-0">
          <b>{review.author}</b>
          {review.Product?.slug ? (
            <Link href={`/products/${review.Product.slug}`}>درباره {review.Product.name}</Link>
          ) : (
            <span className="rc-prod">درباره {review.Product?.name}</span>
          )}
        </div>
      </div>
    </li>
  );
}

// آخرین نظرهای تأییدشدهٔ مشتریان؛ فقط نام کوچک نویسنده نمایش داده می‌شود. چهار نظر و بیشتر: نوار متحرک بی‌پایان (با ماندن موس می‌ایستد؛ استایل در marquee.css)،
// کمتر: شبکهٔ ثابت. stats: { count, average } آمار همهٔ نظرهای تأییدشدهٔ فروشگاه برای چیپ امتیاز کنار عنوان (HomeContent می‌دهد؛ صفر یعنی چیپ نیست)
export default function ReviewsSection({ reviews, stats = { count: 0, average: 0 } }) {
  // با یک نظر عنوان و زیرعنوان مفرد می‌شود، مثل ردیف‌های محصول در HomeContent
  const single = reviews.length === 1;
  const title = single ? "نظر مشتریان" : "نظرات مشتریان";
  const subtitle = single ? "آخرین نظر ثبت‌شده برای محصولات فروشگاه" : "آخرین نظرهای ثبت‌شده برای محصولات فروشگاه";
  const loop = reviews.length >= MARQUEE_MIN;

  return (
    <section aria-labelledby="home-reviews">
      <SectionHeading id="home-reviews" eyebrow="نظرات" icon="message" title={title} subtitle={subtitle}>
        {stats.count > 0 && (
          <div className="rc-sum">
            {stats.average > 0 && <b>{fa(stats.average, 1)}</b>}
            <div>
              {stats.average > 0 && <Stars value={stats.average} size={15} label={`میانگین امتیاز ${fa(stats.average, 1)} از ۵`} />}
              <small>از {fa(stats.count)} نظر ثبت‌شده</small>
            </div>
          </div>
        )}
      </SectionHeading>

      {loop ? (
        <div className="mq">
          <ul className="mq-track" style={{ "--mq-dur": `${reviews.length * SECONDS_PER_CARD}s` }}>
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
            {reviews.map((review) => (
              <ReviewCard key={`copy-${review.id}`} review={review} hidden />
            ))}
          </ul>
        </div>
      ) : (
        <ul className="rc-grid">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </ul>
      )}
    </section>
  );
}
