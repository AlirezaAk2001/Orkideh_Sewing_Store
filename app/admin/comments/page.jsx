"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { CheckCircle2, Clock, Send, X, Edit3 } from "lucide-react";
import moment from "moment-jalaali";
import Icon from "@mdi/react";
import {
  mdiAccountBoxEditOutline,
  mdiCommentRemoveOutline,
  mdiCommentCheckOutline,
  mdiMessageReplyTextOutline,
  mdiCommentEditOutline,
  mdiCommentAccountOutline,
  mdiCommentCheckOutline as mdiApproved,
  mdiCommentOffOutline,
} from "@mdi/js";

// ستاره‌های امتیاز
function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-amber-400" : "text-gray-300"}>
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

// دیالوگ پاسخ ادمین
function ReplyDialog({ comment, onClose, onSave }) {
  const [replyText, setReplyText] = useState(comment.adminReply || "");
  const [originalReply] = useState(comment.adminReply || "");
  const [editMode, setEditMode] = useState(!comment.adminReply);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (editMode && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editMode]);

  const handleSend = async () => {
    if (!replyText.trim()) {
      toast.error("لطفاً پاسخ خود را وارد کنید");
      return;
    }
    setSaving(true);
    try {
      await onSave(comment.id, replyText.trim());
      const userName = comment.User?.username || comment.User?.name || "کاربر";
      if (editMode && originalReply) {
        toast.success(`پاسخ مدیر به ${userName} با موفقیت ویرایش شد`);
      } else {
        toast.success(`پاسخ مدیر به ${userName} با موفقیت ثبت شد`);
      }
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
        dir="rtl"
        style={{ maxHeight: "85vh" }}
      >
        {/* هدر دیالوگ */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ background: "linear-gradient(to left, #ede7f6, #f3e5f5)" }}>
          <h3 className="flex items-center gap-2" style={{ fontFamily: "Vazirmatn, sans-serif", fontSize: "1rem", fontWeight: 700, margin: 0, color: "#4a148c" }}>
            <Icon
              path={editMode && comment.adminReply ? mdiCommentEditOutline : mdiMessageReplyTextOutline}
              size={0.9}
              color="#673ab7"
            />
            {editMode && comment.adminReply ? "ویرایش پاسخ به نظر کاربر" : "پاسخ به نظر کاربر"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition cursor-pointer rounded-full hover:bg-gray-100 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* محتوای اسکرول‌شونده */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* کارت نظر کاربر */}
          <div className="rounded-xl p-4 border border-blue-100 bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
                {(comment.User?.username || comment.User?.name || "؟")[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  {comment.User?.username || comment.User?.name || "کاربر ناشناس"}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDateTime(comment.createdAt)}
                </p>
              </div>
            </div>
            <StarDisplay rating={comment.rating} />
            <p className="mt-2 text-gray-700 text-sm leading-relaxed">{comment.text}</p>
          </div>

          {/* پاسخ فعلی ادمین (اگر وجود داشته باشه) */}
          {comment.adminReply && !editMode && (
            <div className="rounded-xl p-4 border border-green-100 bg-green-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-sm">
                    م
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-700 mb-1">مدیر</p>
                    <p className="text-xs text-green-400">{formatDateTime(comment.adminReplyAt)}</p>
                  </div>

                </div>
                <button
                  onClick={() => setEditMode(true)}
                  className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={13} />
                  ویرایش
                </button>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{comment.adminReply}</p>
            </div>
          )}
        </div>

        {/* چت‌باکس ارسال پاسخ */}
        {(editMode || !comment.adminReply) && (
          <div className="border-t bg-gray-50 p-4">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="پاسخ خود را بنویسید..."
                rows={3}
                className="flex-1 resize-none rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition bg-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) handleSend();
                }}
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSend}
                  disabled={saving || !replyText.trim() || replyText.trim() === originalReply.trim()}
                  className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition cursor-pointer disabled:opacity-50"
                  title="ارسال (Ctrl+Enter)"
                >
                  <Send size={16} />
                </button>
                {comment.adminReply && editMode && (
                  <button
                    onClick={() => { setReplyText(comment.adminReply); setEditMode(false); }}
                    className="w-10 h-10 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-xl flex items-center justify-center transition cursor-pointer"
                    title="انصراف"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Ctrl+Enter برای ارسال سریع</p>
          </div>
        )}

        {/* دکمه بستن */}
        {!editMode && comment.adminReply && (
          <div className="border-t px-5 py-3 flex justify-end bg-gray-50">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm transition cursor-pointer"
            >
              بستن
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// کارت یک کامنت
function CommentCard({ comment, onApprove, onReject, onReply, activeTab }) {
  const [dissolving, setDissolving] = useState(false);
  const [dissolved, setDissolved] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [approving, setApproving] = useState(false);

  const handleReject = () => {
    setDissolving(true);
    setTimeout(() => {
      setDissolved(true);
      onReject(comment.id);
    }, 800);
  };

  if (dissolved) return null;

  const hasReply = !!comment.adminReply;
  const isApproved = comment.approved;

  // آیکون سمت چپ برای reply
  const replyIconPath = hasReply ? mdiCommentEditOutline : mdiMessageReplyTextOutline;

  return (
    <>
      <div
        className={`relative border rounded-xl p-4 transition-all duration-300 ${activeTab === "pending"
            ? "border-amber-200 bg-amber-50"
            : activeTab === "approved"
              ? "border-green-200 bg-green-50"
              : isApproved
                ? "border-green-200 bg-green-50"
                : "border-yellow-200 bg-yellow-50"
          } ${dissolving ? "dissolve-animation" : ""}`}
        style={
          dissolving
            ? {
              animation: "dissolveOut 0.8s ease-out forwards",
            }
            : {}
        }
      >
        {/* هدر کارت */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${isApproved ? "bg-green-200 text-green-700" : "bg-yellow-200 text-yellow-700"
                }`}
            >
              {(comment.User?.username || comment.User?.name || "؟")[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">
                {comment.User?.username || comment.User?.name || "کاربر ناشناس"}
              </p>
              <p className="text-xs text-gray-400">
                {formatDateTime(comment.createdAt)}
              </p>
            </div>
          </div>
          {/* وضعیت */}
          {isApproved ? (
            <span className="text-xs px-2 py-1 rounded-lg bg-green-100 text-green-700 flex items-center gap-1">
              <CheckCircle2 size={13} />
              تأیید شده
            </span>
          ) : (
            <span className="text-xs px-2 py-1 rounded-lg bg-yellow-100 text-yellow-700 flex items-center gap-1">
              <Clock size={13} />
              در انتظار تأیید
            </span>
          )}
        </div>

        {/* محصول */}
        <p className="text-xs text-gray-500 mb-1">
          محصول: <span className="font-medium text-gray-700">{comment.Product?.name || "—"}</span>
        </p>

        {/* امتیاز */}
        <div className="mb-2">
          <StarDisplay rating={comment.rating} />
        </div>

        {/* متن نظر */}
        <p className="text-sm text-gray-700 leading-relaxed mb-3 bg-white rounded-lg p-3 border border-gray-100">
          {comment.text}
        </p>

        {/* پاسخ ادمین (اگه وجود داشته باشه) */}
        {hasReply && (
          <div className="mb-3 rounded-lg p-3 bg-indigo-50 border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-600 mb-1">پاسخ مدیر:</p>
            <p className="text-sm text-indigo-800 leading-relaxed">{comment.adminReply}</p>
          </div>
        )}

        {/* دکمه‌های اکشن */}
        <div className="flex gap-2 justify-end mt-2 border-t pt-3">
          {/* دکمه تأیید / پاسخ / ویرایش */}
          {!isApproved ? (
            <button
              onClick={async () => {
                if (approving) return;
                setApproving(true);
                try {
                  await onApprove(comment.id);
                } finally {
                  setApproving(false);
                }
              }}
              disabled={approving}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff", boxShadow: "0 2px 8px rgba(22,163,74,.3)" }}
              title="تأیید نظر"
            >
              {approving
                ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                : <Icon path={mdiCommentCheckOutline} size={0.75} />}
              تأیید
            </button>
          ) : (
            <button
              onClick={() => setShowReplyDialog(true)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${hasReply
                ? "bg-indigo-100 hover:bg-indigo-200 text-indigo-700"
                : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              title={hasReply ? "ویرایش پاسخ" : "پاسخ به نظر"}
            >
              <Icon path={replyIconPath} size={0.75} />
              {hasReply ? "ویرایش پاسخ" : "پاسخ"}
            </button>
          )}

          {/* دکمه رد تأیید */}
          <button
            onClick={handleReject}
            disabled={dissolving}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", boxShadow: "0 2px 8px rgba(220,38,38,.2)" }}
            title="رد تأیید"
          >
            <Icon path={mdiCommentRemoveOutline} size={0.75} />
            رد تأیید
          </button>
        </div>
      </div>

      {/* دیالوگ پاسخ */}
      {showReplyDialog && (
        <ReplyDialog
          comment={comment}
          onClose={() => setShowReplyDialog(false)}
          onSave={async (id, reply) => {
            await onReply(id, reply);
            setShowReplyDialog(false);
          }}
        />
      )}

      <style jsx>{`
        @keyframes dissolveOut {
          0% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0px);
          }
          30% {
            opacity: 0.8;
            transform: scale(1.01);
            filter: blur(1px);
          }
          100% {
            opacity: 0;
            transform: scale(0.95) translateY(-8px);
            filter: blur(8px);
            max-height: 0;
            padding: 0;
            margin: 0;
          }
        }
      `}</style>
    </>
  );
}

// اسکلتون لودینگ
function SkeletonCard() {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-full bg-gray-200" />
        <div className="space-y-1 flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
        </div>
        <div className="h-6 w-20 bg-gray-100 rounded-lg" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-4 h-4 bg-gray-200 rounded" />)}
      </div>
      <div className="h-16 bg-gray-100 rounded-lg mb-3" />
      <div className="flex gap-2 justify-end pt-3 border-t">
        <div className="h-7 w-16 bg-gray-200 rounded-lg" />
        <div className="h-7 w-16 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

export default function AdminComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [typewriterKey, setTypewriterKey] = useState(0);

  const tabs = [
    { key: "all", label: "تمام نظرات", icon: mdiCommentAccountOutline, activeColor: "bg-indigo-600" },
    { key: "approved", label: "نظرات تأیید شده", icon: mdiCommentCheckOutline, activeColor: "bg-green-600" },
    { key: "pending", label: "نظرات تأیید نشده", icon: mdiCommentOffOutline, activeColor: "bg-amber-500" },
  ];

  const fetchComments = async () => {
    try {
      const { data } = await axios.get("/api/admin/comments", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.error || "خطا در دریافت نظرات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleApprove = async (id) => {
    try {
      await axios.put(
        "/api/admin/comments",
        { id, approved: true },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast.success("نظر تأیید شد");
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, approved: true } : c))
      );
    } catch (err) {
      toast.error(err.response?.data?.error || "خطا در تأیید نظر");
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(
        "/api/admin/comments",
        { id, approved: false },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast.success("نظر از حالت تأیید خارج شد");
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, approved: false, adminReply: null } : c))
      );
    } catch (err) {
      toast.error(err.response?.data?.error || "خطا در رد تأیید نظر");
    }
  };

  const handleReply = async (id, reply) => {
    try {
      const { data } = await axios.put(        // ← data رو دریافت کن
        "/api/admin/comments",
        { id, adminReply: reply },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setComments((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, adminReply: reply, adminReplyAt: data.comment.adminReplyAt }  // ← adminReplyAt از response
            : c
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.error || "خطا در ثبت پاسخ");
      throw err;
    }
  };

  const filteredComments = comments.filter((c) => {
    if (activeTab === "approved") return c.approved;
    if (activeTab === "pending") return !c.approved;
    return true;
  });

  // هر بار که تب عوض شد یا لود تموم شد، typewriter ری‌استارت بشه
  useEffect(() => { setTypewriterKey((k) => k + 1); }, [activeTab, loading]);

  // برچسب زیرنویس هدر بر اساس تب فعال
  const filterLabel = (() => {
    if (activeTab === "approved") return { text: "نظر تأیید شده", color: "#16a34a" };
    if (activeTab === "pending") return { text: "نظر در انتظار تأیید", color: "#d97706" };
    return null;
  })();

  return (
    <div style={{ padding: "16px" }} dir="rtl">

      <style>{`
        /* ── هدر کارت سبک (manage-users style) ── */
        .comments-header-card {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,.07);
          padding: 12px 20px;
          margin-bottom: 10px;
        }
        .comments-header-title {
          font-family: Vazirmatn, sans-serif;
          font-size: 1rem;
          font-weight: 700;
          // color: #673ab7;
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0 0 2px 0;
        }
        .comments-header-subtitle {
          font-family: Vazirmatn, sans-serif;
          font-size: 14px;
          color: #78909c;
          margin-right: 8px;
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          max-width: 0;
          animation: typewriter 0.9s steps(25, end) forwards;
        }
        .comments-header-subtitle b {
          font-size: 16px;
        }
        @keyframes typewriter {
          from { max-width: 0; }
          to   { max-width: 300px; }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── کارت اصلی ── */
        .comment-card {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 4px 24px rgba(0,0,0,.08);
          overflow: hidden;
        }
        .comment-card-body {
          padding: 24px;
        }

        @keyframes pulse-scale {
          0%, 100% { transform: scale(0.8); opacity: 0.5; }
          50%       { transform: scale(1);   opacity: 1;   }
        }
      `}</style>

      {/* ── هدر جدا — سبک لایت مشابه manage-users ── */}
      <div className="comments-header-card">
        <p className="comments-header-title">
          <Icon path={mdiAccountBoxEditOutline} size={1} />
          مدیریت نظرات کاربران
        </p>
        {loading ? (
          <div style={{
            height: 16, width: 120, borderRadius: 4,
            background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
            marginRight: 8,
          }} />
        ) : (
          <span className="comments-header-subtitle" key={typewriterKey} style={{ color: filterLabel ? filterLabel.color : "#1e2a2f" }}>
            {filterLabel ? (
              <><b>{filteredComments.length.toLocaleString("fa-IR")}</b> {filterLabel.text} یافت شد</>
            ) : (
              <><b>{comments.length.toLocaleString("fa-IR")}</b> نظر یافت شد</>
            )}
          </span>
        )}
      </div>

      {/* ── کارت اصلی ── */}
      <div className="comment-card">
        <div className="comment-card-body">

          {/* تب‌ها */}
          <div className="flex justify-center gap-4 mb-6 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${activeTab === tab.key ? tab.activeColor + " text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                <Icon path={tab.icon} size={0.85} />
                {tab.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}
                >
                  {loading ? (
                    <span style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "currentColor",
                      animation: "pulse-scale 1.2s ease-in-out infinite",
                    }} />
                  ) : (
                    tab.key === "all"
                      ? comments.length.toLocaleString("fa-IR")
                      : tab.key === "approved"
                        ? comments.filter((c) => c.approved).length.toLocaleString("fa-IR")
                        : comments.filter((c) => !c.approved).length.toLocaleString("fa-IR")
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* محتوا */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Icon path={mdiCommentAccountOutline} size={3} className="mx-auto mb-3 opacity-30" />
              <p>هیچ نظری در این دسته وجود ندارد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  activeTab={activeTab}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onReply={handleReply}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}