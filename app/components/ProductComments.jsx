"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import CommentsForm from "./CommentsForm";
import CommentsItem from "./CommentsItem";
import { useAuth } from "@/lib/context";
import { MessageSquare } from "lucide-react";
import Icon from '@mdi/react';
import { mdiCommentAccountOutline } from '@mdi/js';
import Image from "next/image";

export default function ProductComments({ productId }) {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const { data } = await axios.get(`/api/admin/products/${productId}/comments`);
      // فقط کامنت‌های تأیید شده را نمایش بده
      const approvedComments = (data || []).filter(comment => comment.approved);
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
      <h2 className="text-lg sm:text-xl font-bold flex gap-1">
        <Icon path={mdiCommentAccountOutline} size={1.2} />
        نظرات کاربران
      </h2>

      {/* نمایش فرم کامنت */}
      <CommentsForm productId={productId} onSubmit={fetchComments} />

      {/* نمایش لیست کامنت‌ها */}
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
          {/* {currentUser && (
            <p className="text-xs mt-1 text-gray-400">
              شما فقط می‌توانید برای محصولاتی که خریداری کرده‌اید و تحویل گرفته‌اید نظر دهید.
            </p>
          )} */}
        </div>
      ) : (
        comments.map((comment, index) => (
          <CommentsItem
            key={comment.id + "_" + index}
            comment={comment}
            onDelete={fetchComments}
          />
        ))
      )}
    </div>
  );
}