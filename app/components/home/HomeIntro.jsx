import Link from "next/link";
import { Truck, Wrench, CreditCard, Headset, PackageSearch, Phone } from "lucide-react";
import { STORE } from "@/lib/contact";

// فقط چیزهایی که خود سایت همین حالا دارد (ارسال، تعمیرات، درگاه پرداخت، تلفن)؛ ادعای «گارانتی» و مانند آن را مالک فروشگاه اضافه کند
const TRUST = [
  { icon: Truck, title: "ارسال به سراسر کشور", text: "ارسال رایگان در تهران" },
  { icon: Wrench, title: "تعمیرات تخصصی", text: "سرویس و تعمیر چرخ خیاطی" },
  { icon: CreditCard, title: "پرداخت امن آنلاین", text: "از طریق درگاه پرداخت" },
  { icon: Headset, title: "مشاوره تلفنی", text: "راهنمایی برای انتخاب چرخ" },
];

export default function HomeIntro() {
  return (
    <section className="relative z-10 mt-4 rounded-2xl bg-white p-5 shadow-lg ring-1 ring-gray-100 md:-mt-10 md:mx-8 md:p-7">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr] lg:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">فروشگاه چرخ خیاطی ارکیده</h1>
          <p className="mt-2 text-base text-gray-600 sm:text-lg">فروش و تعمیرات تخصصی چرخ خیاطی و لوازم جانبی</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="btn-3d inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98] sm:text-base"
            >
              <PackageSearch className="h-5 w-5" aria-hidden="true" />
              مشاهده محصولات
            </Link>
            <a
              href={STORE.phones[0].href}
              className="btn-3d inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 sm:text-base"
            >
              <Phone className="h-5 w-5" aria-hidden="true" />
              تماس با فروشگاه
            </a>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-3">
          {TRUST.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{title}</p>
                <p className="mt-0.5 text-xs leading-5 text-gray-500">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
