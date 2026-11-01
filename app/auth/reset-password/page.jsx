"use client";

import React, { useState, useEffect, Suspense } from "react";
import { ArrowRight, RotateCcwKey } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/app/components/auth/AuthShell";
import PageLoader from "@/app/components/PageLoader";
import { AuthCard, AuthTitle, Field, LINK_BUTTON, PasswordInput, SubmitButton } from "@/app/components/auth/AuthUI";

const SHELL = {
  heading: "رمز عبور تازه بسازید",
  lead: "رمزی انتخاب کنید که حدس زدنش سخت و یادآوری‌اش برای خودتان آسان باشد.",
};

function ResetPasswordContent() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const router = useRouter();
  const searchParams = useSearchParams();

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

  if (isValidating) {
    return (
      <AuthShell {...SHELL}>
        <AuthCard className="py-10!">
          <PageLoader size="md" label="در حال بررسی لینک بازیابی..." />
        </AuthCard>
      </AuthShell>
    );
  }

  if (!isTokenValid) {
    return null;
  }

  return (
    <AuthShell {...SHELL}>
      <AuthCard>
        <AuthTitle
          icon={RotateCcwKey}
          title="تغییر رمز عبور"
          text={
            <>
              برای حساب کاربری با ایمیل <strong dir="ltr" className="font-semibold text-gray-700">{email}</strong> رمز عبور جدید خود را وارد کنید.
            </>
          }
        />

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field index={0} id="reset-new" label="رمز عبور جدید" error={errors.newPassword} hint="حداقل ۸ کاراکتر شامل حرف انگلیسی، عدد و یک نماد مانند @">
            <PasswordInput
              id="reset-new"
              name="newPassword"
              meter
              autoComplete="new-password"
              placeholder="A@12865"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              invalid={!!errors.newPassword}
            />
          </Field>

          <Field index={1} id="reset-confirm" label="تأیید رمز عبور جدید" error={errors.confirmPassword}>
            <PasswordInput
              id="reset-confirm"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="A@12865"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              invalid={!!errors.confirmPassword}
            />
          </Field>

          <SubmitButton loading={isSubmitting} loadingText="در حال تغییر رمز عبور..." icon={RotateCcwKey}>
            تغییر رمز عبور
          </SubmitButton>

          <div className="text-center">
            <button type="button" onClick={() => router.push("/auth")} className={LINK_BUTTON}>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              بازگشت به صفحه ورود
            </button>
          </div>
        </form>
      </AuthCard>
    </AuthShell>
  );
}

// useSearchParams باید داخل Suspense باشد، وگرنه build این صفحه شکست می‌خورد
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoader className="min-h-screen" label="در حال بررسی لینک بازیابی..." />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
