"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import Tip from "./Tip";

// دکمهٔ گردِ آیکونی ردیف (ویرایش، حذف): خاکستری، با هاور رنگی و راهنما. href بدهید لینک می‌شود، وگرنه دکمه. برچسب هم راهنماست هم aria-label
const TONES = {
  edit: "hover:bg-brand-50 hover:text-brand-700 focus-visible:ring-brand-300",
  danger: "hover:bg-red-50 hover:text-red-600 focus-visible:ring-red-300",
};

export function IconAction({ label, href, onClick, tone = "edit", children }) {
  const cls = `icon-action grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl text-gray-500 transition-colors focus-visible:outline-none focus-visible:ring-2 ${TONES[tone]}`;
  return (
    <Tip title={label}>
      {href ? (
        <Link href={href} aria-label={label} className={cls}>
          {children}
        </Link>
      ) : (
        <button type="button" aria-label={label} onClick={onClick} className={cls}>
          {children}
        </button>
      )}
    </Tip>
  );
}

// جفت آماده‌ی ویرایش و حذف که هر سه صفحهٔ لیست یک‌جور می‌خواهند
export function RowActions({ editHref, editLabel, onDelete, deleteLabel }) {
  return (
    <div className="flex items-center gap-1">
      <IconAction label={editLabel} href={editHref}>
        <Pencil className="icon-write h-[18px] w-[18px]" aria-hidden="true" />
      </IconAction>
      <IconAction label={deleteLabel} onClick={onDelete} tone="danger">
        <Trash2 className="icon-trash h-[18px] w-[18px]" aria-hidden="true" />
      </IconAction>
    </div>
  );
}
