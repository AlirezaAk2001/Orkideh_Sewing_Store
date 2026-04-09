"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { PackageCheck, Undo2, CalendarCheck, Clock } from "lucide-react";
import Icon from '@mdi/react';
import {
  mdiAccountFileText,
  mdiAccountFileTextOutline,
  mdiMonitorAccount,
  mdiHomeOutline,
  mdiCellphone,
  mdiTagOutline,
  mdiShoppingOutline,
  mdiTruckDeliveryOutline,
  mdiTruckCheckOutline,
  mdiTruckRemoveOutline,
  mdiTruckAlertOutline,
} from '@mdi/js';
import { Box, Skeleton } from "@mui/material";

const toPersianNumbers = (str) => {
  if (!str && str !== 0) return '';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return str.toString().replace(/\d/g, (digit) => persianDigits[digit]);
};

const formatToPersian = (num) => {
  if (!num && num !== 0) return '';
  return num.toLocaleString('fa-IR');
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("جاری");
  const router = useRouter();

  const tabs = ["جاری", "تحویل داده شده", "مرجوع شده", "ناتمام"];

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

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "جاری") return order.status === "processing";
    if (activeTab === "تحویل داده شده") return order.status === "delivered";
    if (activeTab === "مرجوع شده") return order.status === "returned";
    if (activeTab === "ناتمام") return order.status === "pending";
    return false;
  });

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("لطفاً ابتدا وارد شوید");
        return;
      }

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
          `وضعیت سفارش به "${
            newStatus === "delivered"
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
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="text-sm px-2 py-1 rounded bg-orange-100 text-orange-700 flex items-center gap-1">
            <Icon path={mdiTruckAlertOutline} size={0.7} />
            منتظر پرداخت
          </span>
        );
      case "processing":
        return (
          <span className="text-sm px-2 py-1 rounded bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Icon path={mdiTruckDeliveryOutline} size={0.7} />
            جاری
          </span>
        );
      case "delivered":
        return (
          <span className="text-sm px-2 py-1 rounded bg-green-100 text-green-800 flex items-center gap-1">
            <Icon path={mdiTruckCheckOutline} size={0.7} />
            تحویل شده
          </span>
        );
      case "returned":
        return (
          <span className="text-sm px-2 py-1 rounded bg-red-100 text-red-800 flex items-center gap-1">
            <Icon path={mdiTruckRemoveOutline} size={0.7} />
            مرجوع شده
          </span>
        );
      default:
        return <span className="text-sm px-2 py-1 rounded bg-gray-100 text-gray-600">نامشخص</span>;
    }
  };

  const SkeletonLoader = () => (
    <Box sx={{ width: "100%" }}>
      {Array.from(new Array(4)).map((_, index) => (
        <Box key={index} sx={{ bgcolor: 'white', p: 3, borderRadius: 2, boxShadow: 1, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Skeleton variant="circular" width={24} height={24} sx={{ ml: 1 }} />
            <Skeleton variant="text" width="70%" height={30} />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {Array.from(new Array(4)).map((_, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center" }}>
                <Skeleton variant="circular" width={20} height={20} sx={{ ml: 1 }} />
                <Skeleton variant="text" width="50%" height={20} />
              </Box>
            ))}
          </Box>
          <Box sx={{ display: "flex", gap: 1, mt: 3 }}>
            <Skeleton variant="rounded" width={150} height={40} />
            <Skeleton variant="rounded" width={120} height={40} />
          </Box>
        </Box>
      ))}
    </Box>
  );

  const OrderCard = ({ order }) => (
    <div
      key={order.id}
      className={`border rounded-lg p-4 ${
        order.status === "pending"
          ? "border-orange-200 bg-orange-50"
          : order.status === "processing"
          ? "border-yellow-200 bg-yellow-50"
          : order.status === "delivered"
          ? "border-green-200 bg-green-50"
          : order.status === "returned"
          ? "border-red-200 bg-red-50"
          : "bg-white border border-gray-200"
      }`}
    >
      {/* هدر کارت */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold text-gray-700 flex gap-1">
          <Icon path={mdiAccountFileTextOutline} size={1.1} />
          سفارش #{formatToPersian(order.userOrderNumber) || '۱'} — {order.User.username}
        </h2>
        {renderStatusBadge(order.status)}
      </div>

      {/* شناسه سیستمی */}
      <p className="text-xs text-gray-400 flex gap-1 mb-1">
        <Icon path={mdiMonitorAccount} size={0.75} />
        شناسه سیستمی: #{formatToPersian(order.id)}
      </p>

      {/* تاریخ */}
      <p className="text-sm text-gray-600 flex gap-1">
        <CalendarCheck className="w-5 h-5" />
        تاریخ: {toPersianNumbers(new Date(order.createdAt).toLocaleDateString("fa-IR"))}
      </p>

      {/* آدرس */}
      <p className="text-sm text-gray-600 flex gap-1 mt-1">
        <Icon path={mdiHomeOutline} size={0.9} />
        آدرس: {toPersianNumbers(order.Address?.address) || "نامشخص"}، کد پستی:{" "}
        {toPersianNumbers(order.Address?.postalCode) || "نامشخص"}
      </p>

      {/* شماره تماس */}
      <p className="text-sm text-gray-600 flex gap-1 mt-1">
        <Icon path={mdiCellphone} size={0.9} />
        شماره تماس: {toPersianNumbers(order.phoneNumber)}
      </p>

      {/* قیمت */}
      <p className="text-sm text-gray-600 flex gap-1 mt-1">
        <Icon path={mdiTagOutline} size={0.9} />
        قیمت کل: {formatToPersian(order.totalPrice)} تومان
      </p>

      {/* محصولات */}
      <div className="mt-2">
        <h3 className="text-sm font-medium text-gray-700 flex gap-1">
          <Icon path={mdiShoppingOutline} size={0.9} />
          محصولات:
        </h3>
        <ul className="list-disc pr-5 text-sm text-gray-600">
          {order.OrderItems.map((item) => (
            <li key={item.id}>
              {item.Product.name} - تعداد: {formatToPersian(item.quantity)} - قیمت واحد:{" "}
              {formatToPersian(item.price)} تومان
            </li>
          ))}
        </ul>
      </div>

      {/* دکمه‌های اکشن */}
      {order.status === "pending" && (
        <div className="mt-4 flex gap-2 flex-wrap">
          <button
            disabled
            className="flex items-center gap-1 px-4 py-2 bg-green-300 text-white rounded-lg cursor-not-allowed opacity-60"
            title="سفارش هنوز پرداخت نشده"
          >
            <PackageCheck size={18} />
            تحویل داده شد
          </button>
          <button
            disabled
            className="flex items-center gap-1 px-4 py-2 bg-red-300 text-white rounded-lg cursor-not-allowed opacity-60"
            title="سفارش هنوز پرداخت نشده"
          >
            <Undo2 size={18} />
            مرجوع شد
          </button>
          <span className="text-sm text-orange-500 flex items-center mr-2">
            ⏳ منتظر تکمیل پرداخت توسط کاربر
          </span>
        </div>
      )}

      {order.status === "processing" && (
        <div className="mt-4 flex gap-2 flex-wrap">
          <button
            onClick={() => handleStatusChange(order.id, "delivered")}
            className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition"
          >
            <PackageCheck size={18} />
            تحویل داده شد
          </button>
          <button
            onClick={() => handleStatusChange(order.id, "returned")}
            className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer transition"
          >
            <Undo2 size={18} />
            مرجوع شد
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded-lg mt-6" dir="rtl">
      <Toaster position="top-right" />

      <h1 className="text-xl font-bold mb-6 text-right text-gray-700 flex gap-1">
        <Icon path={mdiAccountFileText} size={1.3} />
        مدیریت سفارش‌های کاربران
      </h1>

      {/* تب‌ها */}
      <div className="flex justify-center gap-4 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
              activeTab === tab
                ? "bg-red-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {tab === "جاری" ? (
              <div className="flex items-center gap-1">
                <Icon path={mdiTruckDeliveryOutline} size={0.8} />
                {tab}
              </div>
            ) : tab === "تحویل داده شده" ? (
              <div className="flex items-center gap-1">
                <Icon path={mdiTruckCheckOutline} size={0.8} />
                {tab}
              </div>
            ) : tab === "مرجوع شده" ? (
              <div className="flex items-center gap-1">
                <Icon path={mdiTruckRemoveOutline} size={0.8} />
                {tab}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Icon path={mdiTruckAlertOutline} size={0.8} />
                {tab}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* محتوا */}
      {loading ? (
        <SkeletonLoader />
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600">
            {activeTab === "جاری"
              ? "هیچ سفارش جاری‌ای وجود ندارد."
              : activeTab === "تحویل داده شده"
              ? "هیچ سفارش تحویل داده شده‌ای وجود ندارد."
              : activeTab === "مرجوع شده"
              ? "هیچ سفارش مرجوع شده‌ای وجود ندارد."
              : "هیچ سفارش ناتمامی وجود ندارد."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}