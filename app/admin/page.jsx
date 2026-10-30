"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Icon from '@mdi/react';
import { mdiPanoramaVariantOutline, mdiCommentAccountOutline, mdiAccountFileText } from '@mdi/js';
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import { Banknote, FlaskConical, MessageSquareText, PackageX, ShoppingBag, Truck, UserPlus, Wallet } from "lucide-react";
import { demoAllowed } from "@/lib/demoFlag";
import DashboardHero from "./_dashboard/DashboardHero";
import ShortcutCard from "./_dashboard/ShortcutCard";
import StatTile from "./_dashboard/StatTile";
import { compactText, compactToman, fa } from "./_dashboard/format";

// حالت نمونه (آمار ساختگی برای دیدن نمودارها) فقط در توسعه هست؛ انتخاب کاربر در localStorage می‌ماند و بار اول روشن است
const DEMO_OK = demoAllowed();

// بسته‌ی نمودارها جدا و دیرتر بارگذاری می‌شود (SVG ساده است ولی لازم نیست جلوی دیده‌شدن شاخص‌ها را بگیرد)
const Skel = ({ className = "" }) => <div className={`animate-pulse rounded-2xl bg-white/70 ring-1 ring-gray-200 ${className}`} />;
const ChartsSkeleton = () => (
  <>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Skel className="h-80 lg:col-span-2" />
      <Skel className="h-80" />
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Skel className="h-72" />
      <Skel className="h-72" />
    </div>
  </>
);
const DashboardCharts = dynamic(() => import("./_dashboard/DashboardCharts"), { ssr: false, loading: ChartsSkeleton });

// «۱۲٫۵ میلیون» + «تومان» به شکل { num, unit }
const money = (n) => {
  const { num, unit } = compactToman(n);
  return { num, unit: unit ? `${unit} تومان` : "تومان" };
};

