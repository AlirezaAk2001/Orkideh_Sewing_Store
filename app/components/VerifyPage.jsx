"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Button, CircularProgress, TextField } from "@mui/material";
import { CheckCircle } from "lucide-react";
import Image from "next/image";

// حداقل فاصلهٔ دو بار ارسال کد (سرور هم همین‌قدر فاصله می‌خواهد)
const RESEND_COOLDOWN_SEC = 60;

export default function VerifyPage({ tempAuth }) {
  const [verificationCode, setVerificationCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [email, setEmail] = useState(tempAuth?.email || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  // زمان پایان فاصلهٔ ارسال مجدد؛ ثانیه‌های باقی‌مانده از ساعت محاسبه می‌شود (نه با کم‌کردن در هر تیک)،
  // چون وقتی کاربر برای دیدن ایمیل به تب دیگری می‌رود تایمر این تب کند می‌شود
  const [cooldownEnd, setCooldownEnd] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const cooldown = Math.max(0, Math.ceil((cooldownEnd - now) / 1000));
  const counting = cooldown > 0;
  const autoResendStarted = useRef(false);

  const startCooldown = useCallback((seconds) => {
    const t = Date.now();
    setNow(t);
    setCooldownEnd(t + seconds * 1000);
  }, []);
  const [backgroundImage, setBackgroundImage] = useState("/image/logo.png");
  const [isBgLoaded, setIsBgLoaded] = useState(false);
  const [shakeCode, setShakeCode] = useState(false); // برای لرزش فیلد کد
  const [touched, setTouched] = useState(false); // برای tracking لمس فیلد
  const router = useRouter();

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

  // تابع ایجاد لرزش
  const triggerShake = () => {
    setShakeCode(true);
    setTimeout(() => {
      setShakeCode(false);
    }, 500);
  };

  useEffect(() => {
    const fetchBackground = async () => {
      try {
        const resp = await fetch("/api/background");
        if (!resp.ok) throw new Error("خطا در دریافت تصویر پس‌زمینه");
        const data = await resp.json();
        setBackgroundImage(data.data?.background_image || "/image/logo.png");
      } catch (err) {
        console.error("خطا در لود تصویر پس‌زمینه:", err);
      } finally {
        setIsBgLoaded(true);
      }
    };
    fetchBackground();
  }, []);

  // گرفتن ایمیل از tempAuth یا localStorage
  useEffect(() => {
    if (!tempAuth?.email) {
      const savedEmail = localStorage.getItem("signupEmail");
      if (savedEmail) setEmail(savedEmail);
    } else {
      setEmail(tempAuth.email);
    }
  }, [tempAuth]);

  // درخواست کد تأیید تازه (کد قبلی باطل می‌شود)
  const sendNewCode = useCallback(async () => {
    if (!email) {
      toast.error("ایمیل کاربر یافت نشد. لطفاً دوباره ثبت‌نام کنید");
      return;
    }

    setIsResending(true);
    try {
      const resp = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await resp.json().catch(() => ({}));

      if (resp.ok) {
        toast.success(data.message || "کد تأیید جدید ارسال شد.");
        startCooldown(RESEND_COOLDOWN_SEC);
      } else {
        toast.error(data.error || "ارسال کد ناموفق بود.");
        if (data.retryAfter) startCooldown(Math.min(data.retryAfter, RESEND_COOLDOWN_SEC));
      }
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setIsResending(false);
    }
  }, [email, startCooldown]);

  // بعد از رد شدن ورود به‌خاطر ایمیل تأییدنشده (/verify?resend=1) خودکار یک کد تازه می‌فرستیم
  useEffect(() => {
    if (!email || autoResendStarted.current) return;
    if (new URLSearchParams(window.location.search).get("resend") !== "1") return;
    autoResendStarted.current = true;
    window.history.replaceState(null, "", "/verify"); // رفرش صفحه دوباره کد نفرستد
    sendNewCode();
  }, [email, sendNewCode]);

  useEffect(() => {
    if (!counting) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [counting]);

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    // اعتبارسنجی کد تأیید
    if (!verificationCode.trim()) {
      setCodeError("کد تأیید نمی‌تواند خالی باشد");
      setTouched(true);
      triggerShake();
      return;
    }
    
    if (verificationCode.length !== 6) {
      setCodeError("کد تأیید باید ۶ رقم باشد");
      setTouched(true);
      triggerShake();
      return;
    }

    if (!email) {
      setCodeError("ایمیل کاربر یافت نشد. لطفاً دوباره ثبت‌نام کنید");
      setTouched(true);
      triggerShake();
      setTimeout(() => {
        router.push("/auth");
      }, 2000);
      return;
    }

    setCodeError("");
    setIsVerifying(true);

    try {
      const resp = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Verification failed");

      toast.success("ایمیل شما با موفقیت تأیید شد!");

      setTimeout(() => {
        localStorage.removeItem("signupEmail");
        router.push("/auth");
      }, 2000);
    } catch (error) {
      setCodeError(error.message || "کد تأیید اشتباه است.");
      setTouched(true);
      triggerShake(); // لرزش هنگام خطا
      toast.error(error.message || "کد تأیید اشتباه است.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value;
    // فقط اعداد مجاز هستند
    if (/^\d*$/.test(value) && value.length <= 6) {
      setVerificationCode(value);
      if (codeError) {
        setCodeError("");
      }
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (!verificationCode.trim()) {
      setCodeError("کد تأیید نمی‌تواند خالی باشد");
    } else if (verificationCode.length !== 6) {
      setCodeError("کد تأیید باید ۶ رقم باشد");
    } else {
      setCodeError("");
    }
  };

  // ✅ لودینگ قبل از نمایش فرم
  if (!isBgLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Image
          src="/image/logo.png"
          alt="در حال بارگذاری صفحه تأیید..."
          width={80}
          height={80}
          className="animate-spin object-contain"
          priority
        />
        <p className="mt-4 text-gray-500 text-sm font-medium animate-pulse">
          در حال بارگذاری صفحه تأیید...
        </p>
      </div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 2000,
          style: {
            direction: "rtl",
            fontFamily: "inherit",
          },
        }}
      />
      
      {/* پس‌زمینه با blur و opacity */}
      <div
        className="fixed inset-0 z-0"
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

      {/* فرم تأیید */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="w-full max-w-xs sm:max-w-md md:max-w-lg backdrop-blur-md bg-white/20 border border-white/30 p-4 sm:p-6 md:p-8 rounded-xl shadow-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key="verify"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4 text-center">
                تأیید ایمیل
              </h2>

              <form onSubmit={handleVerifyCode} className="space-y-2 sm:space-y-3 md:space-y-4" dir="rtl">
                <p className="text-center text-gray-600 mb-2 sm:mb-4 text-xs sm:text-sm md:text-base">
                  کد تأیید به ایمیل <strong>{email || "نامشخص"}</strong> ارسال شده است.
                </p>

                <motion.div
                  animate={shakeCode ? {
                    x: [0, -10, 10, -8, 8, -5, 5, 0],
                    transition: { duration: 0.4 }
                  } : {}}
                >
                  <TextField
                    {...rtlStyles}
                    type="text"
                    label="کد تأیید (۶ رقم)"
                    className="w-full p-2 sm:p-3 md:p-4 border rounded text-sm sm:text-base"
                    value={verificationCode}
                    onChange={handleCodeChange}
                    onBlur={handleBlur}
                    error={!!codeError && touched}
                    inputProps={{
                      maxLength: 6,
                      inputMode: "numeric",
                      pattern: "[0-9]*"
                    }}
                  />
                </motion.div>

                {codeError && touched && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs sm:text-sm md:text-base mt-1"
                  >
                    {codeError}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  fullWidth
                  disabled={isVerifying}
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
                  {isVerifying ? (
                    <>
                      <CircularProgress size={24} color="inherit" />
                      در حال تأیید...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={22} />
                      تأیید
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="text"
                  fullWidth
                  onClick={sendNewCode}
                  disabled={isResending || cooldown > 0}
                  sx={{ fontSize: "0.9rem", "&.Mui-disabled": { color: "text.secondary" } }}
                >
                  {cooldown > 0
                    ? `ارسال مجدد کد (${cooldown.toLocaleString("fa-IR")} ثانیه)`
                    : "ارسال مجدد کد"}
                </Button>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}