"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { CheckCircle, CircleAlert, Clock, Mail } from "lucide-react";
import AuthShell from "./auth/AuthShell";
import { AuthCard, SubmitButton } from "./auth/AuthUI";
import OtpInput, { CODE_LENGTH } from "./auth/OtpInput";
import { ResendButton, VerifyEnvelope, VerifySteps, VerifySuccess } from "./auth/VerifyParts";
import "./auth/verify.css";

// حداقل فاصلهٔ دو بار ارسال کد (سرور هم همین‌قدر فاصله می‌خواهد)
const RESEND_COOLDOWN_SEC = 60;
// مکث بعد از تأیید موفق تا رفتن به صفحهٔ ورود (نوار پیشرفت نمای موفقیت هم همین مدت پر می‌شود)
const REDIRECT_MS = 2000;

export default function VerifyPage({ tempAuth }) {
  const [verificationCode, setVerificationCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [email, setEmail] = useState(tempAuth?.email || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sentCount, setSentCount] = useState(0); // با هر کد تازه پاکت‌نامه از نو می‌رسد
  const inputRef = useRef(null);
  const busyRef = useRef(false); // درخواست تأیید در راه است (برخلاف state همان لحظه معلوم می‌شود)
  const rejectedRef = useRef(null); // آخرین کدی که سرور نپذیرفت، همراه پیامش
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
  const [shakeCode, setShakeCode] = useState(false); // برای لرزش خانه‌های کد
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
        // کد قبلی دیگر معتبر نیست: خانه‌ها خالی و آمادهٔ کد تازه می‌شوند
        rejectedRef.current = null;
        setVerificationCode("");
        setCodeError("");
        setSentCount((c) => c + 1);
        inputRef.current?.focus();
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

  // بررسی کد؛ هم با دکمه (یا Enter) و هم خودکار با رقم ششم
  const verifyCode = async (code) => {
    if (busyRef.current || verified) return;

    // اعتبارسنجی کد تأیید
    if (!code) {
      setCodeError("کد تأیید نمی‌تواند خالی باشد");
      setTouched(true);
      triggerShake();
      return;
    }

    if (code.length !== CODE_LENGTH) {
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
    busyRef.current = true;

    try {
      const resp = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        const message = data.error || "Verification failed";
        // فقط ردِ خود کد (نه خطای سرور یا محدودیت تعداد) به یاد می‌ماند
        if (resp.status === 400 || resp.status === 404) rejectedRef.current = { code, message };
        throw new Error(message);
      }

      setVerified(true);
      toast.success("ایمیل شما با موفقیت تأیید شد!");

      setTimeout(() => {
        localStorage.removeItem("signupEmail");
        router.push("/auth");
      }, REDIRECT_MS);
    } catch (error) {
      setCodeError(error.message || "کد تأیید اشتباه است.");
      setTouched(true);
      triggerShake(); // لرزش هنگام خطا
      toast.error(error.message || "کد تأیید اشتباه است.");
      inputRef.current?.focus();
    } finally {
      busyRef.current = false;
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    verifyCode(verificationCode);
  };

  // رقم ششم (تایپ، چسباندن یا پر کردن خودکار) کد را بدون زدن دکمه می‌فرستد؛ هنگام بررسی خانه‌ها تغییر نمی‌کنند.
  // کدی که همین حالا رد شده خودکار دوباره فرستاده نمی‌شود تا از تعداد محدود تلاش‌ها کم نکند؛ فقط همان پیام برمی‌گردد
  const handleCodeChange = (value) => {
    if (busyRef.current || value === verificationCode) return;
    setVerificationCode(value);
    setCodeError("");
    if (value.length !== CODE_LENGTH) return;

    const rejected = rejectedRef.current;
    if (rejected?.code === value) {
      setCodeError(rejected.message);
      setTouched(true);
      triggerShake();
      return;
    }
    verifyCode(value);
  };

  // خالی‌ماندن خانه‌ها خطا نیست (مثلاً وقتی کاربر برای دیدن ایمیل بیرون می‌رود)؛ فقط کد نیمه‌کاره پیام می‌گیرد
  const handleBlur = () => {
    if (!verificationCode || verificationCode.length === CODE_LENGTH) return;
    setTouched(true);
    setCodeError("کد تأیید باید ۶ رقم باشد");
  };

  const showError = !!codeError && touched;

  return (
    <AuthShell
      heading="یک قدم تا ورود"
      lead="کد ۶ رقمی که به ایمیل شما فرستادیم را وارد کنید تا حساب شما فعال شود."
    >
      <AuthCard className="vf-card">
        <VerifySteps done={verified} />

        <div className="vf-stage" data-done={verified || undefined}>
          <div className="vf-main" inert={verified}>
            <VerifyEnvelope key={sentCount} filled={verificationCode.length} total={CODE_LENGTH} invalid={showError} />

            <div className="auth-rise text-center" style={{ "--i": 1 }}>
              <h1 className="text-2xl font-extrabold text-gray-900">تأیید ایمیل</h1>
              <p className="mt-1 text-sm leading-6 text-gray-500">کد ۶ رقمی را به این نشانی فرستادیم</p>
              <p className="vf-mail">
                <span className="vf-mail-icon" aria-hidden="true">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <strong dir="ltr">{email || "نامشخص"}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="auth-rise mt-5" style={{ "--i": 2 }}>
              <label htmlFor="verify-code" className="sr-only">
                کد تأیید ۶ رقمی
              </label>
              <OtpInput
                ref={inputRef}
                id="verify-code"
                name="code"
                autoFocus
                aria-describedby="verify-note"
                value={verificationCode}
                onChange={handleCodeChange}
                onBlur={handleBlur}
                invalid={showError}
                shake={shakeCode}
              />

              {showError ? (
                <p id="verify-note" role="alert" className="vf-note auth-message text-red-600">
                  <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {codeError}
                </p>
              ) : (
                <p id="verify-note" className="vf-note text-gray-500">
                  <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  کد تا ۵ دقیقه اعتبار دارد
                </p>
              )}

              <div className="mt-3">
                <SubmitButton loading={isVerifying} loadingText="در حال تأیید..." icon={CheckCircle} disabled={verificationCode.length !== CODE_LENGTH}>
                  تأیید
                </SubmitButton>
              </div>
            </form>

            <div className="vf-resend auth-rise" style={{ "--i": 3 }}>
              <p className="text-xs leading-5 text-gray-500">کدی دریافت نکردید؟ پوشهٔ هرزنامه (Spam) را هم ببینید.</p>
              <ResendButton cooldown={cooldown} total={RESEND_COOLDOWN_SEC} sending={isResending} onClick={sendNewCode} />
            </div>
          </div>

          {verified && <VerifySuccess ms={REDIRECT_MS} />}
        </div>
      </AuthCard>
    </AuthShell>
  );
}
