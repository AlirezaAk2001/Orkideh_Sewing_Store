"use client";

import { useEffect, useId, useRef, useState } from "react";
import toast from "react-hot-toast";
import moment from "moment-jalaali";
import { CheckCheck, CircleCheck, Clock, Package, Quote, Reply, Send, Star, X } from "lucide-react";
import { PenIcon } from "@/app/components/ActionIcons";
import Chip from "@/app/admin/_list/Chip";
import Highlight from "@/app/admin/_list/Highlight";
import { prefersReducedMotion, scrollBehavior } from "@/lib/motion";
import { tip } from "@/lib/tip";

const fa = (n) => Number(n).toLocaleString("fa-IR");

// ارتفاع باکس پاسخ با متن بالا می‌آید (از یک خط شروع می‌کند)؛ سقفش با max-h خود باکس است و بعد از آن اسکرول می‌خورد
function fitHeight(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

// فرمت تاریخ و زمان فارسی
function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const formatted = moment(dateStr).format("HH:mm:ss - jYYYY/jMM/jDD");
  return formatted.replace(/\d/g, (digit) => String.fromCharCode(parseInt(digit) + 1776));
}

// ستاره‌های امتیاز: پر و زرد تا امتیاز و بقیه خاکستری، با عدد امتیاز کنارشان؛ ستاره‌های پر هنگام ورود کارت یکی‌یکی جهش می‌کنند (cm-star، با تأخیر کارت: delay).
// برای صفحه‌خوان یک جملهٔ کامل
function Stars({ rating, delay = 0 }) {
  const n = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <span role="img" aria-label={`امتیاز ${fa(n)} از ${fa(5)}`} className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          data-on={s <= n ? "" : undefined}
          style={{ "--i": s, "--d": `${delay}ms` }}
          className={`cm-star h-4 w-4 ${s <= n ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
          aria-hidden="true"
        />
      ))}
      <span aria-hidden="true" className="ms-1.5 text-xs font-bold tabular-nums text-amber-600">
        {fa(n)}
      </span>
    </span>
  );
}

// دایرهٔ حرف اول نام کاربر
function Avatar({ name, tone = "amber" }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
  };
  return (
    <span aria-hidden="true" className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-base font-extrabold ring-1 ring-inset transition-colors duration-500 ${tones[tone]}`}>
      {(name || "؟")[0]}
    </span>
  );
}

