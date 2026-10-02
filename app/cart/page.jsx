"use client";

import { useState } from "react";
import { useCart, useAuth } from "@/lib/context";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, ClipboardList, CreditCard } from "lucide-react";
import Icon from '@mdi/react';
import { mdiCartOutline, mdiCartMinus, mdiCloseCircleOutline, mdiDeleteCircleOutline, mdiDeleteSweepOutline } from '@mdi/js';
import { TextField } from "@mui/material";

const animationStyles = `
  @keyframes spin360FadeOut {
    0%   { transform: rotate(0deg) scale(1); opacity: 1; }
    70%  { transform: rotate(360deg) scale(0.8); opacity: 0.4; }
    100% { transform: rotate(360deg) scale(0); opacity: 0; }
  }
  @keyframes bubbleIn {
    0%   { transform: scale(0); opacity: 0; border-radius: 50%; }
    60%  { transform: scale(1.06); opacity: 1; border-radius: 10px; }
    80%  { transform: scale(0.97); border-radius: 8px; }
    100% { transform: scale(1); opacity: 1; border-radius: 8px; }
  }
  @keyframes bubbleOut {
    0%   { transform: scale(1); opacity: 1; border-radius: 8px; }
    100% { transform: scale(0); opacity: 0; border-radius: 50%; }
  }
  .spin-fade-out {
    animation: spin360FadeOut 0.6s ease-in-out forwards;
  }
  .bubble-in {
    animation: bubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  .bubble-out {
    animation: bubbleOut 0.35s ease-in forwards;
  }
  @keyframes dialogShake {
    0%   { transform: translateX(0); }
    20%  { transform: translateX(-8px); }
    40%  { transform: translateX(8px); }
    60%  { transform: translateX(-5px); }
    80%  { transform: translateX(5px); }
    100% { transform: translateX(0); }
  }
`;

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const { currentUser } = useAuth();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  const isPhoneValid = /^09[0-9]{9}$/.test(phoneNumber);

  const [summarySpinning, setSummarySpinning] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  // Dialog تأییدیه حذف تکی
  const [dialog, setDialog] = useState({ open: false, id: null, name: "" });
  const [shake, setShake] = useState(false);
  const handleCloseDialog = () => setDialog({ open: false, id: null, name: "" });
  const handleBackdropClick = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Dialog تأییدیه حذف همه
  const [clearDialog, setClearDialog] = useState(false);
  const [shakeClear, setShakeClear] = useState(false);
  const handleCloseClearDialog = () => setClearDialog(false);
  const handleClearBackdropClick = () => {
    setShakeClear(true);
    setTimeout(() => setShakeClear(false), 500);
  };

  const rtlStyles = {
    InputLabelProps: {
      sx: {
        transformOrigin: "right !important",
        left: "inherit !important",
        right: "1.75rem !important",
      },
    },
    sx: {
      "& legend": {
        textAlign: "right",
      },
    },
  };

  const handleRemove = (id, name) => {
    setDialog({ open: true, id, name });
  };

  const confirmRemove = async () => {
    const { id } = dialog;
    handleCloseDialog();
    setDeleteLoading(id);

    try {
      const token = localStorage.getItem("token");

      if (token) {
        const ordersRes = await fetch("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ordersData = await ordersRes.json();

        if (ordersRes.ok && ordersData.orders) {
          const pendingOrder = ordersData.orders.find(o => o.status === "pending");
          if (pendingOrder) {
            await fetch(`/api/orders/${pendingOrder.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            clearCart();
            toast.success("محصول موردنظر از سبد خرید شما حذف شد.", { icon: "🗑️" });
            return;
          }
        }
      }

      removeFromCart(id);
      toast.success("محصول موردنظر از سبد خرید شما حذف شد.", { icon: "🗑️" });
    } catch (err) {
      console.error("خطا در حذف:", err);
      removeFromCart(id);
      toast.success("محصول حذف شد.");
    } finally {
      setDeleteLoading(null);
    }
  };

  const confirmClearAll = async () => {
    handleCloseClearDialog();
    setClearLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (token) {
        const ordersRes = await fetch("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ordersData = await ordersRes.json();

        if (ordersRes.ok && ordersData.orders) {
          const pendingOrder = ordersData.orders.find(o => o.status === "pending");
          if (pendingOrder) {
            await fetch(`/api/orders/${pendingOrder.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }
      }
    } catch (err) {
      console.error("خطا در حذف سفارش:", err);
    }

    clearCart();
    toast.success("تمام محصولات از سبد خرید شما حذف شدند.", { icon: "🗑️" });
    setClearLoading(false);
  };

  const handleOpenForm = () => {
    if (summarySpinning) return;
    setSummarySpinning(true);

    setTimeout(() => {
      setSummarySpinning(false);
      setShowForm(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setFormVisible(true));
      });
    }, 650);
  };

  const handleCloseForm = () => {
    setFormVisible(false);
    setTimeout(() => {
      setShowForm(false);
    }, 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      toast("برای ثبت سفارش، ابتدا وارد حساب کاربری خود شوید.", { icon: "⚠️" });
      setTimeout(() => router.push("/auth"), 2000);
      return;
    }

    if (!cartItems.length) {
      toast("سبد خرید شما خالی است.", { icon: "⚠️" });
      return;
    }

    if (!/09[0-9]{9}/.test(phoneNumber)) {
      toast("شماره تلفن نامعتبر است.", { icon: "⚠️" });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phoneNumber }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "خطا در ثبت سفارش");

      // مبلغ و آدرس برگشت از درگاه را سرور تعیین می‌کند؛ فقط شناسهٔ سفارش را می‌فرستیم
      const paymentRes = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: orderData.order.id }),
      });
      const data = await paymentRes.json();
      if (!paymentRes.ok || data.result !== 100) {
        throw new Error(data.error || `خطا در پرداخت. کد خطا: ${data.result}`);
      }

      window.location.href = data.payUrl;
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 shadow rounded-xl mt-4 sm:mt-6"
      dir="rtl"
    >
      <style>{animationStyles}</style>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            fontFamily: "Vazirmatn, sans-serif",
            direction: "rtl",
            borderRadius: "10px",
            fontSize: "14px",
          },
        }}
      />

      {/* Dialog تأییدیه حذف تکی */}
      <Dialog
        open={dialog.open}
        onClose={handleBackdropClick}
        dir="rtl"
        PaperProps={{
          sx: {
            animation: shake ? "dialogShake 0.5s ease" : "none",
            borderRadius: "12px"
          }
        }}
      >
        <DialogTitle sx={{
          fontFamily: "Vazirmatn, sans-serif",
          display: "flex",
          alignItems: "center",
          gap: 1,
          backgroundColor: "#3b82f6",
          color: "#ffffff",
          borderBottom: "3px solid",
          borderColor: "#1d4ed8",
          px: 3,
          py: 1.5,
        }}>
          <Icon path={mdiCartMinus} size={1} color="#ffffff" />
          حذف از سبد خرید
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "Vazirmatn, sans-serif", marginTop: "6px" }}>
            محصول 
            <strong style={{ color: '#E53935', margin: '0 4px' }}>«{dialog.name}»</strong>
            از سبد خرید شما حذف خواهد شد. آیا مطمئن هستید؟
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ fontFamily: "Vazirmatn, sans-serif" }}>
            <Icon path={mdiCloseCircleOutline} size={1} />
            لغو
          </Button>
          <Button
            onClick={confirmRemove}
            color="error"
            variant="contained"
            sx={{ fontFamily: "Vazirmatn, sans-serif" }}
          >
            <Icon path={mdiDeleteCircleOutline} size={1} />
            بله، حذف کن
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog تأییدیه حذف همه */}
      <Dialog
        open={clearDialog}
        onClose={handleClearBackdropClick}
        dir="rtl"
        PaperProps={{
          sx: {
            animation: shakeClear ? "dialogShake 0.5s ease" : "none",
            borderRadius: "12px",
            minWidth: "320px",
          }
        }}
      >
        <DialogTitle sx={{
          fontFamily: "Vazirmatn, sans-serif",
          display: "flex",
          alignItems: "center",
          gap: 1,
          backgroundColor: "#3b82f6",
          color: "#ffffff",
          borderBottom: "3px solid",
          borderColor: "#1d4ed8",
          px: 3,
          py: 1.5,
        }}>
          <Icon path={mdiDeleteSweepOutline} size={1} color="#ffffff" />
          خالی کردن سبد خرید
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "Vazirmatn, sans-serif", marginTop: "8px", marginBottom: "4px" }}>
            آیا مطمئن هستید که می‌خواهید تمام محصولات زیر را از سبد خرید خود حذف کنید؟
          </DialogContentText>
          <ul style={{
            marginTop: "10px",
            paddingRight: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}>
            {cartItems.map((item, index) => (
              <li key={item.id} style={{
                fontFamily: "Vazirmatn, sans-serif",
                fontSize: "13px",
                color: "#374151",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: "bold",
                  flexShrink: 0,
                }}>
                  {(index + 1).toLocaleString("fa-IR")}
                </span>
                {item.name || item.Product?.name}
                {item.quantity > 1 && (
                  <span style={{ color: "#6b7280", fontSize: "12px" }}>
                    (×{item.quantity.toLocaleString("fa-IR")})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClearDialog} sx={{ fontFamily: "Vazirmatn, sans-serif" }}>
            <Icon path={mdiCloseCircleOutline} size={1} />
            لغو
          </Button>
          <Button
            onClick={confirmClearAll}
            color="error"
            variant="contained"
            sx={{ fontFamily: "Vazirmatn, sans-serif" }}
          >
            <Icon path={mdiDeleteSweepOutline} size={1} />
            بله، همه را حذف کن
          </Button>
        </DialogActions>
      </Dialog>

      {/* هدر صفحه */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-200 flex gap-1">
          <Icon path={mdiCartOutline} size={1.3} />
          سبد خرید
        </h1>

        {/* دکمه حذف همه — فقط وقتی بیش از یک محصول وجود داشته باشد */}
        {cartItems.length > 1 && (
          <button
            className="delete-btn flex items-center gap-1 text-red-500 hover:text-red-700 transition cursor-pointer disabled:opacity-50"
            onClick={() => setClearDialog(true)}
            disabled={clearLoading}
          >
            <div className="trash-container">
              <Trash2 className="trash-body w-5 h-5" />
              <div className="trash-lid-wrapper">
                <Trash2 className="w-5 h-5" />
              </div>
            </div>
            <span className="text-sm font-medium">
              {clearLoading ? "در حال حذف همه..." : "حذف همه"}
            </span>
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">هیچ محصولی به سبد خرید شما اضافه نشده است.</p>
      ) : (
        <>
          <ul className="space-y-2">
            {cartItems.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center p-4 border rounded-lg bg-white shadow-sm"
              >
                <div className="flex items-center gap-4">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={60}
                      height={60}
                      className="object-contain rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      بدون تصویر
                    </div>
                  )}
                  <div>
                    <Link
                      href={`/products/${item.slug || item.Product?.slug}`}
                      className="font-semibold hover:text-pink-500 transition"
                    >
                      {item.name || item.Product?.name}
                    </Link>
                    <span className="text-gray-600 block mt-1">
                      تعداد: {item.quantity.toLocaleString("fa-IR")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">
                    {(item.price * item.quantity).toLocaleString("fa-IR")} تومان
                  </span>
                  <button
                    className="delete-btn flex items-center gap-1 text-red-500 hover:text-red-700 transition cursor-pointer disabled:opacity-50"
                    onClick={() => handleRemove(item.id, item.name)}
                    disabled={deleteLoading === item.id}
                  >
                    <div className="trash-container">
                      <Trash2 className="trash-body w-5 h-5" />
                      <div className="trash-lid-wrapper">
                        <Trash2 className="w-5 h-5" />
                      </div>
                    </div>
                    <span>{deleteLoading === item.id ? "در حال حذف..." : "حذف"}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* باکس خلاصه */}
          {!showForm && (
            <div className="text-right mt-6 mb-[-1] rounded-xl">
              <button
                onClick={handleOpenForm}
                disabled={summarySpinning}
                className={`px-4 py-2 flex items-center justify-center gap-1 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition cursor-pointer disabled:opacity-50 ${summarySpinning ? "spin-fade-out" : ""}`}
              >
                <ClipboardList className="w-5 h-5" />
                ثبت سفارش
              </button>
            </div>
          )}

          {/* فرم با انیمیشن حبابی */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className={`mt-4 p-4 border rounded-lg bg-gray-50 ${formVisible ? "bubble-in" : "bubble-out"}`}
            >
              <TextField
                {...rtlStyles}
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                label="شماره تلفن"
                placeholder="مثال: 09124567891"
                className="border p-2 w-full mb-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <div className="flex gap-2 mt-3">
                <button
                  type="submit"
                  disabled={loading || !isPhoneValid}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                  {loading ? "در حال انتقال به درگاه پرداخت..." : "تأیید و پرداخت"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCloseForm}
                  className="flex items-center justify-center gap-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition disabled:opacity-50 cursor-pointer"
                >
                  لغو
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}