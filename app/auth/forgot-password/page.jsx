"use client";

import React, { useState } from "react";
import { ArrowRight, KeyRound, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast"; // 🍞 جایگزین Swal
import AuthShell from "@/app/components/auth/AuthShell";
import { AuthCard, AuthTitle, Field, LINK_BUTTON, SubmitButton, TextInput } from "@/app/components/auth/AuthUI";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("لطفاً یک ایمیل معتبر وارد کنید."); // 🍞 جایگزین Swal.fire
      return;
    }

    setIsSubmitting(true);

    try {
      const resp = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || "عملیات ناموفق بود");
      }

      // 🍞 نمایش موفقیت با Toast
      toast.success("لینک تأییدیه رمز عبور به ایمیل شما ارسال شد.");

      // 🍞 هدایت به صفحه ورود پس از اندکی تأخیر (برای دیده شدن Toast)
      setTimeout(() => {
        router.push("/auth");
      }, 1500);

    } catch (error) {
      toast.error(error.message || "عملیات شکست خورد"); // 🍞 جایگزین Swal.fire
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      heading="رمز عبور را فراموش کرده‌اید؟"
      lead="مشکلی نیست. ایمیل حساب خود را بنویسید تا لینک تعیین رمز تازه برایتان ارسال شود."
    >
      <AuthCard>
        <AuthTitle
          icon={KeyRound}
          title="بازیابی رمز عبور"
          text="لطفاً ایمیل خود را وارد کنید. لینک تأییدیه رمز عبور به ایمیل شما ارسال خواهد شد."
        />

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field id="forgot-email" label="ایمیل">
            <TextInput
              id="forgot-email"
              ltr
              type="email"
              name="email"
              autoComplete="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <SubmitButton loading={isSubmitting} loadingText="در حال ارسال..." icon={Send}>
            ارسال لینک بازیابی
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
