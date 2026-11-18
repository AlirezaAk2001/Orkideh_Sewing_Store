// app/about/page.jsx
import Link from "next/link";
import { Headset, Mail, MapPin, Navigation, PackageCheck, Phone, PhoneCall, Ruler, Scissors, Send, ShoppingBag, Smartphone, Spool, Store, Truck, Wrench } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import prisma from "@/lib/prisma";
import { STORE } from "@/lib/contact";
import { listBrandSummaries } from "@/lib/products";
import { listCategories } from "@/lib/categories";
import { pageMetadata } from "@/lib/seo";
import Reveal from "@/app/components/product/Reveal";
import CopyButton from "./CopyButton";
import StoreMap from "./StoreMap";
import "./about.css";

export const metadata = pageMetadata({
  title: "درباره فروشگاه",
  description: "فروشگاه چرخ خیاطی ارکیده: فروش و تعمیرات تخصصی چرخ خیاطی و لوازم جانبی. نشانی، نقشه، شماره‌های تماس و شبکه‌های اجتماعی.",
  path: "/about",
});

// آمار برچسب بالای صفحه همان داده‌های واقعی فروشگاه است. صفحه هر ۱۰ دقیقه تازه می‌شود؛ اگر دیتابیس جواب نداد، فقط ردیف آمار نمایش داده نمی‌شود و بقیهٔ صفحه سالم می‌ماند
export const revalidate = 600;

async function loadStats() {
  try {
    const [products, categories, brands] = await Promise.all([prisma.product.count(), listCategories(), listBrandSummaries()]);
    return [
      { label: "محصول", count: products },
      { label: "برند", count: brands.length },
      { label: "دسته‌بندی", count: categories.length },
    ].filter((item) => item.count > 0);
  } catch (error) {
    console.error("خطا در دریافت آمار صفحهٔ درباره فروشگاه:", error);
    return [];
  }
}

const fa = (n) => Number(n).toLocaleString("fa-IR");

// فقط چیزهایی که خود سایت (فوتر و صفحهٔ محصول) از قبل دربارهٔ فروشگاه می‌گوید
const SERVICES = [
  { icon: ShoppingBag, title: "فروش چرخ خیاطی", text: "چرخ خیاطی در برندها و مدل‌های مختلف، با مشخصات کامل هر محصول در فروشگاه اینترنتی." },
  { icon: Wrench, title: "تعمیرات تخصصی", text: "تعمیر چرخ خیاطی؛ برای هماهنگی تعمیر با ما تماس بگیرید." },
  { icon: Scissors, title: "لوازم جانبی", text: "لوازم جانبی چرخ خیاطی، کنار خودِ دستگاه‌ها در فروشگاه." },
  { icon: Headset, title: "مشاورهٔ انتخاب مدل", text: "نمی‌دانید کدام مدل به کارتان می‌آید؟ تماس بگیرید تا در انتخاب کمکتان کنیم." },
];

