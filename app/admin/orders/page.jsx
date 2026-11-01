"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { CalendarDays, Hourglass, MapPin, PackageCheck, Phone, ShoppingBag, Undo2 } from "lucide-react";
import Icon from "@mdi/react";
import { mdiAccountFileText } from "@mdi/js";
import PageHeader from "@/app/admin/_shell/PageHeader";
import ListCard from "@/app/admin/_list/ListCard";
import EmptyState from "@/app/admin/_list/EmptyState";
import SegmentedTabs from "@/app/admin/_list/SegmentedTabs";
import StatusChip from "@/app/admin/_list/StatusChip";
import { ORDER_STATUS, ORDER_STATUS_ORDER, statusTint } from "@/app/admin/_list/orderStatus";

const fa = (n) => (n || n === 0 ? Number(n).toLocaleString("fa-IR") : "");

const toPersianNumbers = (str) => {
  if (!str && str !== 0) return "";
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  return str.toString().replace(/\d/g, (digit) => persianDigits[digit]);
};

// متن حالت خالی هر تب (عنوان و توضیح)
const EMPTY = {
  processing: { title: "سفارش جاری‌ای وجود ندارد", hint: "سفارش‌هایی که پرداخت شده‌اند و منتظر تحویل‌اند اینجا نشان داده می‌شوند." },
  delivered: { title: "هنوز سفارشی تحویل داده نشده", hint: "هر سفارش بعد از تحویل به مشتری اینجا بایگانی می‌شود." },
  returned: { title: "سفارش مرجوعی ثبت نشده", hint: "سفارش‌هایی که مشتری آن‌ها را برگردانده اینجا نشان داده می‌شوند." },
  pending: { title: "سفارش ناتمامی وجود ندارد", hint: "سفارش‌هایی که مشتری ثبت کرده ولی هنوز پرداخت نکرده اینجا می‌آیند." },
};

// یک سطر اطلاعات کارت: کاشی آیکون کوچک، برچسب کم‌رنگ و مقدار
function Info({ icon: Glyph, label, children, className = "" }) {
  return (
    <div className={`flex min-w-0 items-start gap-2.5 ${className}`}>
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-500">
        <Glyph className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-gray-400">{label}</dt>
        <dd className="break-words text-sm font-medium leading-6 text-gray-800">{children}</dd>
      </div>
    </div>
  );
}

// کارت یک سفارش: نوار رنگی وضعیت در ابتدا، شمارهٔ سفارش و نام کاربر، چیپ وضعیت، اطلاعات تماس و آدرس، اقلام، جمع مبلغ و دکمه‌های تغییر وضعیت
function OrderCard({ order, index, busy, onStatus }) {
  const s = ORDER_STATUS[order.status];
  const date = new Date(order.createdAt);
  const items = order.OrderItems || [];

  return (
    <article
      className="admin-row-in relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/80 transition-shadow hover:shadow-md"
      style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
    >
      <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1" style={{ background: s?.color ?? "var(--color-gray-300)" }} />
      <div className="p-4 ps-5 sm:p-5 sm:ps-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="grid h-11 min-w-11 shrink-0 place-items-center rounded-xl px-2 text-sm font-extrabold tabular-nums"
              style={s ? statusTint(s) : undefined}
              aria-hidden="true"
            >
              #{fa(order.userOrderNumber || 1)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-extrabold text-gray-900">
                سفارش {fa(order.userOrderNumber || 1)} — {order.User?.username}
              </h2>
              <p className="text-xs text-gray-400">شناسهٔ سیستمی: #{fa(order.id)}</p>
            </div>
          </div>
          <StatusChip status={order.status} />
        </header>

        <dl className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <Info icon={CalendarDays} label="تاریخ ثبت">
            {date.toLocaleDateString("fa-IR")} — {date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
          </Info>
          <Info icon={Phone} label="شماره تماس">
            <span dir="ltr" className="inline-block">{toPersianNumbers(order.phoneNumber) || "نامشخص"}</span>
          </Info>
          <Info icon={MapPin} label="آدرس و کد پستی" className="sm:col-span-2">
            {toPersianNumbers(order.Address?.address) || "نامشخص"}، کد پستی: {toPersianNumbers(order.Address?.postalCode) || "نامشخص"}
          </Info>
        </dl>

        <section className="mt-4 rounded-xl bg-gray-50/80 p-3" aria-label="اقلام سفارش">
          <h3 className="mb-1 flex items-center gap-1.5 text-xs font-bold text-gray-500">
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
            اقلام سفارش ({fa(items.length)})
          </h3>
          <ul className="divide-y divide-gray-200/70">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 py-2 text-sm">
                <span className="min-w-0 font-medium text-gray-800">{item.Product?.name ?? "کالای حذف‌شده"}</span>
                <span className="shrink-0 text-gray-500">
                  <span className="font-semibold tabular-nums text-gray-700">{fa(item.quantity)}</span> × {fa(item.price)} تومان
                </span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-gray-200 pt-4">
          <p className="text-sm text-gray-500">
            قیمت کل: <strong className="text-lg font-extrabold tabular-nums text-gray-900">{fa(order.totalPrice)}</strong> <span className="text-xs">تومان</span>
          </p>

          {order.status === "processing" && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => onStatus(order.id, "delivered")}
                className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PackageCheck className="h-[18px] w-[18px]" aria-hidden="true" />
                تحویل داده شد
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onStatus(order.id, "returned")}
                className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-red-600 ring-1 ring-inset ring-red-200 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Undo2 className="h-[18px] w-[18px]" aria-hidden="true" />
                مرجوع شد
              </button>
            </div>
          )}

          {order.status === "pending" && (
            <p className="inline-flex items-center gap-1.5 text-sm text-gray-500">
              <Hourglass className="h-4 w-4" aria-hidden="true" />
              منتظر تکمیل پرداخت توسط کاربر
            </p>
          )}
        </footer>
      </div>
    </article>
  );
}

function OrderSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80" aria-hidden="true">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-44 rounded-full bg-gray-200" />
            <div className="h-3 w-28 rounded-full bg-gray-100" />
          </div>
        </div>
        <div className="h-6 w-24 rounded-full bg-gray-100" />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="h-9 rounded-lg bg-gray-100" />
        <div className="h-9 rounded-lg bg-gray-100" />
        <div className="h-9 rounded-lg bg-gray-100 sm:col-span-2" />
      </div>
      <div className="mt-4 h-20 rounded-xl bg-gray-100" />
      <div className="mt-4 flex justify-between border-t border-dashed border-gray-200 pt-4">
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
  const [busyId, setBusyId] = useState(null); // سفارشی که درخواست تغییر وضعیتش در راه است (دکمه‌هایش قفل می‌شود)
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

  const counts = useMemo(() => {
    const c = { processing: 0, delivered: 0, returned: 0, pending: 0 };
    for (const o of orders) if (o.status in c) c[o.status] += 1;
    return c;
  }, [orders]);

  const visible = orders.filter((order) => order.status === tab);
  const current = ORDER_STATUS[tab];

  const tabs = ORDER_STATUS_ORDER.map((id) => ({
    id,
    label: ORDER_STATUS[id].tab,
    icon: ORDER_STATUS[id].icon,
    count: counts[id],
    color: ORDER_STATUS[id].color,
    ink: ORDER_STATUS[id].ink,
  }));

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("لطفاً ابتدا وارد شوید");
        return;
      }

      setBusyId(orderId);
      const res = await axios.put(
        "/api/admin/orders",
        { orderId, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, status: newStatus, userOrderNumber: order.userOrderNumber }
              : order
          )
        );
        toast.success(
          `وضعیت سفارش به "${newStatus === "delivered"
            ? "تحویل داده شده"
            : newStatus === "returned"
              ? "مرجوع شده"
              : "در حال پردازش"
          }" تغییر کرد`
        );
      }
    } catch (err) {
      console.error("خطا در به‌روزرسانی وضعیت سفارش:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "خطا در به‌روزرسانی وضعیت سفارش");
    } finally {
      setBusyId(null);
    }
  };

  // حالت خالی: یا هیچ سفارشی نیست، یا فقط همین تب خالی است (آن‌وقت راه رفتن به تبی که سفارش دارد را هم نشان می‌دهیم)
  const otherTab = ORDER_STATUS_ORDER.find((id) => id !== tab && counts[id] > 0);
  let empty = null;
  if (!loading && visible.length === 0) {
    empty =
      orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="هنوز سفارشی ثبت نشده" hint="وقتی مشتریان سفارش بدهند، اینجا نشان داده می‌شود." />
      ) : (
        <EmptyState
          icon={current.icon}
          title={EMPTY[tab].title}
          hint={EMPTY[tab].hint}
          action={
            otherTab && (
              <button
                type="button"
                onClick={() => setTab(otherTab)}
                className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-gray-100 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              >
                نمایش سفارش‌های «{ORDER_STATUS[otherTab].tab}» ({fa(counts[otherTab])})
              </button>
            )
          }
        />
      );
  }

  return (
    <>
      <PageHeader
        icon={<Icon path={mdiAccountFileText} size="22px" />}
        title="مدیریت سفارش‌های کاربران"
        loading={isFirstLoad}
        subtitleKey={tab}
        subtitleColor={current.ink}
        subtitle={<><b>{fa(visible.length)}</b> {current.noun} یافت شد</>}
      />

      <SegmentedTabs label="وضعیت سفارش" tabs={tabs} value={tab} onChange={setTab} loading={isFirstLoad} idPrefix="orders" panelId="orders-panel" />

      <div id="orders-panel" role="tabpanel" aria-labelledby={`orders-tab-${tab}`} aria-busy={loading || undefined} className="mt-4">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <OrderSkeleton key={i} />
            ))}
          </div>
        ) : empty ? (
          <ListCard>{empty}</ListCard>
        ) : (
          <div key={tab} className="space-y-3">
            {visible.map((order, i) => (
              <OrderCard key={order.id} order={order} index={i} busy={busyId === order.id} onStatus={handleStatusChange} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
