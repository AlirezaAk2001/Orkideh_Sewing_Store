"use client";

import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { CheckCheck, CircleCheck, Clock, Eye, MessageSquareDashed, MessageSquareText, SearchX, X } from "lucide-react";
import Icon from "@mdi/react";
import { mdiAccountBoxEditOutline } from "@mdi/js";
import PageHeader from "@/app/admin/_shell/PageHeader";
import ListCard from "@/app/admin/_list/ListCard";
import TablePage from "@/app/admin/_list/TablePage";
import ScrollArea from "@/app/components/ScrollArea";
import ExpandSearch from "@/app/components/ExpandSearch";
import EmptyState from "@/app/admin/_list/EmptyState";
import SegmentedTabs from "@/app/admin/_list/SegmentedTabs";
import { parseTerms } from "@/app/admin/_list/search";
import CommentCard from "./_ui/CommentCard";
import CommentStats from "./_ui/CommentStats";
import { haystack } from "./_ui/search";
import "./comments.css";

const fa = (n) => Number(n).toLocaleString("fa-IR");

// رنگ هر تب: «همه» برند، «تأیید شده» سبز، «تأیید نشده» زرد (همان سبز و زرد داشبورد) و «پاسخ‌داده‌نشده» آبی. ink رنگ تیره‌تر برای نوشته روی زمینهٔ روشن
const AMBER = "#f5b00a";
const GREEN = "var(--viz-st-delivered)";
const BLUE = "#2a78d6";
const TAB_DEFS = [
  { id: "all", label: "تمام نظرات", noun: "نظر", icon: MessageSquareText, color: "var(--color-brand-600)", ink: "var(--color-brand-700)" },
  { id: "approved", label: "نظرات تأیید شده", noun: "نظر تأیید شده", icon: CircleCheck, color: GREEN, ink: `color-mix(in srgb, ${GREEN} 62%, black)` },
  { id: "pending", label: "نظرات تأیید نشده", noun: "نظر در انتظار تأیید", icon: Clock, color: AMBER, ink: `color-mix(in srgb, ${AMBER} 55%, black)` },
  { id: "unanswered", label: "نظرات پاسخ‌داده‌نشده", noun: "نظر بدون پاسخ", icon: MessageSquareDashed, color: BLUE, ink: `color-mix(in srgb, ${BLUE} 70%, black)` },
];

const EMPTY = {
  all: { icon: MessageSquareDashed, title: "هنوز نظری ثبت نشده", hint: "وقتی مشتریان برای محصولات نظر بگذارند، اینجا برای تأیید و پاسخ نشان داده می‌شود." },
  approved: { icon: MessageSquareText, title: "هنوز نظری تأیید نشده", hint: "نظرهایی که تأیید کنید در صفحهٔ همان محصول به همه نشان داده می‌شوند." },
  pending: { icon: CheckCheck, title: "همهٔ نظرها بررسی شده‌اند", hint: "نظر تازه‌ای در انتظار تأیید نیست." },
  unanswered: { icon: CheckCheck, title: "همهٔ نظرها پاسخ دارند", hint: "نظر تأییدشده‌ای بدون پاسخ مدیر نیست." },
};

const SECONDARY_BUTTON =
  "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-gray-100 px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300";

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

// نظر تأییدشده‌ای که هنوز پاسخ مدیر ندارد (فقط نظر تأییدشده جایی دیده می‌شود تا پاسخ بخواهد)
const isUnanswered = (c) => c.approved && !c.adminReply;

// نظر در هر تب: «همه» همه، «تأیید شده» و «تأیید نشده» طبق وضعیت، «پاسخ‌داده‌نشده» تأییدشده‌های بی‌پاسخ
const inTab = (c, tab) => (tab === "approved" ? c.approved : tab === "pending" ? !c.approved : tab === "unanswered" ? isUnanswered(c) : true);

