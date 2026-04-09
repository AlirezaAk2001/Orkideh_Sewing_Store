"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context";
import Swal from "sweetalert2";
import { Save, Loader2, RotateCcwKey } from "lucide-react";
import Icon from '@mdi/react';
import { mdiAccountEditOutline, mdiAccountCogOutline, mdiEyeOutline, mdiEyeOffOutline } from '@mdi/js';
import { motion, AnimatePresence } from "framer-motion";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import axios from "axios";

const usernameRegex = /^[a-zA-Z0-9_]+$/;
const passwordRegex = /^(?=.*[0-9])(?=.*[@_]).{8,}$/;

const rtlStyles = {
  InputLabelProps: {
    sx: {
      transformOrigin: "right !important",
      left: "inherit !important",
      right: "1.75rem !important",
      color: "rgba(255,255,255,0.6)",
      "&.Mui-focused": {
        color: "#60a5fa",
      },
    },
  },
  sx: {
    "& legend": {
      textAlign: "right",
    },
    "& .MuiOutlinedInput-root": {
      color: "#fff",
      "& fieldset": {
        borderColor: "rgba(255,255,255,0.3)",
      },
      "&:hover fieldset": {
        borderColor: "rgba(255,255,255,0.6)",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#60a5fa",
      },
    },
    "& .MuiFormHelperText-root": {
      textAlign: "right",
      color: "#f87171",
    },
  },
};

