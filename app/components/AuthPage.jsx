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

export default function AuthPage() {
  const { login, loading, error, updateUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({}); // برای tracking فیلدهای لمس شده
  const [usernameExists, setUsernameExists] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [tempAuth, setTempAuth] = useState(null);
  const [shakeFields, setShakeFields] = useState({}); // برای افکت لرزش
  const pathname = usePathname();
  const router = useRouter();
  const [backgroundImage, setBackgroundImage] = useState("/image/logo.png");

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
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  useEffect(() => {
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
        if (!value.trim()) error = "ایمیل نمی‌تواند خالی باشد";
        else if (!/\S+@\S+\.\S+/.test(value)) error = "ایمیل معتبر وارد کنید";
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
      if (!email.trim()) {
        newErrors.email = "ایمیل نمی‌تواند خالی باشد";
        fieldsToValidate.push("email");
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = "ایمیل معتبر وارد کنید";
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
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Login failed");

        login(data.user, data.token);
        toast.success("خوش آمدید!");
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
      updateUser({ verified: true });
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

  // کامپوننت فیلد ورودی با لرزش
  const AnimatedTextField = ({ field, label, type = "text", ...props }) => {
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
                      <AnimatedTextField field="firstName" label="نام" />
                      <AnimatedTextField field="lastName" label="نام خانوادگی" />
                    </>
                  )}
              
                  <AnimatedTextField field="email" label="ایمیل" type="email" />
                  
                  {!isLogin && (
                    <div>
                      <AnimatedTextField field="username" label="نام کاربری" />
                      {usernameExists && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-500 text-xs sm:text-sm md:text-base mt-1"
                        >
                          این نام کاربری قبلاً انتخاب شده است
                        </motion.p>
                      )}
                    </div>
                  )}
                  
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
                        className="w-full p-2 sm:p-3 md:p-4 border rounded pl-10"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.password && touched.password}
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
                  
                  {!isLogin && (
                    <div>
                      <motion.div
                        animate={shakeFields.confirmPassword ? {
                          x: [0, -10, 10, -8, 8, -5, 5, 0],
                          transition: { duration: 0.4 }
                        } : {}}
                        className="relative"
                      >
                        <TextField
                          {...rtlStyles}
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          label="تأیید رمز عبور"
                          className="w-full p-2 sm:p-3 md:p-4 border rounded pl-10"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.confirmPassword && touched.confirmPassword}
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
                      {errors.confirmPassword && touched.confirmPassword && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-500 text-xs sm:text-sm md:text-base mt-1"
                        >
                          {errors.confirmPassword}
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