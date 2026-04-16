"use client";

import { useFavorites } from "@/lib/context";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import Link from "next/link";
import Icon from '@mdi/react';
import { mdiHeartOutline, mdiCloseCircleOutline, mdiDeleteCircleOutline, mdiDeleteSweepOutline } from '@mdi/js';
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { Trash2 } from "lucide-react";

export default function FavoritesPage() {
  const { favorites, removeFromFavorites, clearFavorites } = useFavorites();

  const [dialog, setDialog] = useState({ open: false, id: null, name: "" });
  const [clearDialog, setClearDialog] = useState(false);
  const [shake, setShake] = useState(false);
  const [shakeClear, setShakeClear] = useState(false);

  const handleCloseDialog = () => setDialog({ open: false, id: null, name: "" });
  const handleBackdropClick = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleCloseClearDialog = () => setClearDialog(false);
  const handleClearBackdropClick = () => {
    setShakeClear(true);
    setTimeout(() => setShakeClear(false), 500);
  };

  const handleRemove = (id, name) => {
    setDialog({ open: true, id, name });
  };

  const confirmRemove = () => {
    removeFromFavorites(dialog.id);
    handleCloseDialog();
    toast.success("محصول موردنظر از علاقه‌مندی‌های شما حذف شد.", { icon: "🗑️" });
  };

  const confirmClearAll = () => {
    clearFavorites();
    handleCloseClearDialog();
    toast.success("تمام محصولات از علاقه‌مندی‌های شما حذف شدند.", { icon: "🗑️" });
  };

  return (
    <div
      className="max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 shadow rounded-lg mt-4 sm:mt-6"
      dir="rtl"
    >
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            fontFamily: "Vazirmatn, sans-serif",
            direction: "rtl",
            borderRadius: "10px",
            fontSize: "14px",
          },
        }}
      />

      {/* Dialog تأییدیه حذف تکی */}
      <Dialog 
        open={dialog.open} 
        onClose={handleBackdropClick} 
        dir="rtl"
        PaperProps={{
          sx: {
            animation: shake ? "dialogShake 0.5s ease" : "none",
            borderRadius: "12px"
          }
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: "Vazirmatn, sans-serif",
          display: "flex",
          alignItems: "center",
          gap: 1,
          backgroundColor: "#ef4444",
          color: "#ffffff",
          borderBottom: "3px solid",
          borderColor: "#b91c1c",
          px: 3,
          py: 1.5,
        }}>
          <Icon path={mdiHeartOutline} size={1} color="#ffffff" />
          حذف از علاقه‌مندی‌ها
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "Vazirmatn, sans-serif", marginTop: "6px" }}>
            محصول 
            <strong style={{ color: '#E53935', margin: '0 4px' }}>«{dialog.name}»</strong>
            از علاقه‌مندی‌های شما حذف خواهد شد. آیا مطمئن هستید؟
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ fontFamily: "Vazirmatn, sans-serif" }}>
            <Icon path={mdiCloseCircleOutline} size={1} />
            لغو
          </Button>
          <Button
            onClick={confirmRemove}
            color="error"
            variant="contained"
            sx={{ fontFamily: "Vazirmatn, sans-serif" }}
          >
            <Icon path={mdiDeleteCircleOutline} size={1} />
            بله، حذف کن
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog تأییدیه حذف همه */}
      <Dialog
        open={clearDialog}
        onClose={handleClearBackdropClick}
        dir="rtl"
        PaperProps={{
          sx: {
            animation: shakeClear ? "dialogShake 0.5s ease" : "none",
            borderRadius: "12px",
            minWidth: "320px",
          }
        }}
      >
        <DialogTitle sx={{
          fontFamily: "Vazirmatn, sans-serif",
          display: "flex",
          alignItems: "center",
          gap: 1,
          backgroundColor: "#ef4444",
          color: "#ffffff",
          borderBottom: "3px solid",
          borderColor: "#b91c1c",
          px: 3,
          py: 1.5,
        }}>
          <Icon path={mdiDeleteSweepOutline} size={1} color="#ffffff" />
          حذف تمام علاقه‌مندی‌ها
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "Vazirmatn, sans-serif", marginTop: "8px", marginBottom: "4px" }}>
            آیا مطمئن هستید که می‌خواهید تمام محصولات زیر را از علاقه‌مندی‌های خود حذف کنید؟
          </DialogContentText>
          <ul style={{
            marginTop: "10px",
            paddingRight: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}>
            {favorites.map((item, index) => (
              <li key={item.id} style={{
                fontFamily: "Vazirmatn, sans-serif",
                fontSize: "13px",
                color: "#374151",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: "bold",
                  flexShrink: 0,
                }}>
                  {(index + 1).toLocaleString("fa-IR")}
                </span>
                {item.name || item.Product?.name}
              </li>
            ))}
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClearDialog} sx={{ fontFamily: "Vazirmatn, sans-serif" }}>
            <Icon path={mdiCloseCircleOutline} size={1} />
            لغو
          </Button>
          <Button
            onClick={confirmClearAll}
            color="error"
            variant="contained"
            sx={{ fontFamily: "Vazirmatn, sans-serif" }}
          >
            <Icon path={mdiDeleteSweepOutline} size={1} />
            بله، همه را حذف کن
          </Button>
        </DialogActions>
      </Dialog>

      {/* هدر صفحه */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-200 flex gap-1">
          <Icon path={mdiHeartOutline} size={1.3} />
          علاقه‌مندی‌ها
        </h1>

        {/* دکمه حذف همه — فقط وقتی بیش از یک محصول وجود داشته باشد */}
        {favorites.length > 1 && (
          <button
            className="delete-btn flex items-center gap-1 text-red-500 hover:text-red-700 transition cursor-pointer"
            onClick={() => setClearDialog(true)}
          >
            <div className="trash-container">
              <Trash2 className="trash-body w-5 h-5" />
              <div className="trash-lid-wrapper">
                <Trash2 className="w-5 h-5" />
              </div>
            </div>
            <span className="text-sm font-medium">حذف همه</span>
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          هیچ محصولی به علاقه‌مندی‌های شما اضافه نشده است.
        </p>
      ) : (
        <ul className="space-y-2">
          {favorites.map((item) => (
            <li
              key={item.id}
              className="flex justify-between items-center p-4 border rounded-lg bg-white shadow-sm"
            >
              <div className="flex items-center gap-4">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={60}
                    height={60}
                    className="object-contain rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                    بدون تصویر
                  </div>
                )}
                <div>
                  <Link
                    href={`/products/${item.slug || item.Product?.slug}`}
                    className="font-semibold hover:text-pink-500 transition"
                  >
                    {item.name || item.Product?.name}
                  </Link>
                  <span className="text-gray-600 block mt-1">
                    {item.price
                      ? `${Number(item.price).toLocaleString("fa-IR")} تومان`
                      : "قیمت نامشخص"}
                  </span>
                </div>
              </div>

              {/* دکمه حذف تکی */}
              <button
                className="delete-btn flex items-center gap-1 text-red-500 hover:text-red-700 transition cursor-pointer"
                onClick={() => handleRemove(item.id, item.name)}
              >
                <div className="trash-container">
                  <Trash2 className="trash-body w-5 h-5" />
                  <div className="trash-lid-wrapper">
                    <Trash2 className="w-5 h-5" />
                  </div>
                </div>
                <span>حذف</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      
      <style jsx global>{`
        @keyframes dialogShake {
          0%   { transform: translateX(0); }
          20%  { transform: translateX(-8px); }
          40%  { transform: translateX(8px); }
          60%  { transform: translateX(-5px); }
          80%  { transform: translateX(5px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}