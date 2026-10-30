"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { CheckCircle, MailCheck, RefreshCw } from "lucide-react";
import AuthShell from "./auth/AuthShell";
import { AuthCard, AuthTitle, Field, SubmitButton, TextInput } from "./auth/AuthUI";

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
  const [shakeCode, setShakeCode] = useState(false); // برای لرزش فیلد کد
  const [touched, setTouched] = useState(false); // برای tracking لمس فیلد
  const router = useRouter();

  // تابع ایجاد لرزش
  const triggerShake = () => {
    setShakeCode(true);
    setTimeout(() => {
      setShakeCode(false);
    }, 500);
  };

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

  const showError = !!codeError && touched;

  return (
    <AuthShell
      heading="یک قدم تا ورود"
      lead="کد ۶ رقمی که به ایمیل شما فرستادیم را وارد کنید تا حساب شما فعال شود."
    >
      <AuthCard>
        <AuthTitle
          icon={MailCheck}
          title="تأیید ایمیل"
          text={
            <>
              کد تأیید به ایمیل <strong dir="ltr" className="font-semibold text-gray-700">{email || "نامشخص"}</strong> ارسال شده است.
            </>
          }
        />

        <form onSubmit={handleVerifyCode} noValidate className="space-y-4">
          <Field id="verify-code" label="کد تأیید (۶ رقم)" error={showError ? codeError : ""} shake={shakeCode}>
            <TextInput
              id="verify-code"
              ltr
              type="text"
              name="code"
              autoComplete="one-time-code"
              placeholder="------"
              className="text-center text-xl tracking-[0.4em]"
              value={verificationCode}
              onChange={handleCodeChange}
              onBlur={handleBlur}
              invalid={showError}
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </Field>

          <SubmitButton loading={isVerifying} loadingText="در حال تأیید..." icon={CheckCircle}>
            تأیید
          </SubmitButton>

          <button
            type="button"
            onClick={sendNewCode}
            disabled={isResending || cooldown > 0}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-medium text-brand-700 transition enabled:hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            <RefreshCw className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`} aria-hidden="true" />
            {cooldown > 0
              ? `ارسال مجدد کد (${cooldown.toLocaleString("fa-IR")} ثانیه)`
              : "ارسال مجدد کد"}
          </button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
