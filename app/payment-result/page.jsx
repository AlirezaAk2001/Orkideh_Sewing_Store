"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/context"; // مسیر واقعی خودت رو قرار بده

export default function PaymentResultPage() {
  const [status, setStatus] = useState("در حال بررسی پرداخت...");
  const router = useRouter();
  const { clearCart } = useCart();
  const calledRef = useRef(false); // جلوگیری از فراخوانی چندباره

  useEffect(() => {
    if (calledRef.current) return; // اگر قبلاً اجرا شده، بیرون می‌زنیم
    calledRef.current = true;

    const verifyPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const trackId = params.get("trackId");

      if (!trackId) {
        setStatus("شناسه تراکنش یافت نشد!");
        setTimeout(() => router.push("/cart"), 2000);
        return;
      }

      setStatus("در حال تایید تراکنش... لطفاً صبور باشید.");

      try {
        const res = await axios.post("/api/payment/verify", { trackId });
        const data = res.data;

        // موفقیت اگر 100 یا 201 باشه
        if (data?.result === 100 || data?.result === 201) {
          await handleSuccess();
          return;
        }

        // اگر پاسخ 200 ولی نتیجه غیر از 100/201
        console.warn("Payment verification returned unexpected result:", data);
        setStatus(`پرداخت ناموفق ❌ (${data?.message || data?.error || "تراکنش نامعتبر"})`);
        setTimeout(() => router.push("/cart"), 2500);
      } catch (err) {
        // اگر سرور با 400 برگردونده اما داخل body نتیجه 201 هست => treat as success
        const respData = err?.response?.data;
        if (respData && (respData.result === 201 || /previously verif/i.test(respData.message || ""))) {
          console.log("Verify error thrown but server body indicates previously verified => treating as success", respData);
          await handleSuccess();
          return;
        }

        // در غیر این صورت خطای واقعی است
        console.error("Verify error:", err);
        setStatus(`پرداخت ناموفق ❌ ${respData?.error || "سفارش شما ذخیره شده، می‌توانید بعداً تکمیل کنید."}`);
        setTimeout(() => router.push("/orders"), 4000); // ← به orders نه cart
      }
    };

    const handleSuccess = async () => {
      setStatus("✅ پرداخت موفق! در حال تکمیل سفارش ...");
      // 1) پاکسازی سبد در کلاینت (در صورتی که Context داشته باشیم)
      try {
        if (typeof clearCart === "function") clearCart();
      } catch (e) {
        console.error("clearCart client error:", e);
      }

      // 2) پاکسازی سبد در سرور (اگر توکن و userId موجود باشد)
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        if (token && userId) {
          await axios.delete("/api/cart/clear", {
            headers: { Authorization: `Bearer ${token}` },
            data: { userId },
            timeout: 8000,
          });
          console.log("سبد خرید سرور خالی شد");
        }
      } catch (e) {
        console.error("server cart clear error:", e);
        // خطا در پاکسازی سرور نباید مانع نمایش موفقیت یا هدایت شود
      }

      // 3) هدایت به صفحه سفارش‌ها
      setTimeout(() => {
        router.push("/orders");
      }, 1200);
    };

    verifyPayment();
    // دقت: قرار ندادیم clearCart یا cartItems در dependency چون می‌خوایم فقط یکبار اجرا بشه
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center px-4 fixed inset-0">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">{status}</h2>
        <p className="text-gray-600">لطفاً تا زمان انتقال به صفحه‌ی سفارش‌ها صبر کنید...</p>
      </div>
    </div>
  );
}