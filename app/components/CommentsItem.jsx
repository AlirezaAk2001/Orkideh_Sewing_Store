"use client";

import { useAuth } from "@/lib/context";
import axios from "axios";
import toast from "react-hot-toast";
import StarRating from "./StarRating";
import Avatar from "./Avatar";
import moment from 'moment-jalaali';

export default function CommentsItem({ comment, onDelete }) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.is_admin;

  const handleDelete = async () => {
    if (!isAdmin) return;

    const result = await toast.promise(
      new Promise(async (resolve, reject) => {
        try {
          await axios.delete(`/api/admin/products/${comment.productId}/comments`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            data: { commentId: comment.id }, // ارسال commentId در بدنه
          });
          resolve("نظر با موفقیت حذف شد.");
        } catch (err) {
          console.error("Error deleting comment:", err);
          reject(err.response?.data?.error || "خطا در حذف نظر.");
        }
      }),
      {
        loading: "در حال حذف...",
        success: (message) => {
          if (onDelete) onDelete();
          return message;
        },
        error: (message) => message,
      }
    );
  };

  function formatDateTime(dateStr) {
    if (!dateStr) return "";
    const date = moment(dateStr);
    const formatted = date.format('HH:mm:ss - jYYYY/jMM/jDD');

    // تبدیل اعداد انگلیسی به فارسی
    return formatted.replace(/\d/g, (digit) => {
      return String.fromCharCode(parseInt(digit) + 1776);
    });
  }

  const userName = comment.User?.name || "کاربر ناشناس";

  return (
    <div className="border rounded-xl p-2 sm:p-3 md:p-4 mb-2 sm:mb-3" dir="rtl">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* آواتار کاربر (حرف اول، طرح آماده یا عکسی که خودش در تنظیمات پنل انتخاب کرده) */}
          <Avatar value={comment.User?.avatar} name={comment.User?.name} className="[--s:32px] sm:[--s:40px]" />

          <div>
            <strong className="text-sm sm:text-base md:text-lg">{userName}</strong>
            <div className="mt-1 sm:mt-2">
              <StarRating rating={comment.rating} />
            </div>
          </div>
        </div>
        <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-1 sm:mt-2">
          {formatDateTime(comment.createdAt)}
        </p>

        {isAdmin && (
          <button
            onClick={handleDelete}
            className="btn-flat text-red-500 hover:text-red-700 text-xs sm:text-sm md:text-base"
          >
            حذف
          </button>
        )}
      </div>
      <p className="mt-1 sm:mt-2 whitespace-pre-line text-gray-700 text-sm sm:text-base md:text-lg">
        {comment.text}
      </p>
    </div>
  );
}