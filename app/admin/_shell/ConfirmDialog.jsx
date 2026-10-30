"use client";

import { Dialog } from "@mui/material";
import { TriangleAlert } from "lucide-react";

// پنجرهٔ تأیید کار برگشت‌ناپذیر (خروج، حذف): کارت سفید گرد با آیکون هشدار، عنوان، توضیح و دو دکمه. فوکوس اول روی «انصراف» است تا Enter ناخواسته
// کاری را انجام ندهد. خود Dialog از MUI می‌آید (تله‌ی فوکوس، Esc و کلیک روی پس‌زمینه را درست انجام می‌دهد)
export default function ConfirmDialog({ open, onClose, onConfirm, title, children, confirmLabel = "تأیید", cancelLabel = "انصراف", icon: Icon = TriangleAlert }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      dir="rtl"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      PaperProps={{ sx: { borderRadius: "20px", width: "100%", maxWidth: 400, m: 2, boxShadow: "0 30px 70px -20px rgb(0 0 0 / 0.35)" } }}
    >
      <div className="px-6 pb-6 pt-7 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/60">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 id="confirm-title" className="mt-4 text-lg font-extrabold text-gray-900">{title}</h2>
        <div id="confirm-desc" className="mt-2 text-sm leading-7 text-gray-600">{children}</div>
        <div className="mt-6 flex gap-2.5">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="h-11 flex-1 cursor-pointer rounded-xl bg-gray-100 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 flex-1 cursor-pointer rounded-xl bg-red-600 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
