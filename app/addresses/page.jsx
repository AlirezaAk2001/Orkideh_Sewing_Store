"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/context";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  Save,
  XCircle,
  MapPinHouse,
  Milestone
} from "lucide-react";
import { CircularProgress, TextField } from "@mui/material";
import Icon from '@mdi/react';
import { mdiHomePlusOutline } from '@mdi/js';
import { mdiHomeOutline } from '@mdi/js';
import { mdiHomeEditOutline } from '@mdi/js';

const animationStyles = `
  @keyframes spin360FadeOut {
    0%   { transform: rotate(0deg) scale(1); opacity: 1; }
    70%  { transform: rotate(360deg) scale(0.8); opacity: 0.4; }
    100% { transform: rotate(360deg) scale(0); opacity: 0; }
  }
  @keyframes bubbleIn {
    0%   { transform: scale(0); opacity: 0; border-radius: 50%; }
    60%  { transform: scale(1.06); opacity: 1; border-radius: 10px; }
    80%  { transform: scale(0.97); border-radius: 8px; }
    100% { transform: scale(1); opacity: 1; border-radius: 8px; }
  }
  @keyframes bubbleOut {
    0%   { transform: scale(1); opacity: 1; border-radius: 8px; }
    100% { transform: scale(0); opacity: 0; border-radius: 50%; }
  }
  .spin-fade-out {
    animation: spin360FadeOut 0.6s ease-in-out forwards;
  }
  .bubble-in {
    animation: bubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  .bubble-out {
    animation: bubbleOut 0.35s ease-in forwards;
  }
`;

