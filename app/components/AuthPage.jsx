"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, CircularProgress, TextField } from "@mui/material";
import { LogIn, UserPlus } from "lucide-react";
import Icon from "@mdi/react";
import { mdiEyeOutline, mdiEyeOffOutline } from "@mdi/js";
import toast, { Toaster } from "react-hot-toast";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../lib/context";

const allowedAdmins = ["poshtibani.orkideh@gmail.com"];

const AnimatedTextField = ({ field, label, type = "text", formData, errors, touched, shakeFields, handleChange, handleBlur, ...props }) => {
  const hasError = errors[field] && touched[field];
  const isShaking = shakeFields[field];

  return (
    <div>
      <motion.div
        animate={isShaking ? {
          x: [0, -10, 10, -8, 8, -5, 5, 0],
          transition: { duration: 0.4 }
        } : {}}
      >
        <TextField
          {...rtlStyles}
          type={type}
          name={field}
          label={label}
          className="w-full p-2 sm:p-3 md:p-4 border rounded"
          value={formData[field]}
          onChange={handleChange}
          onBlur={handleBlur}
          error={hasError}
          {...props}
        />
      </motion.div>
      {hasError && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-xs sm:text-sm md:text-base mt-1"
        >
          {errors[field]}
        </motion.p>
      )}
    </div>
  );
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

