"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { CalendarDays, Eye, SearchX, ShoppingBag, X } from "lucide-react";
import Icon from "@mdi/react";
import { mdiAccountFileText } from "@mdi/js";
import PageHeader from "@/app/admin/_shell/PageHeader";
import ListCard from "@/app/admin/_list/ListCard";
import TablePage from "@/app/admin/_list/TablePage";
import ScrollArea from "@/app/components/ScrollArea";
import ExpandSearch from "@/app/components/ExpandSearch";
import EmptyState from "@/app/admin/_list/EmptyState";
import SegmentedTabs from "@/app/admin/_list/SegmentedTabs";
import { ORDER_STATUS, ORDER_STATUS_ORDER } from "@/app/admin/_list/orderStatus";
import { parseTerms } from "@/app/admin/_list/search";
import OrderCard from "./_ui/OrderCard";
import OrderStats from "./_ui/OrderStats";
import { fa, groupByDay, haystack } from "./_ui/format";
import "./orders.css";

// متن حالت خالی هر تب (عنوان و توضیح)
const EMPTY = {
  processing: { title: "سفارش جاری‌ای وجود ندارد", hint: "سفارش‌هایی که پرداخت شده‌اند و منتظر تحویل‌اند اینجا نشان داده می‌شوند." },
  delivered: { title: "هنوز سفارشی تحویل داده نشده", hint: "هر سفارش بعد از تحویل به مشتری اینجا بایگانی می‌شود." },
  returned: { title: "سفارش مرجوعی ثبت نشده", hint: "سفارش‌هایی که مشتری آن‌ها را برگردانده اینجا نشان داده می‌شوند." },
  pending: { title: "سفارش ناتمامی وجود ندارد", hint: "سفارش‌هایی که مشتری ثبت کرده ولی هنوز پرداخت نکرده اینجا می‌آیند." },
};

const STATUS_NAME = { delivered: "تحویل‌داده‌شده", returned: "مرجوع شده", processing: "در حال پردازش" };

const SECONDARY_BUTTON =
  "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-gray-100 px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300";

// کارت‌ها در پهنای کافی (container query ناحیهٔ محتوا، ۶۴rem) دو ستونه‌اند؛ کارت‌های هم‌ردیف هم‌قدند و ردیف پایین هر کارت (mt-auto) به لبهٔ پایین می‌چسبد.
// کارتی که در ردیف آخر تنها می‌ماند (آخرین کارتِ فهرستِ فرد) هر دو ستون را می‌گیرد
const GRID = "grid gap-3 @5xl:grid-cols-2 @5xl:[&>*:last-child:nth-child(odd)]:col-span-2";

