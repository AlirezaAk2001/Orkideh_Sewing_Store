"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button, CircularProgress, TextField } from "@mui/material";
import { ArrowRight, IterationCcw } from "lucide-react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState("/image/logo.png");
  const [isBgLoaded, setIsBgLoaded] = useState(false);
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
      setIsBgLoaded(true); // ✅ اینجا اضافه کن
    }
  };
  fetchBackground();
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      Swal.fire("خطا", "لطفاً یک ایمیل معتبر وارد کنید.", "error");
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

      Swal.fire({
        title: "موفق",
        text: "لینک تاًییدیه رمز عبور به ایمیل شما ارسال شد.",
        icon: "success",
        confirmButtonText: "متوجه شدم",
      }).then(() => {
        router.push("/auth");
      });

    } catch (error) {
      Swal.fire("خطا", error.message || "عملیات شکست خورد", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden mt-8">
      {/* پس‌زمینه با blur و opacity */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(/image/back-auth.png)`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(6px)",
          opacity: 0.45,
          transform: "scale(1.05)",
        }}
      />
      <div className="relative z-20 w-full max-w-md sm:max-w-lg md:max-w-xl backdrop-blur-md bg-white/20 border border-white/30 p-4 sm:p-6 md:p-8 rounded-xl shadow-lg my-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4 text-center">
            بازیابی رمز عبور
          </h2>
          
          <p className="text-center text-gray-600 mb-6 text-sm sm:text-base">
            لطفاً ایمیل خود را وارد کنید. لینک تاًییدیه رمز عبور به ایمیل شما ارسال خواهد شد.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
            <div>
              <TextField
                {...rtlStyles}
                type="email"
                label="ایمیل"
                className="w-full p-3 sm:p-4 border rounded text-sm sm:text-base"
                value={email}
                placeholder="example@gmail.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={isSubmitting}
              sx={{
                py: 1.5,
                fontSize: "1rem",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "3px",
              }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={24} color="inherit" />
                  در حال ارسال...
                </>
              ) : (
                <>
                  <ArrowRight size={20} />
                  ادامه
                </>
              )}
            </Button>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => router.push("/auth")}
                className="flex items-center justify-center gap-1 text-blue-600 hover:text-blue-800 transition-colors font-medium text-sm sm:text-base cursor-pointer mx-auto"
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