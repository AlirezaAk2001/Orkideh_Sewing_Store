"use client";

import PageLoader from "./PageLoader";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import StarRating from "./StarRating";
import { useAuth } from "@/lib/context";
import { Lock, MessageCircle, MessageSquareHeart } from "lucide-react";
import Icon from '@mdi/react';
import { mdiCommentEditOutline } from '@mdi/js';
import { TextField } from "@mui/material";

export default function CommentsForm({ productId, onSubmit }) {
  const { currentUser } = useAuth();
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [canComment, setCanComment] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);

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

  // بررسی آیا کاربر محصول را خریداری کرده و تحویل گرفته است
  useEffect(() => {
    const checkPurchasePermission = async () => {
      if (!currentUser) {
        setCanComment(false);
        setCheckingPermission(false);
        return;
      }

      try {
        const response = await axios.get(
          `/api/admin/products/${productId}/check-purchase`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setCanComment(response.data.canComment);
      } catch (err) {
        console.error("خطا در بررسی مجوز کامنت:", err);
        setCanComment(false);
      } finally {
        setCheckingPermission(false);
      }
    };

    if (productId && currentUser) {
      checkPurchasePermission();
    } else {
      setCheckingPermission(false);
    }
  }, [productId, currentUser]);

  const handleEmojiClick = (emojiObject) => {
    setText((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("برای ثبت نظر، لطفاً ابتدا وارد حساب کاربری خود شوید");
      return;
    }

    if (!canComment) {
      toast.error("شما فقط می‌توانید برای محصولاتی که خریداری کرده‌اید و تحویل گرفته‌اید نظر دهید");
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      toast.error("لطفاً یک امتیاز بین 1 تا 5 انتخاب کنید");
      return;
    }

    if (!text.trim()) {
      toast.error("لطفاً متن نظر خود را وارد کنید");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `/api/admin/products/${productId}/comments`,
        { text, rating },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast.success(response.data.message || "نظر شما ثبت شد");
      setText("");
      setRating(0);
      if (onSubmit) onSubmit();
    } catch (err) {
      console.error("خطا در ثبت نظر:", err);
      toast.error(err.response?.data?.error || "خطا در ثبت نظر");
    } finally {
      setLoading(false);
    }
  };

  if (checkingPermission) {
    return (
      <PageLoader size="md" className="min-h-[20vh]" label="در حال بررسی مجوز..." />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pd-cm-form" dir="rtl">
      <h3 className="pd-cm-h">
        <span className="pd-sec-i" aria-hidden="true">
          <Icon path={mdiCommentEditOutline} size={0.9} />
        </span>
        ثبت نظر
      </h3>

      {!currentUser ? (
        <p className="pd-lock">
          <Lock aria-hidden="true" />
          <span>برای ثبت نظر، لطفاً ابتدا وارد حساب کاربری خود شوید</span>
        </p>
      ) : !canComment ? (
        <p className="pd-lock">
          <Lock aria-hidden="true" />
          <span>شما فقط می‌توانید برای محصولاتی که خریداری کرده‌اید و تحویل گرفته‌اید نظر دهید.</span>
        </p>
      ) : (
        <>
          <div className="mb-2">
            <label className="block mb-1 font-semibold flex gap-1">
              <MessageSquareHeart className="w-5 h-5" />
              امتیاز:
            </label>
            <StarRating rating={rating} setRating={setRating} />
          </div>
          <div className="relative mb-4">
            <TextField
              {...rtlStyles}
              fullWidth
              multiline
              rows={4}
              label="نظر خود را بنویسید"
              placeholder="تجربه خود را از خرید این محصول به اشتراک بگذارید..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              className="bg-white rounded-lg"
              // استفاده از sx برای تنظیم فاصله و فوکوس هماهنگ با تم سایت
              sx={{
                ...rtlStyles.sx,
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: "#ec4899", // رنگ صورتی (pink-500) مشابه دکمه‌ها
                  },
                },
              }}
            />

            {/* دکمه ایموجی - موقعیت آن را کمی تنظیم می‌کنیم تا با TextField تداخل نداشته باشد */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="btn-flat absolute top-3 left-3 text-xl cursor-pointer z-10"
            >
              😊
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 z-20">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="pd-cm-submit bar-sheen"
          >
            <MessageCircle size={18} />
            {loading ? "در حال ثبت نظر..." : "ثبت نظر"}
          </button>
        </>
      )}
    </form>
  );
}