// اسکلتون لودینگ: همان ساختار کارت (سربرگ، خط زمان، اطلاعات، اقلام، ردیف پایین)
function OrderSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200/80" aria-hidden="true">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-44 rounded-full bg-gray-200" />
            <div className="h-3 w-28 rounded-full bg-gray-100" />
          </div>
        </div>
        <div className="h-6 w-24 rounded-full bg-gray-100" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-9 w-9 rounded-full bg-gray-200" />
        <div className="h-1 flex-1 rounded-full bg-gray-100" />
        <div className="h-9 w-9 rounded-full bg-gray-200" />
        <div className="h-1 flex-1 rounded-full bg-gray-100" />
        <div className="h-9 w-9 rounded-full bg-gray-100" />
        <div className="h-1 flex-1 rounded-full bg-gray-100" />
        <div className="h-9 w-9 rounded-full bg-gray-100" />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="h-9 rounded-lg bg-gray-100" />
        <div className="h-9 rounded-lg bg-gray-100" />
        <div className="h-9 rounded-lg bg-gray-100 sm:col-span-2" />
      </div>
      <div className="mt-3 h-16 rounded-xl bg-gray-100" />
      <div className="mt-3 flex justify-between border-t border-dashed border-gray-200 pt-3">
        <div className="h-6 w-40 rounded-full bg-gray-200" />
        <div className="h-10 w-36 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("processing");
  const [query, setQuery] = useState("");
  const isFirstLoad = loading && orders.length === 0;
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("لطفاً ابتدا وارد شوید");
          router.push("/auth");
          return;
        }

        const res = await axios.get("/api/admin/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error("خطا در دریافت سفارش‌ها:", err.response?.data || err.message);
        if (err.response?.status === 401) {
          toast.error("دسترسی غیرمجاز. لطفاً دوباره وارد شوید");
          localStorage.removeItem("token");
          router.push("/auth");
        } else if (err.response?.status === 403) {
          toast.error("شما دسترسی ادمین ندارید");
          localStorage.removeItem("token");
          router.push("/auth");
        } else {
          toast.error(err.response?.data?.error || "خطا در دریافت سفارش‌ها");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  // تغییر وضعیت فقط درخواست به سرور است (true یا false)؛ کارت پس از موفقیت، با مُهر و محو شدن، تغییر را از طریق patchOrder در فهرست می‌نشاند
  const changeStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("لطفاً ابتدا وارد شوید");
        return false;
      }
      await axios.put("/api/admin/orders", { orderId, status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`وضعیت سفارش به "${STATUS_NAME[status]}" تغییر کرد`);
      return true;
    } catch (err) {
      console.error("خطا در به‌روزرسانی وضعیت سفارش:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "خطا در به‌روزرسانی وضعیت سفارش");
      return false;
    }
  };

  const patchOrder = (id, change) => setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...change } : o)));

  // جست‌وجو: همهٔ واژه‌ها باید در کاربر، تماس، شماره، آدرس، شیوهٔ ارسال یا نام کالاها باشند. شمار تب‌ها و فهرست هر دو از نتیجهٔ جست‌وجو می‌آیند
  const terms = useMemo(() => parseTerms(query), [query]);
  const hay = useMemo(() => new Map(orders.map((o) => [o.id, haystack(o)])), [orders]);
  const searched = useMemo(() => (terms.length ? orders.filter((o) => terms.every((t) => (hay.get(o.id) || "").includes(t))) : orders), [orders, terms, hay]);

  const counts = useMemo(() => {
    const c = { processing: 0, delivered: 0, returned: 0, pending: 0 };
    for (const o of searched) if (o.status in c) c[o.status] += 1;
    return c;
  }, [searched]);

  const visible = useMemo(() => searched.filter((o) => o.status === tab), [searched, tab]);
  // start = شمارهٔ اولین کارت هر روز در کل فهرست، برای تأخیر ورود پلکانی که میان گروه‌ها پیوسته می‌ماند
  const groups = useMemo(() => {
    let start = 0;
    return groupByDay(visible).map((group) => {
      const out = { ...group, start };
      start += group.orders.length;
      return out;
    });
  }, [visible]);
  const current = ORDER_STATUS[tab];

  const tabs = ORDER_STATUS_ORDER.map((id) => ({
    id,
    label: ORDER_STATUS[id].tab,
    icon: ORDER_STATUS[id].icon,
    count: counts[id],
    color: ORDER_STATUS[id].color,
    ink: ORDER_STATUS[id].ink,
    flip: ORDER_STATUS[id].flip,
  }));

  // حالت خالی: با جست‌وجوی فعال «پیدا نشد» (با پاک‌کردن و، اگر تب دیگری یافته دارد، دکمهٔ رفتن به آن)؛ وگرنه یا هیچ سفارشی نیست، یا فقط همین تب خالی است
  const otherTab = ORDER_STATUS_ORDER.find((id) => id !== tab && counts[id] > 0);
  const goOther = otherTab && (
    <button type="button" onClick={() => setTab(otherTab)} className={SECONDARY_BUTTON}>
      <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
      نمایش سفارش‌های «{ORDER_STATUS[otherTab].tab}» ({fa(counts[otherTab])})
    </button>
  );
  let empty = null;
  if (!loading && visible.length === 0) {
    if (terms.length) {
      empty = (
        <EmptyState
          icon={SearchX}
          title="سفارشی با این جست‌وجو پیدا نشد"
          hint={otherTab ? "در همین تب سفارشی نیست، ولی در تب‌های دیگر با این عبارت سفارش هست." : "عبارت دیگری امتحان کنید یا جست‌وجو را پاک کنید."}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => setQuery("")} className={SECONDARY_BUTTON}>
                <X className="h-[18px] w-[18px]" aria-hidden="true" />
                پاک کردن جست‌وجو
              </button>
              {goOther}
            </div>
          }
        />
      );
    } else if (orders.length === 0) {
      empty = <EmptyState icon={ShoppingBag} title="هنوز سفارشی ثبت نشده" hint="وقتی مشتریان سفارش بدهند، اینجا نشان داده می‌شود." />;
    } else {
      empty = <EmptyState icon={current.icon} title={EMPTY[tab].title} hint={EMPTY[tab].hint} action={goOther} />;
    }
  }

  // از md به بالا سربرگ صفحه، نوار آمار، جست‌وجو و تب‌ها ثابت می‌مانند و فقط فهرست کارت‌ها اسکرول می‌خورد؛ شست از زیر تب‌ها شروع می‌شود (قاب و ارتفاعش مثل صفحه‌های جدول‌دار: TablePage).
  // md:-ml-2 / md:-mr-4 با md:pl-2 / md:pr-4: سایهٔ کارت‌ها بریده نشود و شست در حاشیهٔ راست main بنشیند، نه روی کارت‌ها. زیر md صفحه مثل قبل اسکرول می‌خورد.
  // نوار ابزار مثل صفحهٔ محصولات و نظرها: جست‌وجو در آغاز ردیف (راست) و تب‌های وضعیت در انتهای آن (چپ).
  // کارت‌ها بر اساس روز ثبت گروه شده‌اند و برچسب هر روز (تاریخ، شمار و جمع مبلغ) هنگام اسکرول بالای فهرست می‌چسبد تا روزِ کارت‌های زیرش معلوم بماند
  return (
    <TablePage>
      <PageHeader
        icon={<Icon path={mdiAccountFileText} size="22px" />}
        title="مدیریت سفارش‌های کاربران"
        loading={isFirstLoad}
        subtitleKey={tab}
        subtitleColor={current.ink}
        subtitle={<><b>{fa(visible.length)}</b> {current.noun} یافت شد</>}
      />

      <OrderStats orders={orders} loading={isFirstLoad} />

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <ExpandSearch
          label="جستجوی سفارش‌ها"
          placeholder="جستجو بر اساس نام کاربر، شماره تماس، نام کالا، آدرس سفارش، کد پستی..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery("")}
          phoneFullRow
          className="sm:min-w-80 sm:max-w-[32rem] sm:flex-1"
        />
        <SegmentedTabs label="وضعیت سفارش" tabs={tabs} value={tab} onChange={setTab} loading={isFirstLoad} idPrefix="orders" panelId="orders-panel" />
      </div>

      <ScrollArea
        id="orders-panel"
        role="tabpanel"
        aria-labelledby={`orders-tab-${tab}`}
        aria-busy={loading || undefined}
        className="mt-2 min-h-0 flex-1 md:-ml-2 md:-mr-4 md:[container-type:size]"
        innerClassName="md:pb-1 md:pl-2 md:pr-4"
      >
        {loading ? (
          <div className={GRID}>
            {[0, 1, 2, 3].map((i) => (
              <OrderSkeleton key={i} />
            ))}
          </div>
        ) : empty ? (
          <ListCard>{empty}</ListCard>
        ) : (
          <div key={tab} className="od-list space-y-2">
            {groups.map((group) => (
              <section key={group.key} aria-label={group.name}>
                <h2 className="pointer-events-none sticky top-0 z-10 flex py-1">
                  <span className="admin-row-in pointer-events-auto inline-flex flex-wrap items-center gap-x-2 rounded-full bg-white/95 px-3 py-1 text-xs text-gray-500 shadow-sm ring-1 ring-gray-200/80 backdrop-blur-sm">
                    <CalendarDays className="h-4 w-4 text-brand-600" aria-hidden="true" />
                    <b className="font-extrabold text-gray-800">{group.days === 0 ? "امروز" : group.days === 1 ? "دیروز" : group.name}</b>
                    {group.days < 2 && <span>{group.name}</span>}
                    <span aria-hidden="true" className="text-gray-300">|</span>
                    <span>{fa(group.orders.length)} سفارش</span>
                    <span aria-hidden="true" className="text-gray-300">|</span>
                    <span>{fa(group.total)} تومان</span>
                  </span>
                </h2>
                <div className={GRID}>
                  {group.orders.map((order, i) => (
                    <OrderCard key={order.id} order={order} index={group.start + i} terms={terms} onStatus={changeStatus} onPatch={patchOrder} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </ScrollArea>
    </TablePage>
  );
}
