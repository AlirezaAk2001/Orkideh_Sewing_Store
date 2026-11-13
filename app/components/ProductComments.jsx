"use client";

import PageLoader from "./PageLoader";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import CommentsForm from "./CommentsForm";
import CommentsItem from "./CommentsItem";
import { MessageSquare, Star } from "lucide-react";

const fa = (n) => Number(n).toLocaleString("fa-IR");

// initialComments را صفحهٔ سروری (app/products/[slug]/page.jsx) می‌دهد تا بار اول در همان HTML باشد؛
// بعد از ثبت یا حذف نظر همچنان همان API سمت مرورگر صدا زده می‌شود (fetchComments)
// بالا: کارت خلاصه (امتیاز کل، توزیع ستاره‌ها، فرم ثبت نظر)، پایین: کارت نظرها. استایل: .pd-cm* در product/product.css
export default function ProductComments({ productId, initialComments = [] }) {
  const [comments, setComments] = useState(initialComments);
  const [loading, setLoading] = useState(false);

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

  // همان حساب RatingSummary بالای صفحه و JSON-LD: میانگین رأی‌ها؛ توزیع فقط امتیازهای ۱ تا ۵ را می‌شمارد
  const votes = comments.length;
  const average = votes > 0 ? comments.reduce((sum, comment) => sum + (Number(comment.rating) || 0), 0) / votes : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({ star, count: comments.filter((comment) => Number(comment.rating) === star).length }));

  return (
    <div dir="rtl">
      <div className="pd-sec-h">
        <span className="pd-sec-i" aria-hidden="true">
          <MessageSquare />
        </span>
        <h2>نظرات کاربران</h2>
        {votes > 0 && <span className="pd-count">{fa(votes)} نظر</span>}
      </div>

      <div className={`pd-cm-top ${votes === 0 ? "pd-cm-top--solo" : ""}`}>
        {votes > 0 && (
          <>
            <div className="pd-score">
              <div className="pd-score-big">
                <b>{Number(average.toFixed(1)).toLocaleString("fa-IR", { minimumFractionDigits: 1 })}</b>
                <small>از ۵</small>
              </div>
              <span className="pd-stars" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={n <= Math.round(average) ? "on" : undefined} />
                ))}
              </span>
              <p>بر اساس {fa(votes)} نظر</p>
            </div>
            <ul className="pd-dist" aria-label="توزیع امتیازها">
              {distribution.map(({ star, count }) => (
                <li key={star}>
                  <span>{fa(star)} ★</span>
                  <span className="pd-dist-bar">
                    <i className="pd-dist-fill" style={{ "--w": `${Math.round((count / votes) * 100)}%` }} />
                  </span>
                  <span className="pd-dist-n">{fa(count)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {/* فرم ثبت نظر */}
        <CommentsForm productId={productId} onSubmit={fetchComments} />
      </div>

      {/* لیست کامنت‌ها */}
      {loading ? (
        <PageLoader size="md" className="min-h-[20vh]" label="در حال بارگذاری نظرات..." />
      ) : comments.length === 0 ? (
        <div className="pd-cm-empty">
          <MessageSquare aria-hidden="true" />
          <p className="text-sm sm:text-base">هنوز هیچ نظری برای این محصول ثبت نشده است.</p>
        </div>
      ) : (
        <ol className="pd-cms">
          {comments.map((comment, index) => (
            <CommentsItem key={comment.id} comment={comment} onDelete={fetchComments} index={index} />
          ))}
        </ol>
      )}
    </div>
  );
}