// کارت یک نظر. ساختار: نوار رنگی وضعیت لبهٔ شروع (سبز تأییدشده، زرد در انتظار؛ با تغییر وضعیت نرم رنگ عوض می‌کند)، سربرگ (آواتار، نام و تاریخ، ستاره‌ها، چیپ وضعیت)،
// متن نظر درشت، پاسخ مدیر (حباب زیر نظر با خط ارتباط)، و ردیف پایین (چیپ محصول در ابتدا، دکمه‌ها در انتها که کارت‌های هم‌ردیف را هم‌تراز می‌کند).
// پاسخ دادن و ویرایش پاسخ داخل خود کارت و در همان حبابِ «پاسخ مدیر» انجام می‌شود (مثل ویرایش پیام در تلگرام): پاسخ تازه با کشیده شدن خط ارتباط و سپس ظاهر شدن نرم حباب (cm-fold) باز می‌شود
// و پاسخ موجود در جای خودش به باکس نوشتن بدل می‌شود. دکمه‌های «انصراف» و «ارسال» دو آیکون گرد کنار متن داخل حباب‌اند (با tooltip). فوکوس روی باکس، Ctrl+Enter ارسال و Esc بستن.
// تأیید و رد: ابتدا درخواست به سرور می‌رود، و فقط اگر موفق بود وضعیت عوض می‌شود. کارتی که با آن وضعیت دیگر در تب فعلی نمی‌ماند («در انتظار» پس از تأیید، «تأییدشده» پس از رد)
// با محو شدنِ کوتاه (comment-dissolve) از فهرست می‌رود؛ در تب «همه» می‌ماند، رنگ نوار و چیپش نرم عوض می‌شود و یک حلقهٔ کوتاه دور کارت می‌درخشد (cm-ring).
// terms = واژه‌های جست‌وجو برای رنگ‌کردن یافته‌ها. در تب «پاسخ‌داده‌نشده» کارتی که پاسخ می‌گیرد (یا رد تأیید می‌شود) دیگر در این فهرست نمی‌ماند، پس مثل تأیید در تب «تأیید نشده» محو می‌شود.
// onReply فقط درخواست را می‌فرستد و تغییر (پاسخ و زمانش) را برمی‌گرداند؛ اعمالش در فهرست با settle است تا محو شدن کارت پیش از حذفش بیاید
export default function CommentCard({ comment, index, activeTab, terms, onApprove, onReject, onReply, onPatch }) {
  const [busy, setBusy] = useState(""); // "approve" | "reject" | ""
  const [leaving, setLeaving] = useState(false);
  const [flash, setFlash] = useState(0);
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [swapIn, setSwapIn] = useState(false); // متن پاسخ تازه ثبت‌شده با حرکت ورود جای باکس نوشتن می‌نشیند (پاسخ‌های از اول بی‌حرکت‌اند)
  const areaRef = useRef(null);
  const toggleRef = useRef(null);
  const replyId = useId();
  const panelId = useId();

  const name = comment.User?.username || comment.User?.name || "کاربر ناشناس";
  const hasReply = !!comment.adminReply;
  const isApproved = !!comment.approved;
  const delay = Math.min(index, 10) * 40;
  const original = (comment.adminReply || "").trim();
  // حباب پاسخ وقتی هست که پاسخی ثبت شده یا کاربر می‌خواهد بنویسد؛ بدون پاسخ، همان حباب بسته و پنهان (inert) آمادهٔ باز شدن است
  const showBox = hasReply || replying;
  const editing = replying || !hasReply;
  const canSend = !sending && !!draft.trim() && draft.trim() !== original;

  // با باز شدن باکس: ارتفاعش با متن هم‌اندازه می‌شود، فوکوس به آن می‌رود و مکان‌نما انتهای متن می‌نشیند (کمی بعد، تا باز شدن شروع شود)؛ اگر کارت پایین صفحه است باکس به دید می‌آید
  useEffect(() => {
    if (!replying) return undefined;
    fitHeight(areaRef.current);
    const focus = setTimeout(() => {
      const el = areaRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      el.setSelectionRange(el.value.length, el.value.length);
    }, 120);
    const reveal = setTimeout(() => areaRef.current?.scrollIntoView({ block: "nearest", behavior: scrollBehavior() }), 400);
    return () => {
      clearTimeout(focus);
      clearTimeout(reveal);
    };
  }, [replying]);

  // پس از موفقیت: یا کارت از فهرست این تب می‌رود (محو و بعد حذف از state) یا همان‌جا وضعیتش عوض می‌شود
  const settle = (change, leavesTab) => {
    if (leavesTab) {
      setLeaving(true);
      setTimeout(() => onPatch(comment.id, change), prefersReducedMotion() ? 0 : 560);
    } else {
      onPatch(comment.id, change);
      setFlash((k) => k + 1);
    }
  };

  const handleApprove = async () => {
    if (busy || leaving) return;
    setBusy("approve");
    const ok = await onApprove(comment.id);
    setBusy("");
    if (ok) settle({ approved: true }, activeTab === "pending");
  };

  const handleReject = async () => {
    if (busy || leaving) return;
    setBusy("reject");
    const ok = await onReject(comment.id);
    setBusy("");
    if (ok) {
      setReplying(false);
      settle({ approved: false, adminReply: null }, activeTab === "approved" || activeTab === "unanswered");
    }
  };

  const openReply = () => {
    setDraft(comment.adminReply || "");
    setReplying(true);
  };
  const closeReply = () => {
    setReplying(false);
    toggleRef.current?.focus({ preventScroll: true });
  };

  const send = async () => {
    const text = draft.trim();
    if (!text) {
      toast.error("لطفاً پاسخ خود را وارد کنید");
      return;
    }
    if (text === original) {
      closeReply(); // متن همان است؛ چیزی برای ثبت نیست
      return;
    }
    setSending(true);
    try {
      const change = await onReply(comment.id, text);
      toast.success(hasReply ? `پاسخ مدیر به ${name} با موفقیت ویرایش شد` : `پاسخ مدیر به ${name} با موفقیت ثبت شد`);
      setSwapIn(true);
      setReplying(false);
      toggleRef.current?.focus({ preventScroll: true });
      settle(change, activeTab === "unanswered" && !hasReply);
    } catch {
      // خطا را onReply با toast گفته است؛ باکس باز می‌ماند تا متن از دست نرود
    } finally {
      setSending(false);
    }
  };

  return (
    <article
      data-ok={isApproved ? "" : undefined}
      className={`cm-card admin-row-in ${leaving ? "comment-dissolve" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span aria-hidden="true" className="cm-rail" />
      {flash > 0 && <span key={flash} aria-hidden="true" className="cm-ring" />}
      <div className="flex flex-1 flex-col p-4 ps-5 sm:p-5 sm:ps-6">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
          <Avatar name={name} tone={isApproved ? "green" : "amber"} />
          <div className="min-w-0 flex-1 basis-36">
            <h2 className="truncate text-[15px] font-extrabold leading-6 text-gray-900">
              <Highlight text={name} terms={terms} />
            </h2>
            <p className="text-xs leading-5 text-gray-400">{formatDateTime(comment.createdAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Stars rating={comment.rating} delay={delay} />
            {isApproved ? (
              <Chip key="ok" tone="green" icon={CircleCheck} className="admin-swap">
                تأیید شده
              </Chip>
            ) : (
              <Chip key="wait" tone="amber" icon={Clock} className="admin-swap">
                در انتظار تأیید
              </Chip>
            )}
          </div>
        </header>

        <blockquote className="relative mt-4 break-words ps-9 text-[15px] leading-8 text-gray-800">
          <Quote aria-hidden="true" className="absolute start-0 top-1.5 h-5 w-5 -scale-x-100 text-brand-300" />
          <Highlight text={comment.text} terms={terms} />
        </blockquote>

        {/* ناحیهٔ پاسخ مدیر: حبابِ نمایش پاسخ که با کلیک روی «پاسخ» / «ویرایش پاسخ» در همان جا به باکس نوشتن بدل می‌شود (اول خط ارتباط کشیده می‌شود، بعد حباب ظاهر می‌شود: cm-fold در comments.css) */}
        <div id={panelId} className="cm-fold" data-open={showBox ? "" : undefined} inert={!showBox}>
          <div>
            <div className="pb-1 pt-4">
              <div className="cm-reply">
                <div className="cm-bubble rounded-xl bg-brand-50/60 p-3 ring-1 ring-brand-100" data-editing={editing ? "" : undefined}>
                  <p className="flex items-center gap-1.5 text-xs font-bold text-brand-700">
                    <Reply className="h-3.5 w-3.5" aria-hidden="true" />
                    پاسخ مدیر
                    {hasReply && comment.adminReplyAt && <span className="font-normal text-gray-400">· {formatDateTime(comment.adminReplyAt)}</span>}
                  </p>
                  {editing ? (
                    <div className={`mt-1.5 flex items-end gap-2 ${hasReply ? "admin-swap" : ""}`}>
                      <textarea
                        ref={areaRef}
                        id={replyId}
                        aria-label="پاسخ مدیر"
                        value={draft}
                        onChange={(e) => {
                          setDraft(e.target.value);
                          fitHeight(e.target);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            send();
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            e.stopPropagation();
                            closeReply();
                          }
                        }}
                        placeholder="پاسخ خود را بنویسید..."
                        rows={1}
                        className="block max-h-48 min-h-7 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent text-sm leading-7 text-gray-800 placeholder:text-gray-400 focus:outline-none"
                      />
                      {/* دو آیکون گرد مثل نوار پیام تلگرام (بدون متن)؛ راهنمایشان روی span است تا دکمهٔ غیرفعال هم راهنما بدهد */}
                      <div className="flex shrink-0 items-center gap-1">
                        <span {...tip("انصراف (Esc)")} className="inline-flex">
                          <button
                            type="button"
                            onClick={closeReply}
                            disabled={sending}
                            aria-label="انصراف"
                            className="btn-flat grid h-8 w-8 cursor-pointer place-items-center rounded-full text-gray-400 transition-colors hover:bg-gray-200/70 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-60"
                          >
                            <X className="h-[18px] w-[18px]" aria-hidden="true" />
                          </button>
                        </span>
                        <span {...tip(`${hasReply ? "ثبت ویرایش" : "ارسال پاسخ"} (Ctrl+Enter)`)} className="inline-flex">
                          <button
                            type="button"
                            onClick={send}
                            disabled={!canSend}
                            aria-label={hasReply ? "ثبت ویرایش" : "ارسال پاسخ"}
                            className="btn-flat grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-brand-600 text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                          >
                            {sending ? (
                              <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent motion-reduce:animate-none" />
                            ) : (
                              <Send className="h-4 w-4 -scale-x-100" aria-hidden="true" />
                            )}
                          </button>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className={`mt-1.5 break-words text-sm leading-7 text-gray-800 ${swapIn ? "admin-swap" : ""}`}>
                      <Highlight text={comment.adminReply} terms={terms} />
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-4">
          <div className="min-w-0 flex-1 basis-40">
            <Chip tone="gray" icon={Package} className="max-w-full">
              <span className="sr-only">محصول: </span>
              <span className="truncate">
                <Highlight text={comment.Product?.name || "—"} terms={terms} />
              </span>
            </Chip>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isApproved ? (
              <button
                type="button"
                onClick={handleApprove}
                disabled={!!busy || leaving}
                {...tip("تأیید نظر")}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "approve" ? (
                  <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent motion-reduce:animate-none" />
                ) : (
                  <CheckCheck className="h-4 w-4" aria-hidden="true" />
                )}
                تأیید
              </button>
            ) : (
              <>
                <button
                  ref={toggleRef}
                  type="button"
                  onClick={replying ? closeReply : openReply}
                  aria-expanded={replying}
                  aria-controls={panelId}
                  {...tip(replying ? "بستن باکس پاسخ" : hasReply ? "ویرایش پاسخ" : "پاسخ به نظر")}
                  className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl px-4 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 ${
                    hasReply || replying ? "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-100/70" : "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
                  }`}
                >
                  {hasReply ? <PenIcon className="h-4 w-4" /> : <Reply className="h-4 w-4" aria-hidden="true" />}
                  {hasReply ? "ویرایش پاسخ" : "پاسخ"}
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={!!busy || leaving}
                  {...tip("رد تأیید")}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-white px-3.5 text-[13px] font-semibold text-red-600 ring-1 ring-inset ring-red-200 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy === "reject" ? (
                    <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent motion-reduce:animate-none" />
                  ) : (
                    <X className="h-4 w-4" aria-hidden="true" />
                  )}
                  رد تأیید
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
    </article>
  );
}
