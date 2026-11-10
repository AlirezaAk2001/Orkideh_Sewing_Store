"use client";

import Link from "next/link";
import { Loader2, Save } from "lucide-react";

// نوار ذخیرهٔ چسبان پایین فرم‌ها: همیشه در دسترس است (حتی وسط فرم بلند محصول). سمت شروع وضعیت را می‌گوید (چه چیزی لازم است، تغییر ذخیره‌نشده، آپلود در جریان)،
// سمت پایان «انصراف» (برگشت به فهرست، بدون ذخیره) و دکمهٔ اصلی. tone: "ready" سبز، "dirty" کهربایی، "idle" خاکستری. وقتی disabled است، status دلیلش را می‌گوید.
// داخل <form> قرار می‌گیرد، پس دکمهٔ ذخیره type=submit است و همان handleSubmit صفحه کار می‌کند
const DOT = { ready: "bg-emerald-500", dirty: "bg-amber-500", idle: "bg-gray-300" };

export default function SaveBar({ saving = false, disabled = false, label, backHref, status, tone = "idle" }) {
  return (
    <div className="sticky bottom-0 z-20 mt-5">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-[0_14px_34px_-14px_rgb(0_0_0/0.3)] ring-1 ring-gray-200 backdrop-blur-sm">
        <p role="status" aria-live="polite" className="flex min-w-0 flex-1 basis-48 items-center gap-2 text-sm text-gray-600">
          <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[tone]}`} />
          <span className="min-w-0">{status}</span>
        </p>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Link
            href={backHref}
            className="btn-lift inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 sm:flex-none"
          >
            انصراف
          </Link>
          <button
            type="submit"
            disabled={disabled || saving}
            aria-busy={saving || undefined}
            className="inline-flex h-11 flex-[2] cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none sm:min-w-40 sm:flex-none"
          >
            {saving ? (
              <>
                <Loader2 className="h-[18px] w-[18px] animate-spin motion-reduce:animate-none" aria-hidden="true" />
                در حال ذخیره...
              </>
            ) : (
              <>
                <Save className="h-[18px] w-[18px]" aria-hidden="true" />
                {label}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
