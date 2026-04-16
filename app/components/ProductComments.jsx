"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import CommentsForm from "./CommentsForm";
import CommentsItem from "./CommentsItem";
import { useAuth } from "@/lib/context";
import { MessageSquare } from "lucide-react";
import Icon from "@mdi/react";
import { mdiCommentAccountOutline, mdiMessageReplyTextOutline } from "@mdi/js";
import Image from "next/image";
import moment from 'moment-jalaali';

// نمایش ستاره‌ها
function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-amber-400 text-sm" : "text-gray-300 text-sm"}>
          ★
        </span>
      ))}
    </div>
  );
}

// فرمت تاریخ و زمان فارسی
function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const date = moment(dateStr);
  const formatted = date.format('HH:mm:ss - jYYYY/jMM/jDD');

  // تبدیل اعداد انگلیسی به فارسی
  return formatted.replace(/\d/g, (digit) => {
    return String.fromCharCode(parseInt(digit) + 1776);
  });
}

// کارت کامنت + پاسخ ادمین
function CommentWithReply({ comment, onDelete }) {
  const userName = comment.User?.name || comment.User?.username || "کاربر";

  return (
    <div className="space-y-2">
      {/* کامنت اصلی */}
      <CommentsItem comment={comment} onDelete={onDelete} />

      {/* پاسخ ادمین */}
      {comment.adminReply && (
        <div
          className="mr-6 rounded-xl p-4 border border-indigo-100 bg-gradient-to-l from-indigo-50 to-blue-50"
          dir="rtl"
        >
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-200 flex items-center justify-center">
                <Icon path={mdiMessageReplyTextOutline} size={0.65} className="text-indigo-700" />
              </div>
              <span className="text-sm font-semibold text-indigo-700">
                پاسخ فروشگاه به {userName}
              </span>
            </div>
            {comment.updatedAt && (
              <span className="text-xs text-indigo-400">
                {formatDateTime(comment.updatedAt)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{comment.adminReply}</p>
        </div>
      )}
    </div>
  );
}

export default function ProductComments({ productId }) {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const { data } = await axios.get(`/api/admin/products/${productId}/comments`);
      const approvedComments = (data || []).filter((comment) => comment.approved);
      setComments(approvedComments);
    } catch (err) {
      console.error("خطا در دریافت نظرات:", err);
      toast.error(err.response?.data?.error || "خطا در دریافت نظرات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) fetchComments();
  }, [productId]);

  return (
    <div className="space-y-2 sm:space-y-4 mt-2 sm:mt-4 rounded-xl" dir="rtl">
      <h2 className="text-lg sm:text-xl font-bold flex gap-1 items-center">
        <Icon path={mdiCommentAccountOutline} size={1.2} />
        نظرات کاربران
      </h2>

      {/* فرم کامنت */}
      <CommentsForm productId={productId} onSubmit={fetchComments} />

      {/* لیست کامنت‌ها */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[20vh]">
          <Image
            src="/image/logo.png"
            alt="در حال بارگذاری نظرات..."
            width={80}
            height={80}
            className="animate-spin object-contain"
            priority
          />
          <p className="mt-4 text-gray-500 text-sm font-medium animate-pulse">
            در حال بارگذاری نظرات...
          </p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm sm:text-base">هنوز هیچ نظری برای این محصول ثبت نشده است.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment, index) => (
            <CommentWithReply
              key={comment.id + "_" + index}
              comment={comment}
              onDelete={fetchComments}
            />
          ))}
        </div>
      )}
    </div>
  );
}