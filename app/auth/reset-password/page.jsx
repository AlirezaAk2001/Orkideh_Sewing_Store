"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Button, CircularProgress, TextField } from "@mui/material";
import { RotateCcwKey, IterationCcw } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function ResetPasswordContent() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [backgroundImage, setBackgroundImage] = useState("/image/logo.png");
  const [isBgLoaded, setIsBgLoaded] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // در قسمت useEffect برای fetchBackground:
  useEffect(() => {
    const fetchBackground = async () => {
      try {
        const resp = await fetch("/api/background");
        if (!resp.ok) throw new Error("خطا در دریافت تصویر پس‌زمینه");
        const data = await resp.json();
        setBackgroundImage(data.data?.background_image || "/image/logo.png");
      } catch (err) {
        console.error("خطا در لود تصویر پس‌زمینه:", err);
        // در صورت خطا از تصویر پیش‌فرض استفاده کن
        setBackgroundImage("/image/back-auth.webp");
      } finally {
        setIsBgLoaded(true);
      }
    };
    fetchBackground();
  }, []);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      validateToken(tokenParam);
    } else {
      setIsValidating(false);
      toast.error("لینک بازیابی معتبر نیست.");
      router.push("/auth/forgot-password");
    }
  }, [searchParams, router]);

  const validateToken = async (token) => {
    try {
      const resp = await fetch(`/api/auth/validate-reset-token?token=${token}`);
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || "توکن نامعتبر است");
      }

      setIsTokenValid(true);
      setEmail(data.email);
    } catch (error) {
      toast.error(error.message || "لینک بازیابی منقضی شده یا نامعتبر است.");
      router.push("/auth/forgot-password");
    } finally {
      setIsValidating(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&_])[A-Za-z\d@$!%*#?&_]{8,}$/;

    if (!newPassword) {
      newErrors.newPassword = "رمز عبور جدید الزامی است";
    } else if (!passwordRegex.test(newPassword)) {
      newErrors.newPassword = "رمز عبور باید حداقل ۸ کاراکتر، شامل عدد، حرف و یک کاراکتر خاص باشد";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "تأیید رمز عبور الزامی است";
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = "تأیید رمز عبور با رمز عبور مطابقت ندارد";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!isTokenValid) {
      toast.error("لینک بازیابی معتبر نیست.", { position: "top-center" });
      return;
    }

    setIsSubmitting(true);

    try {
      const resp = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || "عملیات ناموفق بود");
      }

      toast.success("رمز عبور شما با موفقیت تغییر کرد. در حال انتقال به صفحه ورود...", {
        duration: 3000,
        position: "top-center", // اضافه شده برای نمایش در وسط بالا
      });

      // تأخیر کوتاه برای نمایش toast قبل از ریدایرکت
      setTimeout(() => {
        router.push("/auth");
      }, 1500);

    } catch (error) {
      toast.error(error.message || "عملیات شکست خورد", {
        position: "top-center", // اضافه شده برای نمایش در وسط بالا
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isBgLoaded || isValidating) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[70vh] bg-gray-100 overflow-hidden">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Image
            src="/image/logo.png"
            alt="در حال بارگذاری..."
            width={80}
            height={80}
            className="animate-spin object-contain"
            priority
          />
          <p className="mt-4 text-gray-600 text-base sm:text-lg font-medium animate-pulse">
            {isValidating ? "در حال بررسی لینک بازیابی..." : "در حال بارگذاری..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isTokenValid && !isValidating) {
    return null;
  }

  if (!isBgLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Image
          src="/image/logo.png"
          alt="در حال بارگذاری..."
          width={80}
          height={80}
          className="animate-spin object-contain"
          priority
        />
        <p className="mt-4 text-gray-500 text-sm font-medium animate-pulse">
          در حال بارگذاری...
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex overflow-y-auto px-4 py-6 [@media(max-height:680px)]:pt-36">
      {/* پس‌زمینه با blur و opacity (overflow-hidden برای مخفی‌کردن لبه‌های scale) */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(/image/back-auth.webp)`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(6px)",
            opacity: 0.45,
            transform: "scale(1.05)",
          }}
        />
      </div>
      {/* m-auto + اسکرول والد: در صفحه‌های کوتاه فرم بریده نمی‌شود؛ pt-36 جا را برای هدر sticky باز می‌کند */}
      <div className="relative z-20 m-auto w-full max-w-md sm:max-w-lg md:max-w-xl backdrop-blur-md bg-white/20 border border-white/30 p-4 sm:p-6 md:p-8 rounded-xl shadow-lg">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4 text-center flex gap-1 justify-center">
            <RotateCcwKey className="w-10 h-10" />
            تغییر رمز عبور
          </h2>

          <p className="text-center text-gray-600 mb-4 text-sm sm:text-base">
            برای حساب کاربری با ایمیل: <strong>{email}</strong>
          </p>
          <p className="text-center text-gray-500 mb-6 text-xs sm:text-sm">
            لطفاً رمز عبور جدید خود را وارد کنید.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
            <div>
              <TextField
                {...rtlStyles}
                type="password"
                label="رمز عبور جدید"
                className="w-full p-3 sm:p-4 border rounded text-sm sm:text-base"
                value={newPassword}
                placeholder="مثال: A@12865"
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {errors.newPassword && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.newPassword}</p>
              )}
            </div>

            <div>
              <TextField
                {...rtlStyles}
                type="password"
                label="تأیید رمز عبور جدید"
                className="w-full p-3 sm:p-4 border rounded text-sm sm:text-base"
                value={confirmPassword}
                placeholder="مثال: A@12865"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="contained"
              color="success"
              fullWidth
              disabled={isSubmitting}
              sx={{
                py: 1.5,
                fontSize: "1rem",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={24} color="inherit" />
                  در حال تغییر رمز عبور...
                </>
              ) : (
                <>
                  <RotateCcwKey size={22} />
                  تغییر رمز عبور
                </>
              )}
            </Button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => router.push("/auth")}
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium text-sm sm:text-base cursor-pointer inline-flex items-center gap-1"
              >
                <IterationCcw className="w-5 h-5" />
                بازگشت به صفحه ورود
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

// useSearchParams باید داخل Suspense باشد، وگرنه build این صفحه شکست می‌خورد
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}