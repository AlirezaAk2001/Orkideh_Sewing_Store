"use client";

import { useAuth } from "@/lib/context";
import axios from "axios";
import toast from "react-hot-toast";
import Avatar from "./Avatar";
import { BadgeCheck, Star, Store } from "lucide-react";
import moment from 'moment-jalaali';

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

// ستاره‌های فقط‌نمایشی (کوچک‌تر از StarRating فرم)
function Stars({ rating }) {
  return (
    <span className="pd-stars" role="img" aria-label={`امتیاز ${Number(rating).toLocaleString("fa-IR")} از ۵`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={n <= rating ? "on" : undefined} aria-hidden="true" />
      ))}
    </span>
  );
}

// کارت یک نظر + پاسخ فروشگاه (اگر ادمین پاسخ داده باشد)؛ ظرف <li> فهرست نظرهای ProductComments است. استایل: .pd-cm در product/product.css
// verifiedBuyer را سرور می‌گذارد (lib/comments.js): فقط برای نویسنده‌ای که سفارش تحویل‌شدهٔ همین محصول را دارد
export default function CommentsItem({ comment, onDelete, index = 0 }) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.is_admin;

  const handleDelete = async () => {
    if (!isAdmin) return;

    await toast.promise(
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
  const replyName = comment.User?.name || comment.User?.username || "کاربر";
  const replyAt = comment.adminReplyAt || comment.updatedAt;

  return (
    <li className="pd-cm pd-st" style={{ "--i": Math.min(index, 6) }}>
      <div className="pd-cm-side">
        {/* آواتار کاربر (حرف اول، طرح آماده یا عکسی که خودش در تنظیمات پنل انتخاب کرده)؛ اندازه از .pd-cm-side .av */}
        <Avatar value={comment.User?.avatar} name={comment.User?.name} />
        {comment.adminReply && <i className="pd-stem" aria-hidden="true" />}
      </div>
      <div className="pd-cm-main">
        <div className="pd-cm-head">
          <b>{userName}</b>
          {comment.verifiedBuyer && (
            <span className="pd-buyer">
              <BadgeCheck aria-hidden="true" />
              خریدار این محصول
            </span>
          )}
          <span className="pd-cm-date">{formatDateTime(comment.createdAt)}</span>
        </div>
        <Stars rating={comment.rating} />
        <p className="pd-cm-text">{comment.text}</p>
        {isAdmin && (
          <button type="button" onClick={handleDelete} className="pd-cm-del btn-flat">
            حذف
          </button>
        )}
      </div>

      {/* پاسخ فروشگاه: با نخ نقطه‌چین به نظر وصل است */}
      {comment.adminReply && (
        <>
          <div className="pd-thr" aria-hidden="true" />
          <div className="pd-reply">
            <div className="pd-reply-h">
              <span className="pd-reply-i" aria-hidden="true">
                <Store />
              </span>
              <b>پاسخ فروشگاه به {replyName}</b>
              {replyAt && <span className="pd-reply-date">{formatDateTime(replyAt)}</span>}
            </div>
            <p>{comment.adminReply}</p>
          </div>
        </>
      )}
    </li>
  );
}
