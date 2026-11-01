import Link from "next/link";
import { ArrowRight, CreditCard, Headset, Ruler, Scissors, Spool, Truck, Wrench } from "lucide-react";
import SiteLogo from "@/app/components/SiteLogo";
import { LOGO } from "@/lib/siteLogo";
import { STORE } from "@/lib/contact";

// همان مزیت‌هایی که صفحهٔ اصلی نشان می‌دهد
const POINTS = [
  { icon: Truck, title: "ارسال به سراسر کشور", text: "ارسال رایگان در تهران" },
  { icon: Wrench, title: "تعمیرات تخصصی", text: "سرویس و تعمیر چرخ خیاطی" },
  { icon: CreditCard, title: "پرداخت امن آنلاین", text: "از طریق درگاه پرداخت" },
  { icon: Headset, title: "مشاوره تلفنی", text: "راهنمایی برای انتخاب چرخ" },
];

// آیکون‌های شناور پس‌زمینهٔ پنل؛ موقعیت و سرعت هرکدام فرق می‌کند تا هم‌زمان حرکت نکنند
const FLOATERS = [
  { icon: Spool, className: "right-[9%] top-[10%] h-14 w-14", style: { "--r": "-8deg", "--dur": "9s" } },
  { icon: Scissors, className: "left-[8%] top-[36%] h-12 w-12", style: { "--r": "12deg", "--dur": "11s", "--delay": "-3s" } },
  { icon: Ruler, className: "right-[12%] top-[62%] h-12 w-12", style: { "--r": "-18deg", "--dur": "10s", "--delay": "-6s" } },
];

// دو خط بخیه؛ mask با pathLength=1 آن‌ها را هنگام ورود کم‌کم «می‌دوزد»
const STITCHES = [
  { id: "auth-stitch-a", d: "M-20 150 C 110 70, 210 230, 350 140 S 590 40, 830 130", opacity: 0.55, width: 3 },
  { id: "auth-stitch-b", d: "M-20 196 C 130 130, 260 250, 420 186 S 640 120, 830 176", opacity: 0.3, width: 2.5 },
];

function Brand({ className = "" }) {
  return (
    <Link href="/" aria-label={`${STORE.name}، صفحهٔ اصلی`} className={`flex items-center gap-2.5 ${className}`}>
      <SiteLogo
        src={LOGO}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 rounded-full border border-gray-200 object-cover"
      />
      <span className="whitespace-nowrap text-sm font-bold text-gray-800">{STORE.name}</span>
    </Link>
  );
}

// قالب مشترک صفحه‌های ورود: در دسکتاپ فرم کنار پنل برند می‌نشیند، در موبایل فقط فرم با نوار بالایی. هدر و فوتر سایت در این صفحه‌ها نیست (ConditionalLayout)
export default function AuthShell({
  children,
  heading = "به فروشگاه ارکیده خوش آمدید",
  lead = "برای ثبت سفارش، پیگیری خرید و ذخیرهٔ علاقه‌مندی‌ها وارد حساب خود شوید.",
}) {
  return (
    <div className="relative flex min-h-dvh flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="relative flex min-h-dvh flex-col bg-gradient-to-b from-brand-50 via-white to-white lg:min-h-0">
        <div aria-hidden="true" className="h-1 bg-gradient-to-l from-brand-500 via-brand-600 to-brand-700 lg:hidden" />
        <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <Brand className="lg:hidden" />
          <Link
            href="/"
            aria-label="بازگشت به فروشگاه"
            className="btn-3d inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            <span className="sm:hidden">فروشگاه</span>
            <span className="hidden sm:inline">بازگشت به فروشگاه</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-8 pt-1 sm:px-8">
          <div className="w-full">{children}</div>
        </div>
      </section>

      <aside aria-hidden="true" className="auth-panel relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-center lg:px-8 lg:py-14 xl:px-12">
        {FLOATERS.map(({ icon: Icon, className, style }) => (
          <Icon key={className} className={`auth-float absolute text-white/20 ${className}`} style={style} strokeWidth={1.25} />
        ))}

        <svg className="absolute inset-x-0 bottom-0 h-[38%] w-full" viewBox="0 0 800 260" preserveAspectRatio="xMidYMax slice" fill="none">
          <defs>
            {STITCHES.map((s) => (
              <mask key={s.id} id={s.id} maskUnits="userSpaceOnUse" x="-40" y="0" width="900" height="260">
                <path className="auth-stitch-reveal" d={s.d} pathLength="1" stroke="#fff" strokeWidth="14" strokeLinecap="round" />
              </mask>
            ))}
          </defs>
          {STITCHES.map((s) => (
            <path key={s.id} className="auth-stitch" d={s.d} mask={`url(#${s.id})`} stroke="#fff" strokeOpacity={s.opacity} strokeWidth={s.width} strokeLinecap="round" />
          ))}
        </svg>

        {/* متن زیر عنوان عمداً در یک خط است (whitespace-nowrap)؛ عرض و اندازهٔ قلم طوری است که طولانی‌ترین متن (۵۳۵px در قلم ۱۶) در پنل ≥۱۲۸۰px و در قلم ۱۴ در پنل ۴۷۳px جا شود */}
        <div className="relative z-10 mx-auto w-full max-w-xl">
          <SiteLogo
            src={LOGO}
            alt=""
            width={96}
            height={96}
            className="auth-rise auth-glow h-24 w-24 rounded-full border-2 border-white/40 object-cover shadow-xl"
          />
          <h2 className="auth-rise mt-7 text-balance text-3xl font-extrabold leading-snug xl:text-4xl" style={{ "--i": 1 }}>
            {heading}
          </h2>
          <p className="auth-rise mt-3 whitespace-nowrap text-sm leading-8 text-white/85 xl:text-base" style={{ "--i": 2 }}>
            {lead}
          </p>
          <ul className="mt-9 grid grid-cols-2 gap-3">
            {POINTS.map(({ icon: Icon, title, text }, i) => (
              <li
                key={title}
                className="auth-rise flex items-start gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm"
                style={{ "--i": 3 + i }}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-white/75">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