export default function AddressesPage() {
  const { currentUser, addresses, addAddress, updateAddress, loading } = useAuth();
  const router = useRouter();

  const [newAddress, setNewAddress] = useState("");
  const [newPostalCode, setNewPostalCode] = useState("");
  const [editAddressId, setEditAddressId] = useState(null);
  const [editAddress, setEditAddress] = useState("");
  const [editPostalCode, setEditPostalCode] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // ✨ انیمیشن
  const [rotatingId, setRotatingId] = useState(null);   // آیدی باکسی که داره می‌چرخه
  const [showEditForm, setShowEditForm] = useState(false); // آیا فرم ویرایش نمایش داده بشه

  // ✨ خطاهای اعتبارسنجی
  const [postalCodeError, setPostalCodeError] = useState("");
  const [editPostalCodeError, setEditPostalCodeError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [editAddressError, setEditAddressError] = useState("");

  // ✨ لرزش فیلدهای خطادار
  const [shakeFields, setShakeFields] = useState({});

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

  const triggerShake = (fieldNames) => {
    const effects = {};
    fieldNames.forEach(f => { effects[f] = true; });
    setShakeFields(effects);
    setTimeout(() => setShakeFields({}), 500);
  };

  if (loading) return <p className="text-center mt-6">در حال بارگذاری...</p>;

  if (!currentUser) {
    router.push("/auth");
    return null;
  }

  const handlePostalChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setNewPostalCode(value);
    if (value.length > 0 && value.length < 10) {
      setPostalCodeError("کد پستی باید ۱۰ رقم باشد.");
    } else {
      setPostalCodeError("");
    }
  };

  const handleEditPostalChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setEditPostalCode(value);
    if (value.length > 0 && value.length < 10) {
      setEditPostalCodeError("کد پستی باید ۱۰ رقم باشد.");
    } else {
      setEditPostalCodeError("");
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    const fieldsToShake = [];
    if (!newAddress.trim()) {
      setAddressError("آدرس نمی‌تواند خالی باشد.");
      fieldsToShake.push("newAddress");
    }
    if (newPostalCode.length !== 10) {
      setPostalCodeError("کد پستی باید دقیقاً ۱۰ رقم باشد.");
      fieldsToShake.push("newPostalCode");
    }
    if (fieldsToShake.length > 0) {
      triggerShake(fieldsToShake);
      return;
    }

    setFormLoading(true);
    try {
      await addAddress({ address: newAddress, postalCode: newPostalCode });
      toast.success("آدرس با موفقیت اضافه شد", {
        duration: 2000,
        position: "top-center",
      });
      setNewAddress("");
      setNewPostalCode("");
      setPostalCodeError("");
      setAddressError("");
    } catch (err) {
      toast.error(err.message || "خطا در افزودن آدرس", {
        duration: 2000,
        position: "top-center",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditAddress = async (e) => {
    e.preventDefault();
    const fieldsToShake = [];
    if (!editAddress.trim()) {
      setEditAddressError("آدرس نمی‌تواند خالی باشد.");
      fieldsToShake.push("editAddress");
    }
    if (editPostalCode.length !== 10) {
      setEditPostalCodeError("کد پستی باید دقیقاً ۱۰ رقم باشد.");
      fieldsToShake.push("editPostalCode");
    }
    if (fieldsToShake.length > 0) {
      triggerShake(fieldsToShake);
      return;
    }

    setFormLoading(true);
    try {
      await updateAddress({ id: editAddressId, address: editAddress, postalCode: editPostalCode });
      toast.success("آدرس با موفقیت به‌روزرسانی شد", {
        duration: 2000,
        position: "top-center",
      });
      // بستن فرم با انیمیشن
      setShowEditForm(false);
      setTimeout(() => {
        setEditAddressId(null);
        setEditAddress("");
        setEditPostalCode("");
        setEditPostalCodeError("");
        setEditAddressError("");
      }, 400);
    } catch (err) {
      toast.error(err.message || "خطا در به‌روزرسانی آدرس", {
        duration: 2000,
        position: "top-center",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // ✨ کلیک روی دکمه ویرایش:
  // ۱. باکس آدرس می‌چرخه و محو می‌شه
  // ۲. فرم ویرایش با حالت حبابی جایگزین می‌شه
  const startEditing = (address) => {
    if (rotatingId) return; // جلوگیری از کلیک مجدد حین انیمیشن
    setShowEditForm(false);
    setEditAddressId(null);
    setRotatingId(address.id);

    setTimeout(() => {
      setRotatingId(null);
      setEditAddressId(address.id);
      setEditAddress(address.address);
      setEditPostalCode(address.postalCode);
      setEditPostalCodeError("");
      // کمی تأخیر تا DOM رندر بشه، بعد کلاس bubble-in اعمال بشه
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShowEditForm(true));
      });
    }, 650);
  };

  const cancelEditing = () => {
    setShowEditForm(false);
    setTimeout(() => {
      setEditAddressId(null);
      setEditAddress("");
      setEditPostalCode("");
      setEditPostalCodeError("");
      setEditAddressError("");
    }, 400);
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

      <div
        className="max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 shadow rounded-lg mt-4 sm:mt-6"
        dir="rtl"
      >
        <style>{animationStyles}</style>

        <h1 className="text-xl sm:text-2xl font-bold mb-4 text-gray-700 dark:text-gray-200 flex gap-1">
          <MapPinHouse className="w-7 h-7" />
          آدرس‌های من
        </h1>

        {/* فرم افزودن آدرس */}
        <form onSubmit={handleAddAddress} noValidate className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-lg font-semibold mb-4 flex gap-1">
            <Icon path={mdiHomePlusOutline} size={1.2} />
            افزودن آدرس جدید
          </h2>

          {/* فیلد آدرس با استفاده از TextField */}
          <label className="block mb-2 font-semibold flex gap-1">
            <Icon path={mdiHomeOutline} size={1} />
            آدرس:
          </label>
          <motion.div
            animate={shakeFields.newAddress ? { x: [0, -10, 10, -8, 8, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="mb-4"
          >
            <TextField
              {...rtlStyles}
              fullWidth
              multiline
              minRows={3}
              label="آدرس کامل"
              placeholder="مثال: تهران، خ مولوی، پ ۱۰"
              value={newAddress}
              onChange={(e) => {
                setNewAddress(e.target.value);
                if (e.target.value.trim()) setAddressError("");
              }}
              error={!!addressError}
              className="bg-white rounded-lg"
            />
          </motion.div>
          {addressError && (
            <p className="text-red-500 text-sm mb-4 -mt-2">{addressError}</p>
          )}

          {/* فیلد کد پستی با استفاده از TextField */}
          <label className="block mb-2 font-semibold flex gap-1">
            <Milestone className="w-5 h-5" />
            کد پستی:
          </label>
          <motion.div
            animate={shakeFields.newPostalCode ? { x: [0, -10, 10, -8, 8, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="mb-4"
          >
            <TextField
              {...rtlStyles}
              fullWidth
              label="کد پستی"
              placeholder="مثال: 1234567890"
              value={newPostalCode}
              onChange={handlePostalChange}
              error={!!postalCodeError}
              inputProps={{ maxLength: 10 }}
              className="bg-white rounded-lg"
            />
          </motion.div>
          {postalCodeError && (
            <p className="text-red-500 text-sm mb-4 -mt-2">{postalCodeError}</p>
          )}

          <button
            type="submit"
            disabled={formLoading}
            className="flex items-center justify-center gap-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition disabled:opacity-50 cursor-pointer mt-2"
          >
            {formLoading ? (
              <>
                <CircularProgress size={20} color="inherit" />
                <span>در حال افزودن آدرس...</span>
              </>
            ) : (
              <>
                <Icon path={mdiHomePlusOutline} className="w-6 h-6" />
                <span>افزودن آدرس</span>
              </>
            )}
          </button>
        </form>

        {/* فرم ویرایش آدرس — با انیمیشن حبابی */}
        {editAddressId && (
          <form
            onSubmit={handleEditAddress}
            noValidate
            className={`mb-6 p-4 border rounded-lg bg-gray-50 ${showEditForm ? "bubble-in" : "bubble-out"}`}
          >
            <h2 className="text-lg font-semibold mb-4 flex gap-1">
              <Icon path={mdiHomeEditOutline} size={1.2} />
              ویرایش آدرس
            </h2>

            {/* فیلد آدرس با استفاده از TextField */}
            <motion.div
              animate={shakeFields.editAddress ? { x: [0, -10, 10, -8, 8, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="mb-4"
            >
              <TextField
                {...rtlStyles}
                fullWidth
                multiline
                minRows={3}
                label="آدرس کامل"
                placeholder="آدرس کامل را وارد کنید"
                value={editAddress}
                onChange={(e) => {
                  setEditAddress(e.target.value);
                  if (e.target.value.trim()) setEditAddressError("");
                }}
                error={!!editAddressError}
                className="bg-white rounded-lg"
              />
            </motion.div>
            {editAddressError && (
              <p className="text-red-500 text-sm mb-4 -mt-2">{editAddressError}</p>
            )}

            {/* فیلد کد پستی با استفاده از TextField */}
            <motion.div
              animate={shakeFields.editPostalCode ? { x: [0, -10, 10, -8, 8, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="mb-4"
            >
              <TextField
                {...rtlStyles}
                fullWidth
                label="کد پستی"
                placeholder="مثال: 1234567890"
                value={editPostalCode}
                onChange={handleEditPostalChange}
                error={!!editPostalCodeError}
                inputProps={{ maxLength: 10 }}
                className="bg-white rounded-lg"
              />
            </motion.div>
            {editPostalCodeError && (
              <p className="text-red-500 text-sm mb-4 -mt-2">{editPostalCodeError}</p>
            )}

            {/* دکمه‌های فرم */}
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={formLoading}
                className="flex items-center justify-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 cursor-pointer"
              >
                {formLoading ? (
                  <>
                    <CircularProgress size={20} color="inherit" />
                    <span>در حال ذخیره...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>ذخیره تغییرات</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="flex items-center gap-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
                لغو
              </button>
            </div>
          </form>
        )}

        {/* لیست آدرس‌ها */}
        {addresses.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">هیچ آدرسی ثبت نشده است.</p>
        ) : (
          <ul className="space-y-2">
            {addresses.map((addr) => (
              <li
                key={addr.id.toLocaleString('fa-IR')}
                className={`p-4 border rounded-lg bg-white shadow-sm flex justify-between items-center ${rotatingId === addr.id ? "spin-fade-out" : ""
                  }`}
              >
                <div>
                  <p className="font-semibold text-gray-600 flex gap-1">
                    <Icon path={mdiHomeOutline} size={1} />
                    آدرس: {addr.address.toLocaleString('fa-IR')}
                  </p>
                  <p className="font-semibold text-gray-600 flex gap-1">
                    <Milestone className="w-5 h-5" />
                    کد پستی: {addr.postalCode.toLocaleString('fa-IR')}
                  </p>
                </div>
                <button
                  onClick={() => startEditing(addr)}
                  disabled={!!rotatingId}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition cursor-pointer disabled:opacity-50"
                >
                  <Icon path={mdiHomeEditOutline} className="w-7 h-7" />
                  ویرایش
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}