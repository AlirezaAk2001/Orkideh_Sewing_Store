import Link from "next/link";
import { Plus } from "lucide-react";

// دکمهٔ اصلی «افزودن …» در سربرگ صفحه؛ تا رسیدن اولین پاسخ جایش را یک نوار اسکلتون هم‌اندازه می‌گیرد تا سربرگ نپرد
export default function AddButton({ href, label, loading = false }) {
  if (loading) return <span className="block h-10 w-36 animate-pulse rounded-xl bg-gray-200" aria-hidden="true" />;
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 active:translate-y-px"
    >
      <Plus className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden="true" />
      {label}
    </Link>
  );
}