// اسکلتون لودینگ: همان ساختار فشردهٔ کارت (سربرگ، دو خط متن، ردیف پایین)
function CommentSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80" aria-hidden="true">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-4 w-32 rounded-full bg-gray-200" />
          <div className="h-3 w-24 rounded-full bg-gray-100" />
        </div>
        <div className="ms-auto h-6 w-40 rounded-full bg-gray-100" />
      </div>
      <div className="mt-4 space-y-2 ps-9">
        <div className="h-4 w-full rounded-full bg-gray-100" />
        <div className="h-4 w-2/3 rounded-full bg-gray-100" />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="h-6 w-36 rounded-full bg-gray-100" />
        <div className="h-9 w-24 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

export default function AdminComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");

  const fetchComments = async () => {
    try {
      const { data } = await axios.get("/api/admin/comments", { headers: authHeaders() });
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

  // تأیید، رد و پاسخ فقط درخواست به سرور هستند (تأیید و رد true یا false و پاسخ تغییرِ خودش را برمی‌گرداند)؛ کارت پس از موفقیت، با انیمیشن، تغییر را از طریق patchComment در فهرست می‌نشاند
  const handleApprove = async (id) => {
    try {
      await axios.put("/api/admin/comments", { id, approved: true }, { headers: authHeaders() });
      toast.success("نظر تأیید شد");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || "خطا در تأیید نظر");
      return false;
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put("/api/admin/comments", { id, approved: false }, { headers: authHeaders() });
      toast.success("نظر از حالت تأیید خارج شد");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || "خطا در رد تأیید نظر");
      return false;
    }
  };

  const patchComment = (id, change) => setComments((prev) => prev.map((c) => (c.id === id ? { ...c, ...change } : c)));

  const handleReply = async (id, reply) => {
    try {
      const { data } = await axios.put("/api/admin/comments", { id, adminReply: reply }, { headers: authHeaders() });
      return { adminReply: reply, adminReplyAt: data.comment.adminReplyAt };
    } catch (err) {
      toast.error(err.response?.data?.error || "خطا در ثبت پاسخ");
      throw err;
    }
  };

  // جست‌وجو: واژه‌ها همه باید در نام کاربر، نام محصول، متن نظر یا پاسخ باشند (search.js). شمار تب‌ها و فهرست هر دو از نتیجهٔ جست‌وجو می‌آیند تا عددِ تب همان‌قدر باشد که با کلیک دیده می‌شود
  const terms = useMemo(() => parseTerms(query), [query]);
  const hay = useMemo(() => new Map(comments.map((c) => [c.id, haystack(c)])), [comments]);
  const searched = useMemo(() => (terms.length ? comments.filter((c) => terms.every((t) => (hay.get(c.id) || "").includes(t))) : comments), [comments, terms, hay]);

  const counts = useMemo(() => {
    const out = {};
    for (const t of TAB_DEFS) out[t.id] = searched.filter((c) => inTab(c, t.id)).length;
    return out;
  }, [searched]);

  const filteredComments = searched.filter((c) => inTab(c, activeTab));

  const tabs = TAB_DEFS.map((t) => ({ ...t, count: counts[t.id] }));
  const current = TAB_DEFS.find((t) => t.id === activeTab);

  // حالت خالی: با جست‌وجوی فعال «نظری پیدا نشد» (با دکمهٔ پاک‌کردن و، اگر تب‌های دیگر یافته دارند، دکمهٔ نمایش همه)؛ وگرنه حالت خالی هر تب،
  // و اگر تب دیگری نظر دارد، دکمهٔ رفتن به آن هم می‌آید (از «تأیید شده» به «تأیید نشده» و برعکس؛ از «پاسخ‌داده‌نشده» به «تأیید شده»؛ اگر آن هم خالی بود به «همه»)
  let empty = null;
  if (!loading && filteredComments.length === 0) {
    if (terms.length) {
      empty = (
        <EmptyState
          icon={SearchX}
          title="نظری با این جست‌وجو پیدا نشد"
          hint={activeTab !== "all" && counts.all > 0 ? `در همین تب نظری نیست، ولی ${fa(counts.all)} نظر در همهٔ نظرها با این عبارت هست.` : "عبارت دیگری امتحان کنید یا جست‌وجو را پاک کنید."}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => setQuery("")} className={SECONDARY_BUTTON}>
                <X className="h-[18px] w-[18px]" aria-hidden="true" />
                پاک کردن جست‌وجو
              </button>
              {activeTab !== "all" && counts.all > 0 && (
                <button type="button" onClick={() => setActiveTab("all")} className={SECONDARY_BUTTON}>
                  <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
                  نمایش همهٔ نظرها ({fa(counts.all)})
                </button>
              )}
            </div>
          }
        />
      );
    } else {
      const e = EMPTY[activeTab];
      const sibling = activeTab === "approved" ? "pending" : activeTab === "pending" || activeTab === "unanswered" ? "approved" : null;
      const target = sibling && counts[sibling] > 0 ? TAB_DEFS.find((t) => t.id === sibling) : TAB_DEFS[0];
      empty = (
        <EmptyState
          icon={e.icon}
          title={e.title}
          hint={e.hint}
          action={
            activeTab !== "all" &&
            counts.all > 0 && (
              <button type="button" onClick={() => setActiveTab(target.id)} className={SECONDARY_BUTTON}>
                <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
                نمایش {target.id === "all" ? "همهٔ نظرها" : target.label} ({fa(counts[target.id])})
              </button>
            )
          }
        />
      );
    }
  }

  // از md به بالا سربرگ صفحه (جایگاه ثابت layout)، نوار آمار، تب‌ها و جست‌وجو ثابت می‌مانند و فقط فهرست کارت‌ها اسکرول می‌خورد؛ شست از زیر آن‌ها شروع می‌شود (قاب و ارتفاعش مثل صفحه‌های جدول‌دار: TablePage).
  // md:-ml-2 / md:-mr-4 با md:pl-2 / md:pr-4: سایهٔ کارت‌ها بریده نشود و شست در حاشیهٔ راست main بنشیند، نه روی کارت‌ها. زیر md صفحه مثل قبل اسکرول می‌خورد.
  // کارت‌ها در پهنای کافی (container query ناحیهٔ محتوا، ۵۶rem) دو ستونه‌اند تا چند نظر بدون اسکرول دیده شود؛ کارت‌های هم‌ردیف هم‌قدند (کشیده‌شدن پیش‌فرض شبکه) و ردیف دکمه‌های هر کارت (mt-auto) به لبهٔ پایین می‌چسبد.
  // نوار ابزار مثل صفحهٔ محصولات: جست‌وجو (ExpandSearch، همان گوی جمع‌شونده) در آغاز ردیف (راست) و تب‌های فیلتر در انتهای آن (چپ)
  return (
    <TablePage>
      <PageHeader
        icon={<Icon path={mdiAccountBoxEditOutline} size="22px" />}
        title="مدیریت نظرات کاربران"
        loading={loading}
        subtitleKey={activeTab}
        subtitleColor={activeTab === "all" ? undefined : current.ink}
        subtitle={<><b>{fa(filteredComments.length)}</b> {current.noun} یافت شد</>}
      />

      <CommentStats comments={comments} loading={loading} />

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <ExpandSearch
          label="جستجوی نظرها"
          placeholder="جستجو بر اساس کاربر، محصول یا متن نظر..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery("")}
          phoneFullRow
          className="sm:w-80"
        />
        <SegmentedTabs label="وضعیت نظر" tabs={tabs} value={activeTab} onChange={setActiveTab} loading={loading} idPrefix="comments" panelId="comments-panel" />
      </div>

      <ScrollArea
        id="comments-panel"
        role="tabpanel"
        aria-labelledby={`comments-tab-${activeTab}`}
        aria-busy={loading || undefined}
        className="mt-4 min-h-0 flex-1 md:-ml-2 md:-mr-4"
        innerClassName="md:py-1 md:pl-2 md:pr-4"
      >
        {loading ? (
          <div className="grid gap-3 @4xl:grid-cols-2">
            {[0, 1, 2].map((i) => (
              <CommentSkeleton key={i} />
            ))}
          </div>
        ) : empty ? (
          <ListCard>{empty}</ListCard>
        ) : (
          <div key={activeTab} className="grid gap-3 @4xl:grid-cols-2">
            {filteredComments.map((comment, i) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                index={i}
                activeTab={activeTab}
                terms={terms}
                onApprove={handleApprove}
                onReject={handleReject}
                onReply={handleReply}
                onPatch={patchComment}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </TablePage>
  );
}
