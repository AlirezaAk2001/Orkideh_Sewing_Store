"use client";

import Link from "next/link";
import { Mail, MapPin, Phone, Smartphone } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import AppImage from "./AppImage";
import { STORE } from "@/lib/contact";

const LINKS = [
  { href: "/products", label: "همه محصولات" },
  { href: "/cart", label: "سبد خرید" },
  { href: "/favorites", label: "علاقه‌مندی‌ها" },
  { href: "/profile", label: "حساب کاربری" },
  { href: "/about", label: "درباره ما و تماس" },
];

export default function Footer() {
  // سال شمسی با رقم فارسی، مثل بقیهٔ سایت
  const persianYear = new Date().toLocaleDateString("fa-IR-u-ca-persian", { year: "numeric" });

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-12" dir="rtl">
        <div className="md:col-span-5">
          <div className="flex items-center gap-3">
            <AppImage
              src="/image/logo.png"
              alt="لوگوی فروشگاه ارکیده"
              width={48}
              height={48}
              className="h-12 w-12 rounded-full border border-white/20 object-cover"
            />
            <p className="text-lg font-bold text-white">{STORE.name}</p>
          </div>
          <p className="mt-4 max-w-md text-sm leading-7 text-gray-400">
            فروش و تعمیرات تخصصی چرخ خیاطی و لوازم جانبی. برای انتخاب مدل مناسب یا هماهنگی تعمیر با ما تماس بگیرید.
          </p>
          <a
            href={STORE.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="اینستاگرام فروشگاه ارکیده"
            className="mt-5 inline-grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-brand-600"
          >
            <FaInstagram size={20} />
          </a>
        </div>

        <nav className="md:col-span-3" aria-label="دسترسی سریع">
          <h2 className="text-base font-bold text-white">دسترسی سریع</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-4">
          <h2 className="text-base font-bold text-white">تماس با ما</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
              {STORE.address}
            </li>
            {STORE.phones.map((phone, index) => (
              <li key={phone.href} className="flex items-center gap-2">
                {index === 0 ? (
                  <Phone className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
                ) : (
                  <Smartphone className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
                )}
                <a href={phone.href} className="transition-colors hover:text-white">
                  {phone.display}
                </a>
              </li>
            ))}
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
              <a href={`mailto:${STORE.email}`} dir="ltr" className="transition-colors hover:text-white">
                {STORE.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="container mx-auto px-4 py-4 text-center text-xs text-gray-500 sm:text-sm" dir="rtl">
          {STORE.name} {persianYear} © - تمامی حقوق محفوظ است.
        </p>
      </div>
    </footer>
  );
}