export default function SettingsPage() {
  const router = useRouter();
  const { currentUser, updateUser } = useAuth();

  const [username, setUsername] = useState(currentUser?.username || "");
  const [usernameError, setUsernameError] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({
    new: "",
    confirm: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [shakeFields, setShakeFields] = useState({});

  const triggerShake = (fieldNames) => {
    const shakeEffects = {};
    fieldNames.forEach((field) => {
      shakeEffects[field] = true;
    });
    setShakeFields(shakeEffects);
    setTimeout(() => setShakeFields({}), 500);
  };

  useEffect(() => {
    if (!currentUser) {
      Swal.fire({
        icon: "warning",
        title: "هشدار",
        text: "برای دسترسی به تنظیمات، لطفاً وارد شوید!",
        confirmButtonText: "باشه",
      }).then(() => router.push("/login"));
    }
  }, [currentUser, router]);

  // بررسی وجود نام کاربری در دیتابیس
  const checkUsernameExists = async (value) => {
    if (!value.trim()) return;

    if (value === currentUser?.username) {
      setUsernameError("");
      setUsernameAvailable(false);
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    setUsernameAvailable(false);

    try {
      const res = await axios.get(`/api/user/check-username?username=${value}`);
      if (res.data.exists) {
        setUsernameError("نام کاربری مورد نظر قبلاً انتخاب شده است. لطفاً نام دیگری وارد کنید.");
        setUsernameAvailable(false);
        triggerShake(["username"]);
      } else {
        setUsernameError("");
        setUsernameAvailable(true);
      }
    } catch (err) {
      console.error("خطا در بررسی نام کاربری موجود:", err);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value) => {
    setUsername(value);
    setUsernameAvailable(false);

    if (!value.trim()) {
      setUsernameError("نام کاربری نمی‌تواند خالی باشد.");
      setIsCheckingUsername(false);
      return;
    }

    if (value === currentUser?.username) {
      setUsernameError("این نام کاربری فعلی شماست.");
      setIsCheckingUsername(false);
      return;
    }

    if (!usernameRegex.test(value)) {
      setUsernameError("نام کاربری فقط می‌تواند شامل حروف، اعداد و خط زیر (_) باشد.");
      setIsCheckingUsername(false);
      return;
    }

    setUsernameError("");
    setIsCheckingUsername(true);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (username.trim()) checkUsernameExists(username);
    }, 600);
    return () => clearTimeout(timeout);
  }, [username]);

  const handleSaveUsername = async () => {
    if (username === currentUser?.username) {
      setUsernameError("این نام کاربری فعلی شماست.");
      triggerShake(["username"]);
      return;
    }

    if (usernameError || !username.trim()) {
      triggerShake(["username"]);
      return;
    }
    setIsSavingUsername(true);

    try {
      await updateUser({ username });
      Swal.fire("موفق", "نام کاربری با موفقیت تغییر کرد.", "success");
    } catch (error) {
      if (error.message?.includes("نام کاربری قبلاً ثبت شده است") || error.code === "P2002") {
        setUsernameError("نام کاربری مورد نظر قبلاً انتخاب شده است. لطفاً نام دیگری وارد کنید.");
      } else {
        Swal.fire("خطا", error.message || "تغییر نام کاربری انجام نشد.", "error");
      }
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleNewPasswordChange = (value) => {
    setNewPassword(value);
    if (!passwordRegex.test(value)) {
      setPasswordErrors((prev) => ({
        ...prev,
        new: "رمز عبور باید حداقل ۸ کاراکتر و شامل عدد و یکی از @ یا _ باشد.",
      }));
    } else {
      setPasswordErrors((prev) => ({ ...prev, new: "" }));
    }

    if (confirmPassword && value !== confirmPassword) {
      setPasswordErrors((prev) => ({
        ...prev,
        confirm: "رمز عبور جدید با تکرار آن مطابقت ندارد.",
      }));
    } else {
      setPasswordErrors((prev) => ({ ...prev, confirm: "" }));
    }
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    if (newPassword && value !== newPassword) {
      setPasswordErrors((prev) => ({
        ...prev,
        confirm: "رمز عبور جدید با تکرار آن مطابقت ندارد.",
      }));
    } else {
      setPasswordErrors((prev) => ({ ...prev, confirm: "" }));
    }
  };

  const handleChangePassword = async () => {
    const emptyFields = [];
    if (!currentPassword) emptyFields.push("currentPassword");
    if (!newPassword) emptyFields.push("newPassword");
    if (!confirmPassword) emptyFields.push("confirmPassword");

    if (emptyFields.length > 0) {
      Swal.fire("خطا", "همه فیلدها الزامی هستند.", "error");
      triggerShake(emptyFields);
      return;
    }
    if (passwordErrors.new || passwordErrors.confirm) {
      const errorFields = [];
      if (passwordErrors.new) errorFields.push("newPassword");
      if (passwordErrors.confirm) errorFields.push("confirmPassword");
      triggerShake(errorFields);
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          userId: currentUser.id,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        Swal.fire("خطا", data.error || "تغییر رمز عبور انجام نشد.", "error");
        return;
      }

      Swal.fire("موفق", "رمز عبور با موفقیت تغییر کرد.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      Swal.fire("خطا", "خطا در ارتباط با سرور.", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!currentUser) return <div className="text-center py-10">در حال بارگذاری...</div>;

  return (
    <div
      className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 shadow rounded-lg mt-6 transition"
      dir="rtl"
    >
      <h1 className="text-2xl font-bold mb-6 text-gray-700 dark:text-gray-200 flex gap-1">
        <Icon path={mdiAccountCogOutline} size={1.3} />
        تنظیمات حساب کاربری
      </h1>

      {/* تغییر نام کاربری */}
      <div className="mb-8">
        <label className="block mb-3 font-medium text-gray-700 dark:text-gray-200">
          <Icon path={mdiAccountEditOutline} className="inline-block w-5 h-5 ml-1" />
          تغییر نام کاربری
        </label>
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <motion.div
              animate={shakeFields.username ? {
                x: [0, -10, 10, -8, 8, -5, 5, 0],
                transition: { duration: 0.4 },
              } : {}}
            >
              <TextField
                {...rtlStyles}
                fullWidth
                label="نام کاربری جدید"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                error={!!usernameError}
              />
            </motion.div>
            <div className="min-h-[22px] mt-1">
              <AnimatePresence mode="wait">
                {isCheckingUsername && username !== currentUser?.username && (
                  <motion.div
                    key="checking"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-gray-400 text-xs"
                  >
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>در حال بررسی نام کاربری...</span>
                  </motion.div>
                )}
                {!isCheckingUsername && usernameError && (
                  <motion.p
                    key="error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 text-xs"
                  >
                    {usernameError}
                  </motion.p>
                )}
                {!isCheckingUsername && usernameAvailable && !usernameError && (
                  <motion.p
                    key="available"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-green-400 text-xs"
                  >
                    نام کاربری انتخاب شده مورد قبول است
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
          <button
            onClick={handleSaveUsername}
            disabled={isSavingUsername || !!usernameError || username === currentUser?.username}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-1 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer min-w-[100px] h-[56px] justify-center mt-0"
          >
            {isSavingUsername ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>در حال ذخیره...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>ذخیره</span>
              </>
            )}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          نام کاربری فعلی: <span className="font-semibold">{currentUser?.username}</span>
        </p>
      </div>

      {/* تغییر رمز عبور */}
      <div>
        <label className="block mb-3 font-medium text-gray-700 dark:text-gray-200">
          <RotateCcwKey className="inline-block w-5 h-5 ml-1" />
          تغییر رمز عبور
        </label>
        <div className="flex flex-col gap-4">

          {/* رمز عبور فعلی */}
          <motion.div
            animate={shakeFields.currentPassword ? {
              x: [0, -10, 10, -8, 8, -5, 5, 0],
              transition: { duration: 0.4 },
            } : {}}
          >
          <TextField
            {...rtlStyles}
            fullWidth
            label="رمز عبور فعلی"
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            InputProps={{
              endAdornment: currentPassword ? (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    edge="end"
                    tabIndex={-1}
                  >
                    <Icon
                      path={showCurrentPassword ? mdiEyeOffOutline : mdiEyeOutline}
                      size={0.9}
                    />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          </motion.div>

          {/* رمز عبور جدید */}
          <motion.div
            animate={shakeFields.newPassword ? {
              x: [0, -10, 10, -8, 8, -5, 5, 0],
              transition: { duration: 0.4 },
            } : {}}
          >
          <TextField
              {...rtlStyles}
              fullWidth
              label="رمز عبور جدید"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => handleNewPasswordChange(e.target.value)}
              error={!!passwordErrors.new}
              helperText={passwordErrors.new || undefined}
              InputProps={{
                endAdornment: newPassword ? (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      edge="end"
                      tabIndex={-1}
                    >
                      <Icon
                        path={showNewPassword ? mdiEyeOffOutline : mdiEyeOutline}
                        size={0.9}
                      />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </motion.div>

          {/* تکرار رمز عبور جدید */}
          <motion.div
            animate={shakeFields.confirmPassword ? {
              x: [0, -10, 10, -8, 8, -5, 5, 0],
              transition: { duration: 0.4 },
            } : {}}
          >
          <TextField
              {...rtlStyles}
              fullWidth
              label="تکرار رمز عبور جدید"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              error={!!passwordErrors.confirm}
              helperText={passwordErrors.confirm || undefined}
              InputProps={{
                endAdornment: confirmPassword ? (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      edge="end"
                      tabIndex={-1}
                    >
                      <Icon
                        path={showConfirmPassword ? mdiEyeOffOutline : mdiEyeOutline}
                        size={0.9}
                      />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </motion.div>

          <button
            onClick={handleChangePassword}
            disabled={isChangingPassword}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-1 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer h-[44px]"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>در حال تغییر رمز عبور...</span>
              </>
            ) : (
              <>
                <RotateCcwKey className="w-5 h-5" />
                <span>تغییر رمز عبور</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}