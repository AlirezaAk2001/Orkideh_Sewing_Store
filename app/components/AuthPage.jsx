"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, LogIn, MailCheck, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/context";
import { rememberRedirect, takeRedirect } from "../../lib/redirect";
import AuthShell from "./auth/AuthShell";
import { AuthCard, AuthTitle, Field, PasswordInput, SubmitButton, TextInput } from "./auth/AuthUI";

const allowedAdmins = ["poshtibani.orkideh@gmail.com"];

// بدون پرانتز و نماد در انتها: در متن راست‌به‌چپ جابه‌جا نشان داده می‌شدند
const PASSWORD_HINT = "حداقل ۸ کاراکتر شامل حرف انگلیسی، عدد و یک نماد مانند @";

export default function AuthPage() {
  const { login, loading } = useAuth();
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
  const [verificationCode, setVerificationCode] = useState("");
  const [tempAuth, setTempAuth] = useState(null);
  const [shakeFields, setShakeFields] = useState({}); // برای افکت لرزش
  const router = useRouter();

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = "http://localhost:3000/auth/google/callback";
    const scope = "openid email profile";
    const responseType = "code";

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}`;

    window.location.href = url;
  };

  // مقصد بعد از ورود (?redirect=) را نگه می‌داریم تا ورود با گوگل و مسیر ثبت‌نام ← تأیید ایمیل هم آن را از دست ندهند
  useEffect(() => {
    rememberRedirect();
  }, []);

  const persianRegex = /^[؀-ۿ\s]+$/;
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

  // زبانهٔ ورود/ثبت‌نام؛ پیام‌های خطای حالت قبلی را با خود نمی‌برد
  const switchMode = (toLogin) => {
    if (toLogin === isLogin) return;
    setIsLogin(toLogin);
    setErrors({});
    setTouched({});
    setShakeFields({});
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
    // پیام فقط برای فیلد «لمس‌شده» نشان داده می‌شود؛ با زدن دکمه همهٔ فیلدهای ناقص لمس‌شده حساب می‌شوند تا پیامشان دیده شود
    setTouched((prev) => ({ ...prev, ...Object.fromEntries(Object.keys(newErrors).map((k) => [k, true])) }));

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
        if (!resp.ok) {
          // رمز درست است ولی ایمیل تأیید نشده: به صفحهٔ تأیید می‌رویم و یک کد تازه فرستاده می‌شود
          if (data.code === "EMAIL_NOT_VERIFIED") {
            localStorage.setItem("signupEmail", data.email || formData.email);
            toast.error(data.error);
            setTimeout(() => router.push("/verify?resend=1"), 1500);
            return;
          }
          throw new Error(data.error || "Login failed");
        }

        login(data.user, data.token);
        const userName = data.user.name || data.user.firstName + " " + data.user.lastName || "کاربر";
        const target = takeRedirect();
        if (target) {
          // پیام خوش‌آمد را صفحهٔ پروفایل یا ادمین نشان می‌دهد؛ برای مقصد دیگر همین‌جا نشان می‌دهیم
          toast.success(`خوش آمدید ${userName} عزیز 🎉`, { position: "top-center" });
          router.push(target);
        } else {
          sessionStorage.setItem("welcomeMessage", userName);
          router.push(data.user.role === "admin" ? "/admin" : "/profile");
        }
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

  const shown = (name) => !!(errors[name] && touched[name]);
  let nameError = shown("firstName") ? errors.firstName : shown("lastName") ? errors.lastName : "";
  if (nameError && !formData.fullName.trim()) nameError = "نام و نام خانوادگی نمی‌تواند خالی باشد";
  const passwordError = shown("password") ? errors.password : shown("confirmPassword") ? errors.confirmPassword : "";

  let usernameHint = null;
  if (isCheckingUsername && formData.username.length >= 3) {
    usernameHint = (
      <span className="auth-message inline-flex items-center gap-1.5">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        در حال بررسی نام کاربری...
      </span>
    );
  } else if (!isCheckingUsername && usernameExists) {
    usernameHint = <span className="auth-message text-red-600">نام کاربری انتخاب شده تکراری است</span>;
  } else if (!isCheckingUsername && usernameAvailable && formData.username.length >= 3) {
    usernameHint = (
      <span className="auth-message inline-flex items-center gap-1.5 text-emerald-600">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        نام کاربری انتخاب شده مورد قبول است
      </span>
    );
  }

  return (
    <AuthShell
      heading={isLogin ? "به فروشگاه ارکیده خوش آمدید" : "عضو خانوادهٔ ارکیده شوید"}
      lead={
        isLogin
          ? "برای ثبت سفارش، پیگیری خرید و ذخیرهٔ علاقه‌مندی‌ها وارد حساب خود شوید."
          : "با ساخت حساب، سفارش‌ها، آدرس‌ها و علاقه‌مندی‌هایتان همیشه در دسترس است."
      }
    >
      <AuthCard wide={!isLogin}>
        <AnimatePresence mode="wait" initial={false}>
          {!isVerifying ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
            >
              <AuthTitle
                title={isLogin ? "ورود به حساب کاربری" : "ساخت حساب کاربری"}
                text={isLogin ? "برای ادامه، اطلاعات حساب خود را وارد کنید." : "چند ثانیه وقت بگذارید و عضو ارکیده شوید."}
              />

              {/* زبانهٔ ورود/ثبت‌نام: قرص سفید زیر گزینهٔ فعال می‌لغزد */}
              <div className="relative mb-5 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
                <span
                  aria-hidden="true"
                  data-mode={isLogin ? "login" : "register"}
                  className="auth-tab-pill absolute inset-y-1 start-1 w-[calc(50%-0.25rem)] rounded-lg bg-white shadow-sm ring-1 ring-black/5"
                />
                {[
                  { toLogin: true, label: "ورود" },
                  { toLogin: false, label: "ثبت‌نام" },
                ].map(({ toLogin, label }) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={isLogin === toLogin}
                    onClick={() => switchMode(toLogin)}
                    className={`relative z-10 h-10 cursor-pointer rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${isLogin === toLogin ? "text-brand-700" : "text-gray-500 hover:text-gray-800"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <form key={isLogin ? "login" : "register"} onSubmit={handleSubmit} noValidate className="space-y-3.5">
                {!isLogin && (
                  <div className="grid items-start gap-x-4 gap-y-3.5 sm:grid-cols-2">
                    <Field index={0} id="auth-fullName" label="نام و نام خانوادگی" error={nameError} shake={shakeFields.firstName || shakeFields.lastName}>
                      <TextInput
                        id="auth-fullName"
                        type="text"
                        name="fullName"
                        autoComplete="name"
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
                        invalid={!!nameError}
                      />
                    </Field>

                    <Field
                      index={1}
                      id="auth-username"
                      label="نام کاربری"
                      error={shown("username") ? errors.username : ""}
                      hint={usernameHint}
                      shake={shakeFields.username}
                    >
                      <TextInput
                        id="auth-username"
                        ltr
                        type="text"
                        name="username"
                        autoComplete="username"
                        placeholder="aaa_123"
                        value={formData.username}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        invalid={shown("username") || usernameExists}
                      />
                    </Field>
                  </div>
                )}

                <Field
                  index={isLogin ? 0 : 2}
                  id="auth-email"
                  label={isLogin ? "ایمیل یا نام کاربری" : "ایمیل"}
                  error={shown("email") ? errors.email : ""}
                  shake={shakeFields.email}
                >
                  <TextInput
                    id="auth-email"
                    ltr
                    type={isLogin ? "text" : "email"}
                    name="email"
                    autoComplete={isLogin ? "username" : "email"}
                    placeholder={isLogin ? "example@gmail.com یا aaa_123" : "example@gmail.com"}
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    invalid={shown("email")}
                  />
                </Field>

                {isLogin ? (
                  <div>
                    <Field
                      index={1}
                      id="auth-password"
                      label="رمز عبور"
                      error={shown("password") ? errors.password : ""}
                      shake={shakeFields.password}
                    >
                      <PasswordInput
                        id="auth-password"
                        name="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        invalid={shown("password")}
                      />
                    </Field>
                    <div className="mt-1.5">
                      <Link
                        href="/auth/forgot-password"
                        className="inline-block rounded-md py-1 text-sm font-medium text-brand-700 transition hover:text-brand-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      >
                        آیا رمز عبور خود را فراموش کرده‌اید؟
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="grid items-start gap-x-4 gap-y-3.5 sm:grid-cols-2">
                      <Field index={3} id="auth-password" label="رمز عبور" shake={shakeFields.password}>
                        <PasswordInput
                          id="auth-password"
                          name="password"
                          autoComplete="new-password"
                          placeholder="A@123456"
                          meter
                          value={formData.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          invalid={shown("password")}
                        />
                      </Field>
                      <Field index={4} id="auth-confirmPassword" label="تأیید رمز عبور" shake={shakeFields.confirmPassword}>
                        <PasswordInput
                          id="auth-confirmPassword"
                          name="confirmPassword"
                          autoComplete="new-password"
                          placeholder="A@123456"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          invalid={shown("confirmPassword")}
                        />
                      </Field>
                    </div>
                    {passwordError ? (
                      <p role="alert" className="auth-message mt-1.5 text-xs leading-5 text-red-600">
                        {passwordError}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs leading-5 text-gray-500">{PASSWORD_HINT}</p>
                    )}
                  </div>
                )}

                <SubmitButton
                  loading={isSubmitting}
                  loadingText={isLogin ? "در حال ورود..." : "در حال ثبت‌نام..."}
                  icon={isLogin ? LogIn : UserPlus}
                >
                  {isLogin ? "ورود" : "ثبت‌نام"}
                </SubmitButton>

                {isLogin && (
                  <>
                    <div className="flex items-center gap-3" aria-hidden="true">
                      <div className="h-px flex-1 bg-gray-200" />
                      <span className="text-xs text-gray-400">یا</span>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-200"
                    >
                      <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                      ورود با گوگل
                    </button>
                  </>
                )}
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="verification"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.3 }}
            >
              <AuthTitle
                icon={MailCheck}
                title="تأیید ایمیل"
                text={`کد تأیید به ایمیل ${tempAuth?.email || formData.email} ارسال شده است. لطفاً آن را بررسی کنید.`}
              />
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <Field id="auth-code" label="کد تأیید">
                  <TextInput
                    id="auth-code"
                    ltr
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="------"
                    className="text-center text-xl tracking-[0.4em]"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                  />
                </Field>
                <SubmitButton loading={loading} loadingText="در حال تأیید...">
                  تأیید
                </SubmitButton>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </AuthCard>
    </AuthShell>
  );
}
