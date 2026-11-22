import Link from "next/link";
import { Cog, Droplets, MapPin, Phone, Smartphone, Star, Store, Wrench } from "lucide-react";
import CountUp from "./CountUp";
import { STORE } from "@/lib/contact";
import "./service.css";

// خدمت‌های فروشگاه؛ متن این بخش پیشنهادی است و مالک فروشگاه بازبینی کند (ادعایی مثل «گارانتی» یا «تعمیر در همان روز» عمداً نیامده)
const SERVICES = [
  { icon: Wrench, title: "تعمیر و عیب‌یابی", text: "ایراد چرخ خیاطی‌تان را بررسی و برطرف می‌کنیم" },
  { icon: Droplets, title: "سرویس و روغن‌کاری", text: "سرویس دوره‌ای برای کار روان‌تر چرخ" },
  { icon: Cog, title: "لوازم جانبی و قطعات", text: "لوازم و قطعات موردنیاز چرخ خیاطی" },
];

// مرکز فروش و خدمات: پنل آلبالویی (استایل در service.css)؛ سمت راست عنوان و آدرس و دکمه‌ها و سمت چپ کاشی‌های شیشه‌ای (عکسی از خود فروشگاه نداریم، پس عکس نیست).
// reviewStats: { count, average } آمار واقعی نظرهای تأییدشدهٔ مشتریان است که HomeContent می‌دهد؛ کاشی آخر (با عدد شمارشی) فقط وقتی نظری ثبت شده باشد می‌آید
// (آمار محصول و برند همان بالا در هیرو است و اینجا تکرار نمی‌شود).
export default function ServiceSection({ reviewStats = { count: 0, average: 0 } }) {
  const { count, average } = reviewStats;

  return (
    <section aria-labelledby="home-service" className="svc">
      <div className="svc-text">
        <span className="svc-eyebrow">
          <Store size={16} aria-hidden="true" />
          مرکز فروش و خدمات
        </span>
        <h2 id="home-service">فروش و تعمیرات تخصصی چرخ خیاطی</h2>
        <p className="svc-p">
          چرخ خیاطی خود را برای تعمیر و سرویس به ما بسپارید، یا برای انتخاب مدل مناسب با کارشناسان فروشگاه مشورت کنید.
        </p>

        <address className="svc-addr">
          <p>
            <MapPin aria-hidden="true" />
            {STORE.address}
          </p>
          {STORE.phones.map((phone, index) => (
            <p key={phone.href}>
              {index === 0 ? <Phone aria-hidden="true" /> : <Smartphone aria-hidden="true" />}
              <span>
                {phone.label}: <a href={phone.href}>{phone.display}</a>
              </span>
            </p>
          ))}
        </address>

        <div className="svc-ctas">
          <a
            href={STORE.phones[0].href}
            className="svc-btn btn-lift inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 active:scale-[0.98]"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            تماس و هماهنگی
          </a>
          <Link
            href="/about"
            className="btn-lift inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            نقشه و اطلاعات تماس
          </Link>
        </div>
      </div>

      <ul className="svc-tiles">
        {SERVICES.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className="svc-tile" style={{ "--i": index }}>
            <span className="svc-tile-i">
              <Icon size={22} aria-hidden="true" />
            </span>
            <b>{title}</b>
            <p>{text}</p>
          </li>
        ))}
        {count > 0 && (
          <li className="svc-tile" style={{ "--i": SERVICES.length }}>
            <span className="svc-tile-i">
              <Star size={22} className="fill-white" aria-hidden="true" />
            </span>
            {average > 0 ? (
              <>
                <b className="svc-num">
                  <CountUp to={average} decimals={1} />
                </b>
                <p>
                  میانگین امتیاز مشتریان، از <CountUp to={count} /> نظر ثبت‌شده
                </p>
              </>
            ) : (
              <>
                <b className="svc-num">
                  <CountUp to={count} />
                </b>
                <p>نظر ثبت‌شده از مشتریان</p>
              </>
            )}
          </li>
        )}
      </ul>
    </section>
  );
}
