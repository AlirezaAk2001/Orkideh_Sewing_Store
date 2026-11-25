"use client";

import { useMemo } from "react";
import { Reply, Star } from "lucide-react";
import { useCountUp } from "@/app/admin/_ui/useCountUp";
import ValueBar from "@/app/admin/_ui/ValueBar";

const fa = (n) => Number(n).toLocaleString("fa-IR");
const fa1 = (n) => Number(n).toLocaleString("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const TILE = "admin-row-in flex min-h-[6.5rem] flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200/80 transition-shadow hover:shadow-md";
const ICON = "relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1";

// نوار آمار بالای صفحهٔ نظرها: دو کاشی از داده‌های واقعی همین فهرست (نه تخمین): میانگین امتیاز با توزیع ستاره‌ها، و درصد نظرهای تأییدشده‌ای که پاسخ مدیر دارند
// (درصد وسط خود نوار). شمار نظرهای در انتظار تأیید و بی‌پاسخ کاشی ندارند و همان‌ها چیپ شمار تب‌های «تأیید نشده» و «پاسخ‌داده‌نشده»‌اند.
// عددها هنگام ورود از صفر می‌شمارند و با تأیید یا پاسخ جدید از مقدار فعلی به مقدار تازه می‌روند (useCountUp و ValueBar).
// میانگین و توزیع روی همهٔ نظرهای دارای امتیاز است، پاسخ‌دهی فقط روی نظرهای تأییدشده (نظر تأییدنشده هنوز جایی دیده نمی‌شود تا پاسخ بخواهد).
// روی پنجرهٔ کوتاه (کمتر از ۴۳٫۷۵rem) نوار پنهان می‌شود تا جای فهرست را نخورد؛ ستون‌ها با container query ناحیهٔ محتوا هستند (۱ تا ۲، دو ستون از ۴۸rem)
export default function CommentStats({ comments, loading }) {
  const stats = useMemo(() => {
    const rated = comments.filter((c) => Number(c.rating) > 0);
    const avg = rated.length ? rated.reduce((sum, c) => sum + Number(c.rating), 0) / rated.length : 0;
    const dist = [5, 4, 3, 2, 1].map((star) => ({ star, n: rated.filter((c) => Math.round(Number(c.rating)) === star).length }));
    const approved = comments.filter((c) => c.approved).length;
    const answered = comments.filter((c) => c.approved && c.adminReply).length;
    const pct = approved ? Math.round((answered / approved) * 100) : 0;
    return { rated: rated.length, avg, dist, approved, answered, pct };
  }, [comments]);

  const avgLive = useCountUp(stats.avg * 10, { run: !loading, duration: 900, delay: 150 }) / 10;

  if (loading) {
    return (
      <div className="mb-3 grid shrink-0 gap-3 @3xl:grid-cols-2 [@media(max-height:43.75rem)]:hidden" aria-hidden="true">
        {[0, 1].map((i) => (
          <div key={i} className="min-h-[6.5rem] animate-pulse rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200/80">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gray-200" />
              <div className="space-y-2">
                <div className="h-3 w-24 rounded-full bg-gray-100" />
                <div className="h-6 w-16 rounded-full bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const maxDist = Math.max(1, ...stats.dist.map((d) => d.n));

  return (
    <section aria-label="آمار نظرها" className="mb-3 grid shrink-0 gap-3 @3xl:grid-cols-2 [@media(max-height:43.75rem)]:hidden">
      <div className={TILE} style={{ animationDelay: "0ms" }}>
        <div className="flex items-center gap-3">
          <span className={`${ICON} bg-amber-50 text-amber-500 ring-amber-200`}>
            <Star className="h-6 w-6 fill-current" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold text-gray-500">میانگین امتیاز</p>
            <p className="flex items-baseline gap-1 leading-9">
              <span className="text-3xl font-extrabold tabular-nums text-gray-900">{stats.rated ? fa1(avgLive) : "—"}</span>
              {stats.rated > 0 && <span className="text-xs text-gray-400">از {fa(5)}</span>}
            </p>
            <p className="text-[11px] leading-5 text-gray-400">{stats.rated ? `بر پایهٔ ${fa(stats.rated)} نظر` : "هنوز امتیازی ثبت نشده"}</p>
          </div>
        </div>
        <ul className="grid min-w-[8.5rem] flex-1 gap-1" aria-label="توزیع امتیازها">
          {stats.dist.map(({ star, n }, i) => (
            <li key={star} className="grid grid-cols-[1.5rem_1fr_1.5rem] items-center gap-2 text-[11px] tabular-nums text-gray-500">
              <span className="flex items-center gap-0.5 font-semibold">
                {fa(star)}
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              </span>
              <span className="cm-bar" aria-hidden="true">
                <i style={{ "--w": `${(n / maxDist) * 100}%`, "--c": "var(--color-amber-400)", "--d": `${300 + i * 70}ms` }} />
              </span>
              <span className="text-end">{fa(n)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={TILE} style={{ animationDelay: "70ms" }}>
        <span className={`${ICON} bg-brand-50 text-brand-600 ring-brand-200`}>
          <Reply className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-gray-500">پاسخ‌دهی به نظرها</p>
          {/* درصد وسط خود نوار می‌نشیند (همان نوار «درصد داخل نوار» داشبورد و لیست محصولات)؛ بدون نظر تأییدشده درصدی نیست و نوار خالی با خط تیره می‌ماند */}
          {stats.approved > 0 ? (
            <ValueBar value={stats.pct} tone="brand" size="lg" delay={220} label="درصد نظرهای تأییدشدهٔ پاسخ‌داده‌شده" className="mt-1.5" />
          ) : (
            <ValueBar value={0} text="—" tone="brand" size="lg" label="درصد نظرهای تأییدشدهٔ پاسخ‌داده‌شده" className="mt-1.5" />
          )}
          <p className="mt-1.5 text-[11px] leading-5 text-gray-400">{stats.approved ? `${fa(stats.answered)} از ${fa(stats.approved)} نظر تأییدشده پاسخ دارد` : "هنوز نظر تأییدشده‌ای نیست"}</p>
        </div>
      </div>
    </section>
  );
}
