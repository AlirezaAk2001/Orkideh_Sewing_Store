"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import Icon from "@mdi/react";
import { mdiAccountTieOutline } from "@mdi/js";
import { ExternalLink, LogOut, PanelRightClose, PanelRightOpen, Store, X } from "lucide-react";
import BrandMark from "@/app/components/BrandMark";
import { NAV_GROUPS, isActive } from "./nav";

// همهٔ ردیف‌های منو یک قالب دارند: آیکون ۲۰ پیکسلی همیشه در همان جای خودش می‌ماند (با عرض جمع‌شده درست وسط می‌افتد: ۱۲ + ۱۶ پیکسل از لبه)،
// فقط برچسب با کم‌رنگ‌شدن کنار می‌رود و از لبه بریده می‌شود
const ITEM =
  "group relative flex h-11 w-full items-center gap-3 overflow-hidden whitespace-nowrap rounded-xl px-4 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";
const ICON = "grid shrink-0 place-items-center transition-transform duration-200 group-hover:scale-110";

function Label({ collapsed, children }) {
  return <span className={`truncate transition-opacity duration-200 ${collapsed ? "opacity-0" : "opacity-100"}`}>{children}</span>;
}

// محتوای منو؛ هم در ستون ثابت دسکتاپ و هم در کشوی موبایل. busy = داشبورد در حال گرفتن داده است و رفتن به جای دیگر بسته می‌ماند
function SidebarBody({ collapsed, busy, pathname, onLogout, onNavigate, onToggleCollapsed, onClose }) {
  const lock = busy ? "pointer-events-none opacity-50" : "";
  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-3 ps-[1.125rem] pe-3">
        <Link
          href={busy ? "#" : "/admin"}
          onClick={onNavigate}
          aria-label="فروشگاه چرخ خیاطی ارکیده، پنل مدیریت؛ رفتن به داشبورد"
          tabIndex={busy ? -1 : undefined}
          className={`flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${lock}`}
        >
          <BrandMark />
          <span className={`min-w-0 whitespace-nowrap transition-opacity duration-200 ${collapsed ? "opacity-0" : "opacity-100"}`}>
            <span className="block text-[13px] font-extrabold leading-5 text-gray-900">فروشگاه چرخ خیاطی ارکیده</span>
            <span className="block text-xs leading-5 text-gray-500">پنل مدیریت</span>
          </span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن منو"
            className="ms-auto grid h-10 w-10 cursor-pointer place-items-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label="منوی پنل مدیریت" className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-2">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.label &&
              (collapsed ? (
                <hr className="mx-4 my-3 border-gray-200" />
              ) : (
                <p className="px-4 pb-1.5 pt-5 text-[11px] font-bold text-gray-400">{group.label}</p>
              ))}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item, pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={busy ? "#" : item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      aria-disabled={busy || undefined}
                      tabIndex={busy ? -1 : undefined}
                      className={`${ITEM} ${lock} ${active ? "bg-brand-50 font-semibold text-brand-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute inset-y-2.5 start-0 w-1 origin-center rounded-full bg-brand-600 transition-transform duration-300 ${active ? "scale-y-100" : "scale-y-0"}`}
                      />
                      <span className={ICON}>{item.icon}</span>
                      <Label collapsed={collapsed}>{item.label}</Label>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-gray-200 p-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? "مشاهدهٔ فروشگاه" : undefined}
          className={`${ITEM} text-gray-600 hover:bg-gray-100 hover:text-gray-900`}
        >
          <span className={ICON}>
            <Store className="h-5 w-5" aria-hidden="true" />
          </span>
          <Label collapsed={collapsed}>مشاهدهٔ فروشگاه</Label>
          <ExternalLink className={`ms-auto h-3.5 w-3.5 shrink-0 text-gray-400 transition-opacity duration-200 ${collapsed ? "opacity-0" : "opacity-100"}`} aria-hidden="true" />
        </Link>

        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            disabled={busy}
            aria-expanded={!collapsed}
            title={collapsed ? "باز کردن منو" : "بستن منو"}
            className={`${ITEM} cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-wait ${lock}`}
          >
            <span className={ICON}>
              {collapsed ? <PanelRightOpen className="h-5 w-5" aria-hidden="true" /> : <PanelRightClose className="h-5 w-5" aria-hidden="true" />}
            </span>
            <Label collapsed={collapsed}>{collapsed ? "باز کردن منو" : "جمع کردن منو"}</Label>
          </button>
        )}

        <div className="flex h-14 items-center gap-3 overflow-hidden px-2" title={collapsed ? "مدیر فروشگاه" : undefined}>
          <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-100">
            <Icon path={mdiAccountTieOutline} size="20px" />
          </span>
          <span className={`min-w-0 whitespace-nowrap text-sm font-semibold text-gray-900 transition-opacity duration-200 ${collapsed ? "opacity-0" : "opacity-100"}`}>
            مدیر فروشگاه
          </span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          disabled={busy}
          title={collapsed ? "خروج از حساب" : undefined}
          className={`${ITEM} cursor-pointer text-red-600 hover:bg-red-50 disabled:cursor-wait ${lock}`}
        >
          <span className={ICON}>
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </span>
          <Label collapsed={collapsed}>خروج از حساب</Label>
        </button>
      </div>
    </>
  );
}

// ستون ثابت دسکتاپ (از lg به بالا)؛ جمع‌شده ۷۶ پیکسل و بازشده ۲۵۶ پیکسل
export function DesktopSidebar({ collapsed, ...props }) {
  return (
    <aside
      className={`relative z-20 hidden shrink-0 flex-col overflow-hidden border-e border-gray-200 bg-white transition-[width] duration-300 ease-in-out lg:flex ${collapsed ? "w-[4.75rem]" : "w-64"}`}
    >
      <SidebarBody collapsed={collapsed} {...props} />
    </aside>
  );
}

// کشوی موبایل (زیر lg): از سمت شروع (راست) می‌لغزد؛ Esc یا کلیک روی پس‌زمینه می‌بندد و فوکوس به دکمهٔ منو برمی‌گردد. هنگام بسته‌بودن inert است
// تا با Tab به آیتم‌های نامرئی‌اش نرسند
export function MobileDrawer({ open, onClose, returnFocusRef, ...props }) {
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return;
    const returnTo = returnFocusRef?.current;
    panel.current?.querySelector('button[aria-label="بستن منو"]')?.focus();
    return () => returnTo?.focus();
  }, [open, returnFocusRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div id="admin-drawer" inert={!open} className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`}>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 bg-gray-900/45 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="منوی پنل مدیریت"
        className={`absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <SidebarBody collapsed={false} onClose={onClose} onNavigate={onClose} {...props} />
      </aside>
    </div>
  );
}
