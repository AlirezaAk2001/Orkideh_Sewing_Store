import Link from "next/link";
import { CheckCircle2, MapPin, Phone, Smartphone } from "lucide-react";
import AppImage from "../AppImage";
import { STORE } from "@/lib/contact";

// متن این بخش پیشنهادی است؛ مالک فروشگاه بازبینی کند
const POINTS = ["عیب‌یابی و تعمیر چرخ خیاطی", "سرویس و روغن‌کاری دوره‌ای", "فروش لوازم جانبی و قطعات"];

export default function ServiceSection() {
  return (
    <section aria-labelledby="home-service" className="overflow-hidden rounded-3xl bg-gray-900 text-white md:grid md:grid-cols-2">
      <div className="relative min-h-60 md:min-h-full">
        <AppImage
          src="/image/back-auth.webp"
          alt="سالن فروش و مرکز خدمات فروشگاه ارکیده"
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-gray-900/70 via-transparent to-transparent md:bg-linear-to-l md:from-transparent md:to-gray-900/30" />
      </div>

      <div className="p-6 sm:p-10">
        <p className="text-sm font-medium text-brand-200">مرکز فروش و خدمات</p>
        <h2 id="home-service" className="mt-2 text-2xl font-bold sm:text-3xl">
          فروش و تعمیرات تخصصی چرخ خیاطی
        </h2>
        <p className="mt-3 leading-7 text-gray-300">
          چرخ خیاطی خود را برای تعمیر و سرویس به ما بسپارید، یا برای انتخاب مدل مناسب با کارشناسان فروشگاه مشورت کنید.
        </p>

        <ul className="mt-5 space-y-2">
          {POINTS.map((point) => (
            <li key={point} className="flex items-center gap-2 text-sm text-gray-200">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>

        <address className="mt-6 space-y-2 text-sm not-italic text-gray-300">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
            {STORE.address}
          </p>
          {STORE.phones.map((phone, index) => (
            <p key={phone.href} className="flex items-center gap-2">
              {index === 0 ? (
                <Phone className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
              ) : (
                <Smartphone className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
              )}
              {phone.label}:{" "}
              <a href={phone.href} className="font-medium text-white hover:underline">
                {phone.display}
              </a>
            </p>
          ))}
        </address>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={STORE.phones[0].href}
            className="btn-3d inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 active:scale-[0.98]"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            تماس و هماهنگی
          </a>
          <Link
            href="/about"
            className="btn-3d inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            نقشه و اطلاعات تماس
          </Link>
        </div>
      </div>
    </section>
  );
}
