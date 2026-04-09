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
import { mdiHeartOutline, mdiCloseCircleOutline, mdiDeleteCircleOutline } from '@mdi/js';
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { Trash2 } from "lucide-react";

export default function FavoritesPage() {
  const { favorites, removeFromFavorites } = useFavorites();

  const [dialog, setDialog] = useState({ open: false, id: null, name: "" });
  const [shake, setShake] = useState(false);
  const handleCloseDialog = () => setDialog({ open: false, id: null, name: "" });
  const handleBackdropClick = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleRemove = (id, name) => {
    setDialog({ open: true, id, name });
  };

  const confirmRemove = () => {
    removeFromFavorites(dialog.id);
    handleCloseDialog();
    toast.success("محصول موردنظر از علاقه‌مندی‌های شما حذف شد.", { icon: "🗑️" });
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

      {/* Dialog تأییدیه حذف */}
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
          <Icon
            path={mdiHeartOutline}
            size={1}
            color="#ffffff"
          />
          حذف از علاقه‌مندی‌ها
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "Vazirmatn, sans-serif", marginTop: "6px" }}>
            محصول «{dialog.name}» از علاقه‌مندی‌های شما حذف خواهد شد. آیا مطمئن هستید؟
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
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-gray-700 dark:text-gray-200 flex gap-1">
        <Icon path={mdiHeartOutline} size={1.3} />
        علاقه‌مندی‌ها
      </h1>

      {favorites.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          هیچ محصولی به علاقه‌مندی‌ها اضافه نشده است.
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

              {/* دکمه حذف با آیکون */}
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