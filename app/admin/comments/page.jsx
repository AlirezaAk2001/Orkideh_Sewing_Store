"use client";

import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import moment from "moment-jalaali";
import { Dialog } from "@mui/material";
import { CheckCheck, CircleCheck, Clock, MessageSquareDashed, MessageSquareText, Package, Pencil, Reply, Send, Star, X } from "lucide-react";
import Icon from "@mdi/react";
import { mdiAccountBoxEditOutline } from "@mdi/js";
import PageHeader from "@/app/admin/_shell/PageHeader";
import ListCard from "@/app/admin/_list/ListCard";
import EmptyState from "@/app/admin/_list/EmptyState";
import SegmentedTabs from "@/app/admin/_list/SegmentedTabs";
import Chip from "@/app/admin/_list/Chip";

const fa = (n) => Number(n).toLocaleString("fa-IR");

// رنگ هر تب: «همه» برند، «تأیید شده» سبز و «تأیید نشده» زرد (همان سبز و زرد داشبورد). ink رنگ تیره‌تر برای نوشته روی زمینهٔ روشن
const AMBER = "#f5b00a";
const GREEN = "var(--viz-st-delivered)";
const TAB_DEFS = [
  { id: "all", label: "تمام نظرات", noun: "نظر", icon: MessageSquareText, color: "var(--color-brand-600)", ink: "var(--color-brand-700)" },
  { id: "approved", label: "نظرات تأیید شده", noun: "نظر تأیید شده", icon: CircleCheck, color: GREEN, ink: `color-mix(in srgb, ${GREEN} 62%, black)` },
  { id: "pending", label: "نظرات تأیید نشده", noun: "نظر در انتظار تأیید", icon: Clock, color: AMBER, ink: `color-mix(in srgb, ${AMBER} 55%, black)` },
];

const EMPTY = {
  all: { icon: MessageSquareDashed, title: "هنوز نظری ثبت نشده", hint: "وقتی مشتریان برای محصولات نظر بگذارند، اینجا برای تأیید و پاسخ نشان داده می‌شود." },
  approved: { icon: MessageSquareText, title: "هنوز نظری تأیید نشده", hint: "نظرهایی که تأیید کنید در صفحهٔ همان محصول به همه نشان داده می‌شوند." },
  pending: { icon: CheckCheck, title: "همهٔ نظرها بررسی شده‌اند", hint: "نظر تازه‌ای در انتظار تأیید نیست." },
};

// فرمت تاریخ و زمان فارسی
function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const formatted = moment(dateStr).format("HH:mm:ss - jYYYY/jMM/jDD");
  return formatted.replace(/\d/g, (digit) => String.fromCharCode(parseInt(digit) + 1776));
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ستاره‌های امتیاز: پر و زرد تا امتیاز، بقیه خاکستری؛ برای صفحه‌خوان یک جملهٔ کامل
function Stars({ rating }) {
  const n = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <span role="img" aria-label={`امتیاز ${fa(n)} از ${fa(5)}`} className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-4 w-4 ${s <= n ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} aria-hidden="true" />
      ))}
    </span>
  );
}