export default function AdminHome() {
  const [days, setDays] = useState(30);
  const [demo, setDemo] = useState(null); // null = هنوز از localStorage خوانده نشده
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true); // اولین بار: اسکلتون
  const [refreshing, setRefreshing] = useState(false); // تغییر بازه یا حالت: نمودار قبلی کم‌رنگ می‌ماند
  const router = useRouter();
  const requestId = useRef(0);

  useEffect(() => {
    const name = sessionStorage.getItem("welcomeMessage");
    if (name) {
      toast.success(`خوش آمدید مدیر عزیز 🎉`, { position: "top-center" });
      sessionStorage.removeItem("welcomeMessage");
    }
  }, []);

  useEffect(() => {
    if (!DEMO_OK) return setDemo(false);
    let saved = null;
    try { saved = localStorage.getItem("dashDemo"); } catch {}
    setDemo(saved === null ? true : saved === "1");
  }, []);

  const toggleDemo = (on) => {
    setDemo(on);
    try { localStorage.setItem("dashDemo", on ? "1" : "0"); } catch {}
  };

  useEffect(() => {
    if (demo === null) return; // منتظر خواندن انتخاب حالت نمونه
    const id = ++requestId.current;

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("لطفاً ابتدا وارد شوید");
          router.push("/auth");
          return;
        }

        // ذخیره state loading در localStorage
        localStorage.setItem('adminLoading', 'true');
        setRefreshing(true);

        const res = await axios.get(`/api/admin/stats?days=${days}${demo ? "&demo=1" : ""}`, { headers: { Authorization: `Bearer ${token}` } });
        if (id !== requestId.current) return; // پاسخ بازهٔ قبلی دیر رسیده
        setData(res.data);
      } catch (err) {
        if (id !== requestId.current) return;
        console.error("خطا در دریافت آمار:", err.response?.data || err.message);
        if (err.response?.status === 403) {
          toast.error("شما دسترسی ادمین ندارید");
          localStorage.removeItem("token");
          router.push("/auth");
        } else if (err.response?.status === 401) {
          toast.error("دسترسی غیرمجاز. لطفاً دوباره وارد شوید");
          localStorage.removeItem("token");
          router.push("/auth");
        } else {
          toast.error(err.response?.data?.error || "خطا در دریافت آمار");
        }
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
          // حذف state loading از localStorage
          localStorage.removeItem('adminLoading');
        }
      }
    };

    fetchStats();

    // تمیزکاری هنگام unmount
    return () => {
      localStorage.removeItem('adminLoading');
    };
  }, [days, demo, router]);

  // عنوان‌ها از بازهٔ دادهٔ روی صفحه می‌آیند، نه از دکمه‌ای که تازه زده شده: تا داده برسد «فروش ۷ روز» نباید بالای عدد ۳۰ روز بنشیند
  const shown = data?.days ?? days;
  const spark = (key) => data?.daily.map((d) => d[key]);
  const k = data?.kpis;
  const tiles = data && [
    { id: "revenue", icon: Banknote, tone: "brand", label: `فروش ${fa(shown)} روز اخیر`, value: money(k.revenue.value), zero: !k.revenue.value, change: k.revenue.change, spark: spark("revenue") },
    { id: "orders", icon: ShoppingBag, tone: "blue", label: "سفارش‌های پرداخت‌شده", value: { num: fa(k.orders.value), unit: "سفارش" }, zero: !k.orders.value, change: k.orders.change, spark: spark("orders") },
    { id: "aov", icon: Wallet, tone: "violet", label: "میانگین هر سفارش", value: money(k.aov.value), zero: !k.aov.value, change: k.aov.change },
    { id: "customers", icon: UserPlus, tone: "emerald", label: "مشتریان جدید", value: { num: fa(k.customers.value), unit: "نفر" }, zero: !k.customers.value, change: k.customers.change },
  ];

  const summary = !data
    ? ""
    : k.revenue.value > 0
      ? `در ${fa(shown)} روز اخیر ${fa(k.orders.value)} سفارش پرداخت‌شده و ${compactText(k.revenue.value)} تومان فروش ثبت شده است.`
      : `در ${fa(shown)} روز اخیر هنوز فروشی ثبت نشده است.`;

  // کارهای منتظر ادمین؛ فقط آنچه صفر نیست نشان داده می‌شود
  const attention = data && [
    { href: "/admin/orders", icon: Truck, count: data.attention.processingOrders, text: "سفارش جاری در انتظار رسیدگی" },
    { href: "/admin/comments", icon: MessageSquareText, count: data.attention.pendingComments, text: "نظر در انتظار تأیید" },
    { href: "/admin/products", icon: PackageX, count: data.attention.soldOut, text: "کالای ناموجود" },
  ].filter((a) => a.count > 0);

  const quick = data && [
    { name: "بنرها", href: "/admin/banners", tone: "violet", icon: <Icon path={mdiPanoramaVariantOutline} size={1.05} />, value: data.totals.banners },
    { name: "دسته‌بندی‌ها", href: "/admin/categories", tone: "amber", icon: <CategoryOutlinedIcon fontSize="medium" />, value: data.totals.categories },
    { name: "محصولات", href: "/admin/products", tone: "brand", icon: <ShoppingBag className="h-[22px] w-[22px]" />, value: data.totals.products },
    { name: "نظرات کاربران", href: "/admin/comments", tone: "sky", icon: <Icon path={mdiCommentAccountOutline} size={1.05} />, value: data.totals.comments },
    { name: "سفارش‌های کاربران", href: "/admin/orders", tone: "emerald", icon: <Icon path={mdiAccountFileText} size={1.05} />, value: data.totals.orders },
  ];

  return (
    <div className="dash-viz relative space-y-4 p-4" dir="rtl">
      <DashboardHero
        summary={summary}
        days={days}
        setDays={setDays}
        loading={loading}
        demoAvailable={DEMO_OK}
        demo={demo}
        setDemo={toggleDemo}
      />

      {data?.demo && (
        <div role="status" className="dash-rise grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2.5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200 sm:grid-cols-[auto_1fr_auto]">
          <FlaskConical className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <p className="min-w-0 leading-6">
            در حال نمایش <strong>داده‌های نمونه</strong> هستید: این اعداد ساختگی‌اند و جایی ذخیره نمی‌شوند. فقط شمار بخش‌ها (کارت‌های بالای آمار) واقعی است.
          </p>
          <button
            type="button"
            onClick={() => toggleDemo(false)}
            className="col-span-2 cursor-pointer justify-self-start rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 sm:col-span-1 shadow-sm ring-1 ring-amber-200 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            نمایش آمار واقعی
          </button>
        </div>
      )}

      {loading || !data ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skel key={i} className="h-[9.875rem]" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skel key={i} className="h-40" />
            ))}
          </div>
          <ChartsSkeleton />
        </>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="مدیریت بخش‌ها">
            {quick.map((card, i) => (
              <li key={card.name}>
                <ShortcutCard {...card} index={i} />
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {tiles.map((t, i) => (
              <StatTile key={t.id} {...t} index={5 + i} days={shown} busy={refreshing} />
            ))}
          </div>

          {attention.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="نیازمند توجه">
              {attention.map(({ href, icon: AttentionIcon, count, text }, i) => (
                <li key={href} className="dash-rise" style={{ "--i": 9 + i }}>
                  <Link
                    href={href}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <AttentionIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
                    <span className="font-bold text-gray-900">{fa(count)}</span>
                    {text}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <DashboardCharts data={data} busy={refreshing} />
        </>
      )}
    </div>
  );
}
