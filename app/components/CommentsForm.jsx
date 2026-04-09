"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import StarRating from "./StarRating";
import { useAuth } from "@/lib/context";
import { MessageCircle, MessageSquareHeart } from "lucide-react";
import Icon from '@mdi/react';
import { mdiCommentEditOutline } from '@mdi/js';

export default function CommentsForm({ productId, onSubmit }) {
  const { currentUser } = useAuth();
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [canComment, setCanComment] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);

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
    return <div className="p-4 text-center">در حال بررسی مجوز...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded-xl bg-gray-50" dir="rtl">
      <h3 className="text-lg font-semibold mb-2 flex gap-1">
        <Icon path={mdiCommentEditOutline} size={1.1} />
        ثبت نظر
      </h3>
      
      {!currentUser ? (
        <div className="text-red-500 mb-4">
          برای ثبت نظر، لطفاً ابتدا وارد حساب کاربری خود شوید
        </div>
      ) : !canComment ? (
        <div className="text-red-500 mb-4">
          شما فقط می‌توانید برای محصولاتی که خریداری کرده‌اید و تحویل گرفته‌اید نظر دهید.
        </div>
      ) : (
        <>
          <div className="mb-2">
            <label className="block mb-1 font-semibold flex gap-1">
              <MessageSquareHeart className="w-5 h-5" />
              امتیاز:
            </label>
            <StarRating rating={rating} setRating={setRating} />
          </div>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="نظر خود را بنویسید"
              className="border p-2 w-full mb-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              rows={4}
              required
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute top-2 left-2 text-xl cursor-pointer"
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
            className="flex items-center justify-center gap-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition disabled:opacity-50 cursor-pointer"
          >
            <MessageCircle size={18} />
            {loading ? "در حال ثبت نظر..." : "ثبت نظر"}
          </button>
        </>
      )}
    </form>
  );
}