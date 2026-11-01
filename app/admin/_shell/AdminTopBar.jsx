"use client";

import Link from "next/link";
import { Menu, Store } from "lucide-react";
import BrandMark from "@/app/components/BrandMark";

// نوار بالای موبایل و تبلت (زیر lg): دکمهٔ منو، نشان و نام بخش فعلی، میان‌بر فروشگاه. در دسکتاپ منوی کناری جایش را می‌گیرد
export default function AdminTopBar({ title, onOpenMenu, menuRef, drawerOpen }) {
  return (
    <div className="relative z-20 flex h-14 shrink-0 items-center gap-2.5 border-b border-gray-200 bg-white/90 px-3 backdrop-blur lg:hidden">
      <button
        ref={menuRef}
        type="button"
        onClick={onOpenMenu}
        aria-label="باز کردن منو"
        aria-expanded={drawerOpen}
        aria-controls="admin-drawer"
        className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      <BrandMark className="h-8 w-8" px={32} />
      <p className="min-w-0 flex-1 truncate text-base font-bold text-gray-900">{title}</p>
      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="مشاهدهٔ فروشگاه"
        title="مشاهدهٔ فروشگاه"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-gray-600 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <Store className="h-5 w-5" aria-hidden="true" />
      </Link>
    </div>
  );
}