// دایرهٔ حرف اول نام کاربر
function Avatar({ name, tone = "gray", className = "h-10 w-10" }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    gray: "bg-gray-100 text-gray-600 ring-gray-200",
    brand: "bg-brand-50 text-brand-700 ring-brand-200",
  };
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full text-sm font-extrabold ring-1 ring-inset ${tones[tone]} ${className}`}>
      {(name || "؟")[0]}
    </span>
  );
}

// پنجرهٔ پاسخ مدیر (MUI Dialog: تله‌ی فوکوس، Esc و کلیک روی پس‌زمینه). نظر کاربر بالاست؛ بدون پاسخ یا در حالت ویرایش، جعبهٔ نوشتن پایین می‌آید
function ReplyDialog({ comment, onClose, onSave }) {
  const [replyText, setReplyText] = useState(comment.adminReply || "");
  const [originalReply] = useState(comment.adminReply || "");
  const [editMode, setEditMode] = useState(!comment.adminReply);
  const [saving, setSaving] = useState(false);
  const name = comment.User?.username || comment.User?.name || "کاربر ناشناس";
  const editing = editMode && !!comment.adminReply;

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
    <Dialog
      open
      onClose={onClose}
      dir="rtl"
      aria-labelledby="reply-title"
      PaperProps={{ sx: { borderRadius: "20px", width: "100%", maxWidth: 520, m: 2, maxHeight: "88vh", boxShadow: "0 30px 70px -20px rgb(0 0 0 / 0.35)" } }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-l from-brand-50 to-white px-5 py-4">
        <h2 id="reply-title" className="flex items-center gap-2.5 text-base font-extrabold text-gray-900">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-brand-100">
            {editing ? <Pencil className="h-[18px] w-[18px]" aria-hidden="true" /> : <Reply className="h-[18px] w-[18px]" aria-hidden="true" />}
          </span>
          {editing ? "ویرایش پاسخ به نظر کاربر" : "پاسخ به نظر کاربر"}
        </h2>
        <button
          type="button"
          aria-label="بستن"
          onClick={onClose}
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200/70">
          <div className="flex items-center gap-2.5">
            <Avatar name={name} tone="gray" className="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900">{name}</p>
              <p className="text-xs text-gray-400">{formatDateTime(comment.createdAt)}</p>
            </div>
          </div>
          <div className="mt-2.5">
            <Stars rating={comment.rating} />
          </div>
          <p className="mt-2 text-sm leading-7 text-gray-700">{comment.text}</p>
        </div>

        {comment.adminReply && !editMode && (
          <div className="rounded-xl bg-brand-50/60 p-4 ring-1 ring-brand-100">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Avatar name="م" tone="brand" className="h-9 w-9" />
                <div>
                  <p className="text-sm font-bold text-brand-700">مدیر</p>
                  <p className="text-xs text-gray-400">{formatDateTime(comment.adminReplyAt)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                ویرایش
              </button>
            </div>
            <p className="mt-2.5 text-sm leading-7 text-gray-700">{comment.adminReply}</p>
          </div>
        )}
      </div>

      {(editMode || !comment.adminReply) && (
        <div className="border-t border-gray-100 bg-gray-50/70 p-4">
          <div className="flex items-end gap-2">
            <textarea
              autoFocus
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="پاسخ خود را بنویسید..."
              aria-label="پاسخ مدیر"
              rows={3}
              className="min-h-[5.5rem] flex-1 resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm leading-7 text-gray-800 transition placeholder:text-gray-400 hover:border-gray-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) handleSend();
              }}
            />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSend}
                disabled={saving || !replyText.trim() || replyText.trim() === originalReply.trim()}
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                title="ارسال (Ctrl+Enter)"
                aria-label="ارسال پاسخ"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
              {comment.adminReply && editMode && (
                <button
                  type="button"
                  onClick={() => {
                    setReplyText(comment.adminReply);
                    setEditMode(false);
                  }}
                  className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl bg-gray-200 text-gray-600 transition hover:bg-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                  title="انصراف"
                  aria-label="انصراف از ویرایش"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">Ctrl+Enter برای ارسال سریع</p>
        </div>
      )}

      {!editMode && comment.adminReply && (
        <div className="flex justify-end border-t border-gray-100 bg-gray-50/70 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 cursor-pointer rounded-xl bg-gray-200 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            بستن
          </button>
        </div>
      )}
    </Dialog>
  );
}

// کارت یک نظر: نوار رنگی وضعیت (سبز تأیید شده، زرد در انتظار)، کاربر و تاریخ، چیپ وضعیت، محصول و امتیاز، متن نظر، پاسخ مدیر و دکمه‌ها.
// «رد تأیید» فقط برای نظر تأییدشده معنا دارد. در تب «تأیید شده» کارت با یک محو شدن کوتاه از فهرست می‌رود؛ در تب «همه» می‌ماند و فقط وضعیتش عوض می‌شود
function CommentCard({ comment, index, activeTab, onApprove, onReject, onReply }) {
  const [dissolving, setDissolving] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [approving, setApproving] = useState(false);

  const name = comment.User?.username || comment.User?.name || "کاربر ناشناس";
  const hasReply = !!comment.adminReply;
  const isApproved = comment.approved;

  const handleReject = () => {
    if (activeTab !== "approved") {
      onReject(comment.id);
      return;
    }
    setDissolving(true);
    setTimeout(() => onReject(comment.id), reducedMotion() ? 0 : 600);
  };

  const handleApprove = async () => {
    if (approving) return;
    setApproving(true);
    try {
      await onApprove(comment.id);
    } finally {
      setApproving(false);
    }
  };

  return (
    <>
      <article
        className={`admin-row-in relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/80 transition-shadow hover:shadow-md ${dissolving ? "comment-dissolve" : ""}`}
        style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
      >
        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1" style={{ background: isApproved ? GREEN : AMBER }} />
        <div className="p-4 ps-5 sm:p-5 sm:ps-6">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={name} tone={isApproved ? "green" : "amber"} />
              <div className="min-w-0">
                <h2 className="truncate text-sm font-extrabold text-gray-900">{name}</h2>
                <p className="text-xs text-gray-400">{formatDateTime(comment.createdAt)}</p>
              </div>
            </div>
            {isApproved ? (
              <Chip tone="green" icon={CircleCheck}>تأیید شده</Chip>
            ) : (
              <Chip tone="amber" icon={Clock}>در انتظار تأیید</Chip>
            )}
          </header>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Chip tone="gray" icon={Package} className="max-w-full">
              <span className="sr-only">محصول: </span>
              <span className="truncate">{comment.Product?.name || "—"}</span>
            </Chip>
            <Stars rating={comment.rating} />
          </div>

          <blockquote className="mt-3 break-words rounded-xl border-s-4 border-gray-200 bg-gray-50/80 px-4 py-3 text-sm leading-7 text-gray-700">{comment.text}</blockquote>

          {hasReply && (
            <div className="mt-3 rounded-xl bg-brand-50/60 p-3 ring-1 ring-brand-100">
              <p className="flex items-center gap-1.5 text-xs font-bold text-brand-700">
                <Reply className="h-3.5 w-3.5" aria-hidden="true" />
                پاسخ مدیر
                {comment.adminReplyAt && <span className="font-normal text-gray-400">· {formatDateTime(comment.adminReplyAt)}</span>}
              </p>
              <p className="mt-1.5 break-words text-sm leading-7 text-gray-800">{comment.adminReply}</p>
            </div>
          )}

          <footer className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-dashed border-gray-200 pt-4">
            {!isApproved ? (
              <button
                type="button"
                onClick={handleApprove}
                disabled={approving}
                title="تأیید نظر"
                className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {approving ? (
                  <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent motion-reduce:animate-none" />
                ) : (
                  <CheckCheck className="h-[18px] w-[18px]" aria-hidden="true" />
                )}
                تأیید
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowReplyDialog(true)}
                  title={hasReply ? "ویرایش پاسخ" : "پاسخ به نظر"}
                  className={`inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 ${
                    hasReply ? "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-100/70" : "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
                  }`}
                >
                  {hasReply ? <Pencil className="h-[18px] w-[18px]" aria-hidden="true" /> : <Reply className="h-[18px] w-[18px]" aria-hidden="true" />}
                  {hasReply ? "ویرایش پاسخ" : "پاسخ"}
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={dissolving}
                  title="رد تأیید"
                  className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-red-600 ring-1 ring-inset ring-red-200 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="h-[18px] w-[18px]" aria-hidden="true" />
                  رد تأیید
                </button>
              </>
            )}
          </footer>
        </div>
      </article>

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
    </>
  );
}

// اسکلتون لودینگ
function CommentSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80" aria-hidden="true">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded-full bg-gray-200" />
            <div className="h-3 w-24 rounded-full bg-gray-100" />
          </div>
        </div>
        <div className="h-6 w-24 rounded-full bg-gray-100" />
      </div>
      <div className="mt-4 flex gap-4">
        <div className="h-6 w-36 rounded-full bg-gray-100" />
        <div className="h-5 w-24 rounded-full bg-gray-100" />
      </div>
      <div className="mt-3 h-16 rounded-xl bg-gray-100" />
      <div className="mt-4 flex justify-end gap-2 border-t border-dashed border-gray-200 pt-4">
        <div className="h-10 w-24 rounded-xl bg-gray-200" />
        <div className="h-10 w-24 rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}

export default function AdminComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

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
      setComments((prev) => prev.map((c) => (c.id === id ? { ...c, approved: true } : c)));
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
      setComments((prev) => prev.map((c) => (c.id === id ? { ...c, approved: false, adminReply: null } : c)));
    } catch (err) {
      toast.error(err.response?.data?.error || "خطا در رد تأیید نظر");
    }
  };

  const handleReply = async (id, reply) => {
    try {
      const { data } = await axios.put(
        "/api/admin/comments",
        { id, adminReply: reply },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, adminReply: reply, adminReplyAt: data.comment.adminReplyAt } : c))
      );
    } catch (err) {
      toast.error(err.response?.data?.error || "خطا در ثبت پاسخ");
      throw err;
    }
  };

  const counts = useMemo(() => {
    const approved = comments.filter((c) => c.approved).length;
    return { all: comments.length, approved, pending: comments.length - approved };
  }, [comments]);

  const filteredComments = comments.filter((c) => {
    if (activeTab === "approved") return c.approved;
    if (activeTab === "pending") return !c.approved;
    return true;
  });

  const tabs = TAB_DEFS.map((t) => ({ ...t, count: counts[t.id] }));
  const current = TAB_DEFS.find((t) => t.id === activeTab);

  // حالت خالی هر تب؛ اگر تب دیگری نظر دارد، دکمهٔ رفتن به آن هم می‌آید (از «تأیید شده» به «تأیید نشده» و برعکس؛ اگر آن هم خالی بود به «همه»)
  let empty = null;
  if (!loading && filteredComments.length === 0) {
    const e = EMPTY[activeTab];
    const sibling = activeTab === "approved" ? "pending" : activeTab === "pending" ? "approved" : null;
    const target = sibling && counts[sibling] > 0 ? TAB_DEFS.find((t) => t.id === sibling) : TAB_DEFS[0];
    empty = (
      <EmptyState
        icon={e.icon}
        title={e.title}
        hint={e.hint}
        action={
          activeTab !== "all" && counts.all > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab(target.id)}
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-gray-100 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            >
              نمایش {target.id === "all" ? "همهٔ نظرها" : target.label} ({fa(counts[target.id])})
            </button>
          )
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        icon={<Icon path={mdiAccountBoxEditOutline} size="22px" />}
        title="مدیریت نظرات کاربران"
        loading={loading}
        subtitleKey={activeTab}
        subtitleColor={activeTab === "all" ? undefined : current.ink}
        subtitle={<><b>{fa(filteredComments.length)}</b> {current.noun} یافت شد</>}
      />

      <SegmentedTabs label="وضعیت نظر" tabs={tabs} value={activeTab} onChange={setActiveTab} loading={loading} idPrefix="comments" panelId="comments-panel" />

      <div id="comments-panel" role="tabpanel" aria-labelledby={`comments-tab-${activeTab}`} aria-busy={loading || undefined} className="mt-4">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <CommentSkeleton key={i} />
            ))}
          </div>
        ) : empty ? (
          <ListCard>{empty}</ListCard>
        ) : (
          <div key={activeTab} className="space-y-3">
            {filteredComments.map((comment, i) => (
              <CommentCard key={comment.id} comment={comment} index={i} activeTab={activeTab} onApprove={handleApprove} onReject={handleReject} onReply={handleReply} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