export default function AuthPage() {
  const { login, loading, error, loginWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({}); // برای tracking فیلدهای لمس شده
  const [usernameExists, setUsernameExists] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [tempAuth, setTempAuth] = useState(null);
  const [shakeFields, setShakeFields] = useState({}); // برای افکت لرزش
  const pathname = usePathname();
  const router = useRouter();
  const [backgroundImage, setBackgroundImage] = useState("/image/logo.png");

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = "http://localhost:3000/auth/google/callback";
    const scope = "openid email profile";
    const responseType = "code";

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}`;

    window.location.href = url;
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
      }
    };
    fetchBackground();
  }, []);

  const persianRegex = /^[\u0600-\u06FF\s]+$/;
  const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&_])[A-Za-z\d@$!%*#?&_]{8,}$/;

  // تابع ایجاد لرزش برای فیلدهای خطادار
  const triggerShake = (fieldNames) => {
    const shakeEffects = {};
    fieldNames.forEach(field => {
      shakeEffects[field] = true;
    });
    setShakeFields(shakeEffects);
    setTimeout(() => {
      setShakeFields({});
    }, 500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "fullName") {
      const parts = value.trim().split(/\s+/);
      const first = parts[0] || "";
      const last = parts.slice(1).join(" ") || "";
      setFormData((prev) => ({ ...prev, fullName: value, firstName: first, lastName: last }));
      setTouched((prev) => ({ ...prev, fullName: true }));
      validateField("firstName", first);
      validateField("lastName", last);
      return;
    }
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  useEffect(() => {
    if (!formData.username || formData.username.length < 3) {
      setUsernameExists(false);
      setUsernameAvailable(false);
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    setUsernameExists(false);
    setUsernameAvailable(false);

    const checkUsernameExists = async () => {
      try {
        const res = await fetch(`/api/user/check-username?username=${formData.username}`);
        const data = await res.json();
        setUsernameExists(data.exists);
        setUsernameAvailable(!data.exists);
        if (data.exists) triggerShake(["username"]);
      } catch (err) {
        console.error("خطا در بررسی نام کاربری موجود:", err);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const timeout = setTimeout(checkUsernameExists, 600);
    return () => clearTimeout(timeout);
  }, [formData.username]); useEffect(() => {
    const checkUsernameExists = async () => {
      if (!formData.username || formData.username.length < 3) {
        setUsernameExists(false);
        return;
      }

      try {
        const res = await fetch(`/api/user/check-username?username=${formData.username}`);
        const data = await res.json();
        setUsernameExists(data.exists);
        if (data.exists) {
          triggerShake(["username"]);
        }
      } catch (err) {
        console.error("خطا در بررسی نام کاربری موجود:", err);
      }
    };

    const timeout = setTimeout(checkUsernameExists, 600);
    return () => clearTimeout(timeout);
  }, [formData.username]);

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "firstName":
        if (!value.trim()) error = "نام نمی‌تواند خالی باشد";
        else if (!persianRegex.test(value)) error = "نام باید به فارسی باشد";
        break;
      case "lastName":
        if (!value.trim()) error = "نام خانوادگی نمی‌تواند خالی باشد";
        else if (!persianRegex.test(value)) error = "نام خانوادگی باید به فارسی باشد";
        break;
      case "email":
        if (!isLogin) {
          // ولیدیشن سخت‌گیرانه فقط برای حالت ثبت‌نام
          if (!value.trim()) error = "ایمیل نمی‌تواند خالی باشد";
          else if (!/\S+@\S+\.\S+/.test(value)) error = "ایمیل معتبر وارد کنید";
        } else {
          // ولیدیشن ساده برای حالت ورود (ایمیل یا نام کاربری)
          if (!value.trim()) error = "ایمیل یا نام کاربری نمی‌تواند خالی باشد";
        }
        break;
      case "username":
        if (!value.trim()) error = "نام کاربری نمی‌تواند خالی باشد";
        else if (!usernameRegex.test(value))
          error = "نام کاربری باید فقط شامل حروف، اعداد یا _ باشد و حداقل ۳ کاراکتر داشته باشد";
        break;
      case "password":
        if (!value.trim() && !isLogin) error = "رمز عبور نمی‌تواند خالی باشد";
        else if (isLogin && !value.trim()) error = "رمز عبور نمی‌تواند خالی باشد";
        else if (!isLogin && !passwordRegex.test(value))
          error = "رمز عبور باید حداقل ۸ کاراکتر، شامل عدد، حرف و یک کاراکتر خاص باشد";
        break;
      case "confirmPassword":
        if (!value.trim()) error = "تأیید رمز عبور نمی‌تواند خالی باشد";
        else if (value !== formData.password) error = "تأیید رمز عبور با رمز عبور مطابقت ندارد";
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  const validateForm = () => {
    const { firstName, lastName, email, username, password, confirmPassword } = formData;
    const newErrors = {};
    const fieldsToValidate = [];

    if (!isLogin) {
      if (!firstName.trim()) {
        newErrors.firstName = "نام نمی‌تواند خالی باشد";
        fieldsToValidate.push("firstName");
      } else if (!persianRegex.test(firstName)) {
        newErrors.firstName = "نام باید به فارسی باشد";
        fieldsToValidate.push("firstName");
      }

      if (!lastName.trim()) {
        newErrors.lastName = "نام خانوادگی نمی‌تواند خالی باشد";
        fieldsToValidate.push("lastName");
      } else if (!persianRegex.test(lastName)) {
        newErrors.lastName = "نام خانوادگی باید به فارسی باشد";
        fieldsToValidate.push("lastName");
      }

      if (!email.trim()) {
        newErrors.email = "ایمیل نمی‌تواند خالی باشد";
        fieldsToValidate.push("email");
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = "ایمیل معتبر وارد کنید";
        fieldsToValidate.push("email");
      }

      if (!username.trim()) {
        newErrors.username = "نام کاربری نمی‌تواند خالی باشد";
        fieldsToValidate.push("username");
      } else if (!usernameRegex.test(username)) {
        newErrors.username = "نام کاربری باید فقط شامل حروف، اعداد یا _ باشد و حداقل ۳ کاراکتر داشته باشد";
        fieldsToValidate.push("username");
      }

      if (!password.trim()) {
        newErrors.password = "رمز عبور نمی‌تواند خالی باشد";
        fieldsToValidate.push("password");
      } else if (!passwordRegex.test(password)) {
        newErrors.password = "رمز عبور باید حداقل ۸ کاراکتر، شامل عدد، حرف و یک کاراکتر خاص باشد";
        fieldsToValidate.push("password");
      }

      if (!confirmPassword.trim()) {
        newErrors.confirmPassword = "تأیید رمز عبور نمی‌تواند خالی باشد";
        fieldsToValidate.push("confirmPassword");
      } else if (confirmPassword !== password) {
        newErrors.confirmPassword = "تأیید رمز عبور با رمز عبور مطابقت ندارد";
        fieldsToValidate.push("confirmPassword");
      }
    } else {
      // ولیدیشن حالت ورود
      if (!email.trim()) {
        newErrors.email = "ایمیل یا نام کاربری نمی‌تواند خالی باشد";
        fieldsToValidate.push("email");
      }

      if (!password.trim()) {
        newErrors.password = "رمز عبور نمی‌تواند خالی باشد";
        fieldsToValidate.push("password");
      }
    }

    setErrors(newErrors);

    // ایجاد لرزش برای فیلدهای خطادار
    if (fieldsToValidate.length > 0) {
      triggerShake(fieldsToValidate);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const resp = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: formData.email, password: formData.password }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Login failed");

        login(data.user, data.token);
        const userName = data.user.name || data.user.firstName + " " + data.user.lastName || "کاربر";
        sessionStorage.setItem("welcomeMessage", userName)
        router.push(data.user.role === "admin" ? "/admin" : "/profile");
      }
      else {
        const resp = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            username: formData.username,
            password: formData.password,
          }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Signup failed");

        localStorage.setItem("signupEmail", data.email);
        setTempAuth({
          email: data.email,
          role: allowedAdmins.includes(formData.email) ? "admin" : "user",
        });
        setIsVerifying(true);
        router.push("/verify");
      }
    } catch (error) {
      toast.error(error.message || "عملیات شکست خورد");
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!tempAuth || !tempAuth.email) {
      toast.error("اطلاعات یافت نشد");
      return;
    }

    try {
      const resp = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: tempAuth.email, code: verificationCode }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Verification failed");

      setIsVerifying(false);
      toast.success("ایمیل شما تأیید شد");
      setTimeout(() => {
        router.push("/auth");
      }, 2000);
    } catch (error) {
      toast.error(error.message || "کد تأیید اشتباه است.");
    }
  };

  useEffect(() => {
    if (!pathname) {
      console.error("Pathname is not available yet");
      return;
    }
    console.log("Pathname:", pathname, "isVerifying:", isVerifying, "loading:", loading);
  }, [pathname, isVerifying, loading]);

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 2000,
          style: {
            direction: "rtl",
            fontFamily: "inherit",
          },
        }}
      />
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden mt-8">
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
        <div className="relative z-20 w-full max-w-md sm:max-w-lg md:max-w-xl backdrop-blur-md bg-white/20 border border-white/30 p-4 sm:p-6 md:p-5 rounded-xl shadow-xl">
          <AnimatePresence mode="wait">
            {!isVerifying ? (
              <motion.div
                key="auth"
                initial={{ opacity: 0, x: isLogin ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? -50 : 50 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4 text-center">
                  {isLogin ? "ورود" : "ثبت‌نام"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-1 md:space-y-2" dir="rtl">
                  {!isLogin && (
                    <>
                      {/* باکس واحد نام و نام خانوادگی */}
                      <div>
                        <motion.div
                          animate={shakeFields.firstName || shakeFields.lastName ? {
                            x: [0, -10, 10, -8, 8, -5, 5, 0],
                            transition: { duration: 0.4 }
                          } : {}}
                        >
                          <TextField
                            {...rtlStyles}
                            fullWidth
                            type="text"
                            name="fullName"
                            label="نام و نام خانوادگی"
                            placeholder="مثال: محسن عزیزی"
                            value={formData.fullName}
                            onChange={handleChange}
                            onBlur={(e) => {
                              const parts = e.target.value.trim().split(/\s+/);
                              const first = parts[0] || "";
                              const last = parts.slice(1).join(" ") || "";

                              if (!first && !last) {
                                setErrors((prev) => ({ ...prev, firstName: "نام و نام خانوادگی نمی‌تواند خالی باشد" }));
                                setTouched((prev) => ({ ...prev, firstName: true }));
                              } else if (first && !last) {
                                setErrors((prev) => ({ ...prev, lastName: "نام خانوادگی نمی‌تواند خالی باشد" }));
                                setTouched((prev) => ({ ...prev, lastName: true }));
                              } else if (!first && last) {
                                setErrors((prev) => ({ ...prev, firstName: "نام نمی‌تواند خالی باشد" }));
                                setTouched((prev) => ({ ...prev, firstName: true }));
                              }
                            }}
                            error={!!((errors.firstName && touched.firstName) || (errors.lastName && touched.lastName))}
                          />
                        </motion.div>
                        <div>
                          {errors.firstName && touched.firstName && (
                            <motion.p
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-500 text-xs sm:text-sm mt-1"
                            >
                              {errors.firstName}
                            </motion.p>
                          )}
                          {errors.lastName && touched.lastName && !errors.firstName && (
                            <motion.p
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-500 text-xs sm:text-sm mt-1"
                            >
                              {errors.lastName}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      {/* نام کاربری اول */}
                      <div>
                        <AnimatedTextField
                          field="username"
                          label="نام کاربری"
                          formData={formData}
                          placeholder="مثال: aaa_123"
                          errors={errors}
                          touched={touched}
                          shakeFields={shakeFields}
                          handleChange={handleChange}
                          handleBlur={handleBlur}
                        />
                        <div>
                          {isCheckingUsername && formData.username.length >= 3 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm"
                            >
                              <CircularProgress size={14} color="inherit" />
                              <span>در حال بررسی نام کاربری...</span>
                            </motion.div>
                          )}
                          {!isCheckingUsername && usernameExists && (
                            <motion.p
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-500 text-xs sm:text-sm"
                            >
                              نام کاربری انتخاب شده تکراری است
                            </motion.p>
                          )}
                          {!isCheckingUsername && usernameAvailable && formData.username.length >= 3 && (
                            <motion.p
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-green-500 text-xs sm:text-sm"
                            >
                              نام کاربری انتخاب شده مورد قبول است
                            </motion.p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ایمیل بعد از نام کاربری */}
                  <AnimatedTextField
                    field="email"
                    label={isLogin ? "ایمیل یا نام کاربری" : "ایمیل"}
                    placeholder={isLogin ? "مثال: example@gmail.com یا aaa_123" : "example@gmail.com"}
                    type={isLogin ? "text" : "email"}
                    formData={formData}
                    errors={errors}
                    touched={touched}
                    shakeFields={shakeFields}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                  />

                  {/* رمز عبور و تأیید رمز عبور کنار هم */}
                  {!isLogin ? (
                    <div>
                      <div className="flex gap-2">
                        {/* رمز عبور */}
                        <div className="flex-1">
                          <motion.div
                            animate={shakeFields.password ? {
                              x: [0, -10, 10, -8, 8, -5, 5, 0],
                              transition: { duration: 0.4 }
                            } : {}}
                            className="relative"
                          >
                            <TextField
                              {...rtlStyles}
                              fullWidth
                              type={showPassword ? "text" : "password"}
                              name="password"
                              label="رمز عبور"
                              placeholder="مثال: A@123456"
                              value={formData.password}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              error={!!(errors.password && touched.password)}
                            />
                            {formData.password && (
                              <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                tabIndex={-1}
                              >
                                <Icon path={showPassword ? mdiEyeOffOutline : mdiEyeOutline} size={0.9} />
                              </button>
                            )}
                          </motion.div>
                        </div>
                        {/* تأیید رمز عبور */}
                        <div className="flex-1">
                          <motion.div
                            animate={shakeFields.confirmPassword ? {
                              x: [0, -10, 10, -8, 8, -5, 5, 0],
                              transition: { duration: 0.4 }
                            } : {}}
                            className="relative"
                          >
                            <TextField
                              {...rtlStyles}
                              fullWidth
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              label="تأیید رمز عبور"
                              placeholder="مثال: A@123456"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              error={!!(errors.confirmPassword && touched.confirmPassword)}
                            />
                            {formData.confirmPassword && (
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                tabIndex={-1}
                              >
                                <Icon path={showConfirmPassword ? mdiEyeOffOutline : mdiEyeOutline} size={0.9} />
                              </button>
                            )}
                          </motion.div>
                        </div>
                      </div>
                      {/* پیغام‌های خطای رمز عبور */}
                      <div className="min-h-[20px]">
                        {errors.password && touched.password && (
                          <motion.p
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-500 text-xs sm:text-sm mt-1"
                          >
                            {errors.password}
                          </motion.p>
                        )}
                        {errors.confirmPassword && touched.confirmPassword && !errors.password && (
                          <motion.p
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-500 text-xs sm:text-sm mt-1"
                          >
                            {errors.confirmPassword}
                          </motion.p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <motion.div
                        animate={shakeFields.password ? {
                          x: [0, -10, 10, -8, 8, -5, 5, 0],
                          transition: { duration: 0.4 }
                        } : {}}
                        className="relative"
                      >
                        <TextField
                          {...rtlStyles}
                          type={showPassword ? "text" : "password"}
                          name="password"
                          label="رمز عبور"
                          placeholder="مثال: A@123456"
                          className="w-full p-2 sm:p-3 md:p-4 border rounded pl-10"
                          value={formData.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={!!(errors.password && touched.password)}
                        />
                        {formData.password && (
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            tabIndex={-1}
                          >
                            <Icon path={showPassword ? mdiEyeOffOutline : mdiEyeOutline} size={0.9} />
                          </button>
                        )}
                      </motion.div>
                      {errors.password && touched.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-500 text-xs sm:text-sm md:text-base mt-1"
                        >
                          {errors.password}
                        </motion.p>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    color="success"
                    fullWidth
                    disabled={isSubmitting}
                    sx={{
                      py: 1.5,
                      fontSize: "1.3rem",
                      borderRadius: "10px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <CircularProgress size={24} color="inherit" />
                        {isLogin ? "در حال ورود..." : "در حال ثبت‌نام..."}
                      </>
                    ) : (
                      <>
                        {isLogin ? (
                          <LogIn size={22} />
                        ) : (
                          <UserPlus size={22} />
                        )}
                        {isLogin ? "ورود" : "ثبت‌نام"}
                      </>
                    )}
                  </Button>

                  {isLogin && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 my-2">
                        <div className="flex-1 h-px bg-gray-300" />
                        <span className="text-gray-400 text-sm">یا</span>
                        <div className="flex-1 h-px bg-gray-300" />
                      </div>
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-1 border border-gray-300 rounded-lg py-2.5 px-4 hover:bg-gray-50 transition-colors bg-white shadow-sm cursor-pointer"
                      >
                        <svg width="20" height="20" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        <span className="text-gray-700 font-medium text-sm">ورود با گوگل</span>
                      </button>
                    </div>
                  )}

                  {isLogin && (
                    <div className="text-center mt-3">
                      <button
                        type="button"
                        onClick={() => router.push("/auth/forgot-password")}
                        className="text-blue-600 hover:text-blue-800 transition-colors font-medium text-sm sm:text-base cursor-pointer"
                      >
                        آیا رمز عبور خود را فراموش کرده‌اید؟
                      </button>
                    </div>
                  )}
                </form>

                <p className="mt-2 sm:mt-3 md:mt-4 text-center text-xs sm:text-sm md:text-base">
                  {isLogin ? "حساب کاربری ندارید؟" : "قبلا ثبت‌نام کرده‌اید؟"}
                  {" "}
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-blue-600 cursor-pointer hover:text-blue-800 transition-colors font-medium"
                  >
                    {isLogin ? "ثبت‌نام" : "ورود"}
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="verification"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-center min-h-[300px] sm:min-h-[350px] md:min-h-[400px]"
              >
                <div className="w-full max-w-md sm:max-w-lg md:max-w-xl backdrop-blur-md bg-white/20 border border-white/30 p-4 sm:p-6 md:p-8 rounded-xl shadow-lg">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4 text-center">تأیید ایمیل</h2>
                  <form onSubmit={handleVerifyCode} className="space-y-2 sm:space-y-3 md:space-y-4" dir="rtl">
                    <p className="text-center text-gray-600 mb-2 sm:mb-4 text-xs sm:text-sm md:text-base">
                      کد تأیید به ایمیل {tempAuth?.email || formData.email} ارسال شده است. لطفاً آن را بررسی کنید.
                    </p>
                    <TextField
                      {...rtlStyles}
                      type="text"
                      label="کد تأیید"
                      className="w-full p-2 sm:p-3 md:p-4 border rounded"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                    />
                    {codeError && <p className="text-red-500 text-xs sm:text-sm md:text-base mt-1">{codeError}</p>}
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white p-2 sm:p-3 md:p-4 rounded hover:bg-blue-700 text-sm sm:text-base md:text-lg cursor-pointer transition-colors"
                      disabled={loading}
                    >
                      {loading ? 'در حال تأیید...' : 'تأیید'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}