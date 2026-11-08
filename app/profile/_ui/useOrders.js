"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useCart } from "@/lib/context";

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

// سفارش‌های کاربر برای نمای کلی، شمارنده‌های دوک و بخش سفارش‌ها (یک منبع برای همه). با هر عوض‌شدن بخش (refreshKey) دوباره گرفته می‌شود،
// مثلاً بعد از حذف سفارش ناتمام یا برگشت از درگاه. null = هنوز نیامده؛ اگر بار اول خطا بخورد لیست خالی است تا صفحه گیر نکند.
// payOrder و deleteOrder همان منطق صفحهٔ سفارش‌های قبلی‌اند: مبلغ و آدرس برگشت از درگاه را سرور تعیین می‌کند و حذف سفارش ناتمام، سبد را هم خالی می‌کند
export function useOrders(userId, refreshKey) {
  const { clearCart } = useCart();
  const [orders, setOrders] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!userId) return undefined;
    let alive = true;
    fetch("/api/orders", { headers: auth() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => alive && setOrders((prev) => (Array.isArray(data?.orders) ? data.orders : prev ?? [])))
      .catch(() => alive && setOrders((prev) => prev ?? []));
    return () => {
      alive = false;
    };
  }, [userId, refreshKey]);

  const payOrder = async (order) => {
    setPayingId(order.id);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth() },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (res.ok && data.result === 100) {
        window.location.href = data.payUrl;
        return;
      }
      toast.error(data.error || `مشکل در اتصال به درگاه پرداخت (کد: ${data.result})`);
    } catch {
      toast.error("مشکلی پیش آمد. دوباره تلاش کنید.");
    }
    setPayingId(null);
  };

  const deleteOrder = async (order) => {
    setDeletingId(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE", headers: auth() });
      if (res.ok) {
        setOrders((prev) => (prev ? prev.filter((o) => o.id !== order.id) : prev));
        clearCart();
        toast.success("محصول موردنظر از سفارش های شما و سبد خرید شما حذف شد", { icon: "🗑️" });
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "خطا در حذف سفارش");
      }
    } catch {
      toast.error("مشکلی پیش آمد.");
    }
    setDeletingId(null);
  };

  return { orders, payingId, deletingId, payOrder, deleteOrder };
}
