"use client";

import { useState, useEffect } from "react";
import { useAuth, useCart } from "@/lib/context";
import Link from "next/link";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import Icon from '@mdi/react';
import { 
  mdiClipboardTextClockOutline, 
  mdiTruckDeliveryOutline,
  mdiTruckCheckOutline,
  mdiAccountFileTextOutline,
  mdiTagOutline,
  mdiShoppingOutline,
  mdiHumanDolly,
  mdiCreditCardOutline,
  mdiTrashCanOutline,
  mdiTruckRemoveOutline,
  mdiTruckAlertOutline,
  mdiDeleteCircleOutline,
  mdiCloseCircleOutline,
} from '@mdi/js';
import { CalendarCheck } from "lucide-react"
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

export default function OrdersPage() {
  const { currentUser } = useAuth();
  const { cartItems, clearCart } = useCart();
  const [activeTab, setActiveTab] = useState("جاری");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryLoading, setRetryLoading] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Dialog تأییدیه حذف
  const [deleteDialog, setDeleteDialog] = useState({ open: false, order: null });
  const [shake, setShake] = useState(false);
  const handleCloseDeleteDialog = () => setDeleteDialog({ open: false, order: null });
  const handleBackdropClick = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const tabs = ["جاری", "تحویل داده شده", "مرجوع شده", "ناتمام"];

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          const ordersWithNumbers = data.orders.map((order, index) => ({
            ...order,
            userOrderNumber: data.orders.length - index
          }));
          setOrders(ordersWithNumbers || []);
        } else {
          toast.error(data.error || "دریافت سفارشات ناموفق بود.");
        }
      } catch (error) {
        toast.error("مشکلی پیش آمد. دوباره تلاش کنید.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser]);

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "جاری") return order.status === "processing";
    if (activeTab === "تحویل داده شده") return order.status === "delivered";
    if (activeTab === "مرجوع شده") return order.status === "returned";
    if (activeTab === "ناتمام") return order.status === "pending";
    return false;
  });

  const getFilteredOrderNumber = (order) => {
    const filteredIndex = filteredOrders.findIndex(o => o.id === order.id);
    return filteredOrders.length - filteredIndex;
  };

  const handleRetryPayment = async (order) => {
    setRetryLoading(order.id);
    try {
      const token = localStorage.getItem("token");
      const amount = order.totalPrice * 10;
      const callbackUrl = `${window.location.origin}/payment-result`;

      const paymentRes = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, orderId: order.id, callbackUrl }),
      });
      const data = await paymentRes.json();

      if (data.result === 100) {
        await fetch(`/api/orders/${order.id}/track`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ paymentTrackId: String(data.trackId) }),
        });
        window.location.href = `https://gateway.zibal.ir/start/${data.trackId}`;
      } else {
        toast.error(`مشکل در اتصال به درگاه پرداخت (کد: ${data.result})`);
      }
    } catch (err) {
      toast.error("مشکلی پیش آمد. دوباره تلاش کنید.");
    } finally {
      setRetryLoading(null);
    }
  };

  const handleDeletePendingOrder = (order) => {
    setDeleteDialog({ open: true, order });
  };

  const confirmDelete = async (order) => {
    setDeleteLoading(order.id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
        clearCart();
        toast.success("محصول موردنظر از سفارش های شما و سبد خرید شما حذف شد", { icon: "🗑️" });
      } else {
        const data = await res.json();
        toast.error(data.error || "خطا در حذف سفارش");
      }
    } catch (err) {
      toast.error("مشکلی پیش آمد.");
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 shadow rounded-lg mt-6" dir="rtl">
      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Dialog تأییدیه حذف سفارش */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleBackdropClick}
        dir="rtl"
        PaperProps={{
          sx: {
            animation: shake ? "dialogShake 0.5s ease" : "none",
            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "Vazirmatn, sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 1,
            backgroundColor: "#ef4444",
            color: "#ffffff",
            borderBottom: "3px solid",
            borderColor: "#b91c1c",
            px: 3,
            py: 1.5,
          }}
        >
          <Icon path={mdiTrashCanOutline} size={1} color="#ffffff" />
          حذف سفارش
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{ fontFamily: "Vazirmatn, sans-serif", marginTop: "10px" }}
          >
            سفارش #{deleteDialog.order?.userOrderNumber} حذف خواهد شد و محصول «{deleteDialog.order?.OrderItems?.[0]?.Product?.name || deleteDialog.order?.OrderItems?.[0]?.name || "نامشخص"}» از سبد خریدتان نیز حذف خواهد شد. آیا مطمئن هستید؟
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDeleteDialog}
            sx={{ fontFamily: "Vazirmatn, sans-serif" }}
          >
            <Icon path={mdiCloseCircleOutline} size={1} />
            لغو
          </Button>
          <Button
            onClick={() => {
              const order = deleteDialog.order;
              handleCloseDeleteDialog();
              confirmDelete(order);
            }}
            color="error"
            variant="contained"
            sx={{ fontFamily: "Vazirmatn, sans-serif" }}
          >
            <Icon path={mdiDeleteCircleOutline} size={1} />
            بله، حذف کن
          </Button>
        </DialogActions>
      </Dialog>
      
      <h1 className="text-xl font-bold mb-6 text-right text-gray-700 dark:text-gray-200 flex gap-1">
        <Icon path={mdiClipboardTextClockOutline} className="w-7 h-7" />
        تاریخچه سفارشات
      </h1>

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

      {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[20vh]">
              <Image
                src="/image/logo.png"
                alt="در حال بارگذاری سفارشات شما..."
                width={80}
                height={80}
                className="animate-spin object-contain"
                priority
              />
              <p className="mt-4 text-gray-500 text-sm font-medium animate-pulse">
                در حال بارگذاری سفارشات شما...
              </p>
            </div>
      ) : activeTab === "جاری" ? (
        <div className="space-y-6">
          {filteredOrders.length > 0 ? (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex gap-1">
                <Icon path={mdiHumanDolly} size={1} />
                سفارشات جاری
              </h2>
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-lg font-semibold text-gray-900 flex gap-1">
                        <Icon path={mdiAccountFileTextOutline} size={1.1} />
                        سفارش #{order.userOrderNumber || getFilteredOrderNumber(order)}
                      </h2>
                      <span className="text-sm px-2 py-1 rounded bg-yellow-100 text-yellow-800 flex items-center gap-1">
                        <Icon path={mdiTruckDeliveryOutline} size={0.7} />
                        جاری
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 flex gap-1">
                      <CalendarCheck className="w-5 h-5" />
                      تاریخ: {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                    </p>
                    <p className="text-sm text-gray-700 flex gap-1">
                      <Icon path={mdiTagOutline} size={0.9} />
                      قیمت کل: {order.totalPrice.toLocaleString("fa-IR")} تومان
                    </p>
                    <div className="mt-2">
                      <h3 className="text-sm font-medium text-gray-900 flex gap-1">
                        <Icon path={mdiShoppingOutline} size={0.9} />
                        محصولات:
                      </h3>
                      <ul className="list-disc pr-5 text-sm text-gray-700">
                        {order.OrderItems.map((item) => (
                          <li key={item.id}>
                            <Link
                              href={`/products/${item.slug || (item.Product && item.Product.slug)}`}
                              className="font-bold hover:text-pink-500 transition"
                            >
                              {item.name || (item.Product && item.Product.name) || "نامشخص"}
                            </Link>
                            {" "}- تعداد: {item.quantity.toLocaleString("fa-IR")} - قیمت نهایی:{" "}
                            {item.price.toLocaleString("fa-IR")} تومان
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-600">هیچ سفارش جاری‌ای وجود ندارد.</p>
            </div>
          )}
        </div>

      ) : activeTab === "ناتمام" ? (
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-600">هیچ سفارش ناتمامی وجود ندارد.</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold text-gray-900 flex gap-1">
                    <Icon path={mdiAccountFileTextOutline} size={1.1} />
                    سفارش #{order.userOrderNumber || getFilteredOrderNumber(order)}
                  </h2>
                  <span className="text-sm px-2 py-1 rounded bg-orange-100 text-orange-700 flex items-center gap-1">
                    <Icon path={mdiTruckAlertOutline} size={0.7} />
                    منتظر پرداخت
                  </span>
                </div>
                <p className="text-sm text-gray-700 flex gap-1">
                  <CalendarCheck className="w-5 h-5" />
                  تاریخ: {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                </p>
                <p className="text-sm text-gray-700 flex gap-1 mt-1">
                  <Icon path={mdiTagOutline} size={0.9} />
                  قیمت کل: {order.totalPrice.toLocaleString("fa-IR")} تومان
                </p>
                <div className="mt-2">
                  <h3 className="text-sm font-medium text-gray-900 flex gap-1">
                    <Icon path={mdiShoppingOutline} size={0.9} />
                    محصولات:
                  </h3>
                  <ul className="list-disc pr-5 text-sm text-gray-700">
                    {order.OrderItems.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/products/${item.Product?.slug}`}
                          className="font-bold hover:text-pink-500 transition"
                        >
                          {item.Product?.name || "نامشخص"}
                        </Link>
                        {" "}- تعداد: {item.quantity.toLocaleString("fa-IR")} - قیمت:{" "}
                        {item.price.toLocaleString("fa-IR")} تومان
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleRetryPayment(order)}
                    disabled={retryLoading === order.id || deleteLoading === order.id}
                    className="flex items-center gap-1 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60 cursor-pointer"
                  >
                    <Icon path={mdiCreditCardOutline} size={0.9} />
                    {retryLoading === order.id ? "در حال انتقال به درگاه..." : "تکمیل پرداخت"}
                  </button>

                  <button
                    onClick={() => handleDeletePendingOrder(order)}
                    disabled={retryLoading === order.id || deleteLoading === order.id}
                    className="flex items-center gap-1 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-60 cursor-pointer"
                  >
                    <Icon path={mdiTrashCanOutline} size={0.9} />
                    {deleteLoading === order.id ? "در حال حذف..." : "حذف سفارش"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600">
            {activeTab === "تحویل داده شده"
              ? "هیچ سفارش تحویل داده شده‌ای وجود ندارد."
              : "هیچ سفارش مرجوع شده‌ای وجود ندارد."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className={`border rounded-lg p-4 ${
                order.status === "delivered"
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-900 flex gap-1">
                  <Icon path={mdiAccountFileTextOutline} size={1.1} />
                  سفارش #{order.userOrderNumber?.toLocaleString('fa-IR') || getFilteredOrderNumber(order)}
                </h2>
                <span className={`text-sm px-2 py-1 rounded flex items-center gap-1 ${
                  order.status === "processing" ? "bg-yellow-100 text-yellow-800"
                  : order.status === "delivered" ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
                }`}>
                  {order.status === "processing" ? (
                    <><Icon path={mdiTruckDeliveryOutline} size={0.7} />جاری</>
                  ) : order.status === "delivered" ? (
                    <><Icon path={mdiTruckCheckOutline} size={0.7} />تحویل شده</>
                  ) : (
                    <><Icon path={mdiTruckRemoveOutline} size={0.7} />مرجوع شده</>
                  )}
                </span>
              </div>
              <p className="text-sm text-gray-700 flex gap-1">
                <CalendarCheck className="w-5 h-5" />
                تاریخ: {new Date(order.createdAt).toLocaleDateString("fa-IR")}
              </p>
              <p className="text-sm text-gray-700 flex gap-1 mt-2">
                <Icon path={mdiTagOutline} size={0.9} />
                قیمت کل: {order.totalPrice.toLocaleString("fa-IR")} تومان
              </p>
              <div className="mt-2">
                <h3 className="text-sm font-medium text-gray-900 flex gap-1">
                  <Icon path={mdiShoppingOutline} size={0.9} />
                  محصولات:
                </h3>
                <ul className="list-disc pr-5 text-sm text-gray-700">
                  {order.OrderItems.map((item) => (
                    <li key={item.id}>
                      <Link href={`/products/${item.Product?.slug}`} className="font-bold hover:text-pink-500 transition">
                        {item.Product?.name}
                      </Link>
                      {" "}- تعداد: {item.quantity.toLocaleString("fa-IR")} - قیمت نهایی:{" "}
                      {item.price.toLocaleString("fa-IR")} تومان
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes dialogShake {
          0%   { transform: translateX(0); }
          20%  { transform: translateX(-8px); }
          40%  { transform: translateX(8px); }
          60%  { transform: translateX(-5px); }
          80%  { transform: translateX(5px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}