export default async function AboutPage() {
  const stats = await loadStats();

  return (
    <div className="ab">
      {/* پس‌زمینه: مش و دانه و نقطه و نخ بخیه، و ابزارهای خیاطی معلق (فقط تزئینی) */}
      <div aria-hidden="true" className="ab-bg">
        <div className="ab-mesh" />
        <div className="ab-grain" />
        <div className="ab-dots" />
        <svg className="ab-thread" viewBox="0 0 1600 620" preserveAspectRatio="none">
          <path d="M-20 440 C 300 300, 520 560, 860 400 S 1400 230, 1640 350" />
        </svg>
        <Scissors className="auth-float absolute right-[3%] top-[46%] hidden h-14 w-14 text-brand-300/50 lg:block" style={{ "--r": "12deg", "--dur": "12s", "--delay": "-4s" }} strokeWidth={1.1} />
        <Spool className="auth-float absolute left-[3%] top-[64%] hidden h-16 w-16 text-brand-300/50 lg:block" style={{ "--r": "-8deg", "--dur": "10s" }} strokeWidth={1.1} />
        <Ruler className="auth-float absolute right-[4%] top-[82%] hidden h-14 w-14 text-brand-300/50 lg:block" style={{ "--r": "-18deg", "--dur": "11s", "--delay": "-7s" }} strokeWidth={1.1} />
      </div>

      <div className="ab-wrap">
        {/* ═════ بالای صفحه ═════ */}
        <section className="ab-hero" aria-labelledby="ab-title">
          <div className="ab-hero-text">
            <p className="ab-chip ab-rise" style={{ "--i": 0 }}>
              <Store aria-hidden="true" />
              فروشگاه چرخ خیاطی ارکیده
            </p>
            <h1 id="ab-title" className="ab-h1 ab-rise" style={{ "--i": 1 }}>
              درباره فروشگاه <em>ارکیده</em>
            </h1>
            <p className="ab-lead ab-rise" style={{ "--i": 2 }}>
              فروش و تعمیرات تخصصی چرخ خیاطی و لوازم جانبی، در قصرالدشت تهران. برای انتخاب مدل مناسب یا هماهنگی تعمیر، با ما تماس بگیرید.
            </p>
            <div className="ab-cta ab-rise" style={{ "--i": 3 }}>
              <Link href="/products" className="btn-lift bar-sheen ab-btn ab-btn--main">
                <ShoppingBag aria-hidden="true" />
                مشاهده محصولات
              </Link>
              <a href="#contact" className="btn-lift ab-btn ab-btn--ghost">
                <PhoneCall aria-hidden="true" />
                تماس با ما
              </a>
            </div>
            <ul className="ab-perks ab-rise" style={{ "--i": 4 }}>
              <li className="ab-perk">
                <Truck aria-hidden="true" />
                ارسال به سراسر کشور
              </li>
              <li className="ab-perk">
                <PackageCheck aria-hidden="true" />
                ارسال رایگان در تهران
              </li>
            </ul>
          </div>

          {/* برچسب آویز با آمار واقعی فروشگاه */}
          <div className="ab-art ab-rise" style={{ "--i": 2 }}>
            <span aria-hidden="true" className="ab-art-glow" />
            <span aria-hidden="true" className="ab-art-f ab-art-f1 auth-float" style={{ "--r": "-8deg", "--dur": "10s" }}>
              <Spool />
            </span>
            <span aria-hidden="true" className="ab-art-f ab-art-f2 auth-float" style={{ "--r": "10deg", "--dur": "12s", "--delay": "-3s" }}>
              <Scissors />
            </span>
            <span aria-hidden="true" className="ab-art-f ab-art-f3 auth-float" style={{ "--r": "-14deg", "--dur": "11s", "--delay": "-6s" }}>
              <Ruler />
            </span>
            <div className="ab-tag">
              <span aria-hidden="true" className="ab-tag-hole" />
              <div className="ab-tag-in">
                <span aria-hidden="true" className="ab-tag-ico">
                  <Store />
                </span>
                <p className="ab-tag-kicker">فروشگاه</p>
                <p className="ab-tag-name">چرخ خیاطی ارکیده</p>
                <p className="ab-tag-sub">فروش · تعمیرات · لوازم جانبی</p>
                {stats.length > 0 && (
                  <dl className="ab-tag-stats" style={{ "--n": stats.length }}>
                    {stats.map((item) => (
                      <div key={item.label}>
                        <dt>{item.label}</dt>
                        <dd>{fa(item.count)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═════ راه‌های ارتباط ═════ */}
        <Reveal base="ab-reveal" as="section" id="contact" className="ab-sec ab-anchor" aria-labelledby="ab-contact-h">
          <header className="ab-sec-h">
            <span aria-hidden="true" className="ab-sec-i">
              <Headset />
            </span>
            <div>
              <h2 id="ab-contact-h">راه‌های ارتباط با ما</h2>
              <p>برای مشاوره خرید یا هماهنگی تعمیر، یکی از راه‌ها را انتخاب کنید.</p>
            </div>
          </header>
          <ul className="ab-cards">
            {STORE.phones.map((phone, index) => (
              <li key={phone.href} className="ab-card ab-st" style={{ "--i": index }}>
                <div className="ab-card-head">
                  <span aria-hidden="true" className="ab-ico">{index === 0 ? <Phone /> : <Smartphone />}</span>
                  <div>
                    <small>{phone.label}</small>
                    <span className="ab-val">{phone.display}</span>
                  </div>
                </div>
                <div className="ab-card-act">
                  <a href={phone.href} className="btn-lift ab-btn ab-btn--soft">
                    <PhoneCall aria-hidden="true" />
                    تماس
                  </a>
                </div>
              </li>
            ))}
            <li className="ab-card ab-st" style={{ "--i": STORE.phones.length }}>
              <div className="ab-card-head">
                <span aria-hidden="true" className="ab-ico"><Mail /></span>
                <div>
                  <small>ایمیل پشتیبانی</small>
                  <span className="ab-val ab-val--mail">{STORE.email}</span>
                </div>
              </div>
              <div className="ab-card-act">
                <a href={`mailto:${STORE.email}`} className="btn-lift ab-btn ab-btn--soft">
                  <Send aria-hidden="true" />
                  ارسال ایمیل
                </a>
                <CopyButton text={STORE.email} label="کپی ایمیل" message="ایمیل کپی شد." />
              </div>
            </li>
          </ul>
        </Reveal>

        {/* ═════ نشانی و نقشه ═════ */}
        <Reveal base="ab-reveal" as="section" id="location" className="ab-sec ab-anchor" aria-labelledby="ab-loc-h">
          <header className="ab-sec-h">
            <span aria-hidden="true" className="ab-sec-i">
              <MapPin />
            </span>
            <div>
              <h2 id="ab-loc-h">نشانی و نقشهٔ فروشگاه</h2>
              <p>برای خرید حضوری یا تحویل و تعمیر دستگاه، به این نشانی بیایید.</p>
            </div>
          </header>
          <div className="ab-mapgrid">
            <div className="ab-loc ab-st" style={{ "--i": 0 }}>
              <span aria-hidden="true" className="ab-ico">
                <Store />
              </span>
              <div>
                <small>نشانی فروشگاه</small>
                <address className="ab-addr">{STORE.address}</address>
              </div>
              <div aria-hidden="true" className="ab-stitch" />
              <div className="ab-loc-act">
                <CopyButton text={STORE.address} label="کپی نشانی" message="نشانی فروشگاه کپی شد." />
                {STORE.mapUrl && (
                  <a href={STORE.mapUrl} target="_blank" rel="noopener noreferrer" className="btn-lift ab-btn ab-btn--soft">
                    <Navigation aria-hidden="true" />
                    مسیریابی با نشان
                  </a>
                )}
              </div>
            </div>
            <div className="ab-st" style={{ "--i": 1 }}>
              <StoreMap lat={STORE.location.lat} lng={STORE.location.lng} name={STORE.name} />
            </div>
          </div>
        </Reveal>

        {/* ═════ خدمات ═════ */}
        <Reveal base="ab-reveal" as="section" className="ab-sec" aria-labelledby="ab-serv-h">
          <header className="ab-sec-h">
            <span aria-hidden="true" className="ab-sec-i">
              <ShoppingBag />
            </span>
            <div>
              <h2 id="ab-serv-h">در فروشگاه ارکیده چه پیدا می‌کنید؟</h2>
              <p>از انتخاب دستگاه تا تعمیر و لوازم جانبی، در یک جا.</p>
            </div>
          </header>
          <ul className="ab-tiles">
            {SERVICES.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="ab-st" style={{ "--i": index }}>
                <div className="ab-tile">
                  <span aria-hidden="true" className="ab-tile-i">
                    <Icon />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* ═════ شبکه‌های اجتماعی ═════ */}
        <Reveal base="ab-reveal" as="section" className="ab-sec" aria-labelledby="ab-social-h">
          <div className="ab-social ab-st" style={{ "--i": 0 }}>
            <span aria-hidden="true" className="ab-social-ico">
              <FaInstagram />
            </span>
            <div>
              <h2 id="ab-social-h">ما را در شبکه‌های اجتماعی دنبال کنید</h2>
              <p>
                تازه‌ترین محصولات و خبرها در اینستاگرام: <span className="ab-handle">@{STORE.instagramHandle}</span>
              </p>
            </div>
            <a href={STORE.instagram} target="_blank" rel="noopener noreferrer" className="btn-lift ab-btn ab-btn--white ab-social-act">
              <FaInstagram aria-hidden="true" />
              دنبال کردن در اینستاگرام
            </a>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
