"use client";

import { useAuth } from "@/lib/context";
import axios from "axios";
import toast from "react-hot-toast";
import StarRating from "./StarRating";

export default function CommentsItem({ comment, onDelete }) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.is_admin;

  // تابع برای استخراج حرف اول نام کاربر
  const getInitial = (name) => {
    if (!name) return "ن";
    return name.charAt(0);
  };

  // تابع برای تولید رنگ بر اساس حرف اول
  const getAvatarColor = (name) => {
    if (!name) return "bg-gray-500";
    
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

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

  const userName = comment.User?.name || "کاربر ناشناس";
  const userInitial = getInitial(userName);
  const avatarColor = getAvatarColor(userName);

  return (
    <div className="border rounded-xl p-2 sm:p-3 md:p-4 mb-2 sm:mb-3" dir="rtl">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* آواتار کاربر */}
          <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 ${avatarColor} text-white rounded-full`}>
            <span className="text-sm sm:text-base font-bold">{userInitial}</span>
          </div>
          
          <div>
            <strong className="text-sm sm:text-base md:text-lg">{userName}</strong>
            <div className="mt-1 sm:mt-2">
              <StarRating rating={comment.rating} />
            </div>
          </div>
        </div>
        
        {isAdmin && (
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 text-xs sm:text-sm md:text-base"
          >
            حذف
          </button>
        )}
      </div>
      <p className="mt-1 sm:mt-2 whitespace-pre-line text-gray-700 text-sm sm:text-base md:text-lg">
        {comment.text}
      </p>
      <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-1 sm:mt-2">
        {new Date(comment.createdAt).toLocaleDateString("fa-IR")}
      </p>
    </div>
  );
}