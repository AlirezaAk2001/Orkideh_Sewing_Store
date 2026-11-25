"use client";

import Link from "next/link";
import ScrollArea from "@/app/components/ScrollArea";
import { useEffect, useRef } from "react";
import Icon from "@mdi/react";
import { mdiAccountTieOutline } from "@mdi/js";
import { ExternalLink, LogOut, PanelRightClose, PanelRightOpen, Store, X } from "lucide-react";
import BrandMark from "@/app/components/BrandMark";
import useSlidePill from "@/app/components/useSlidePill";
import { tip } from "@/lib/tip";
import { NAV_GROUPS, findNavItem, isActive } from "./nav";
import "./shell.css";

const fa = (n) => Number(n).toLocaleString("fa-IR");
// ترتیب آیتم‌ها در منو (برای تأخیر ورود پلکانی)
const ORDER = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href));

// همهٔ ردیف‌های منو یک قالب دارند: آیکون ۲۰ پیکسلی همیشه در همان جای خودش می‌ماند (با عرض جمع‌شده درست وسط می‌افتد: ۱۲ + ۱۶ پیکسل از لبه)،
// فقط برچسب با کم‌رنگ‌شدن کنار می‌رود و از لبه بریده می‌شود
const ITEM =
  "btn-flat group relative flex h-11 w-full items-center gap-3 overflow-hidden whitespace-nowrap rounded-xl px-4 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";
const ICON = "grid shrink-0 place-items-center transition-transform duration-200 group-hover:scale-110";
// راهنمای آیتم‌ها فقط در حالت جمع‌شده است (برچسب دیده نمی‌شود): بالای آیکون و به‌اندازهٔ عرض خود سایدبار (کلاس app-tip--rail در globals.css)، تا روی کارت‌های کنار پنل نیفتد.
// در حالت باز راهنما نیست چون نام هر آیتم روی خودش نوشته شده
const railTip = (collapsed, text) => tip(collapsed ? text : undefined, "top", 6, "app-tip--rail");

function Label({ collapsed, children }) {
  return <span className={`truncate transition-opacity duration-200 ${collapsed ? "opacity-0" : "opacity-100"}`}>{children}</span>;
}

// محتوای منو؛ هم در ستون ثابت دسکتاپ و هم در کشوی موبایل. busy = داشبورد در حال گرفتن داده است و رفتن به جای دیگر بسته می‌ماند
function SidebarBody({ collapsed, busy, pathname, counts, onLogout, onNavigate, onToggleCollapsed, onClose }) {
  const lock = busy ? "pointer-events-none opacity-50" : "";
  // قرص لغزان زیر آیتم فعال (shell.css و useSlidePill)؛ با رفتن به بخش دیگر از جای قبلی به جای تازه می‌لغزد
  const navBox = useRef(null);
  const navPill = useRef(null);
  useSlidePill(navBox, navPill, findNavItem(pathname)?.href);
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

      <ScrollArea as="nav" aria-label="منوی پنل مدیریت" className="min-h-0 flex-1" innerClassName="overflow-x-hidden px-3 pb-2">
        {/* adm-nav: ظرف نسبی که قرص لغزان (آخرین فرزندش) در آن می‌نشیند */}
        <div ref={navBox} className="adm-nav">
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
                  // هر ردیف یک نشان دارد: شمارندهٔ منتظر-شما (رنگی) اگر صفر نباشد، وگرنه تعداد کل بخش (خاکستری، صفر هم نشان داده می‌شود). تا پاسخ نیامده نشانی نیست
                  const waiting = item.badge ? counts?.[item.badge.key] ?? 0 : 0;
                  const total = item.total ? counts?.[item.total.key] : undefined;
                  const badge = waiting > 0 ? { n: waiting, tone: item.badge.tone, text: item.badge.text, max: 99 } : typeof total === "number" ? { n: total, tone: "gray", text: item.total.text, max: 999 } : null;
                  return (
                    <li key={item.href} className="adm-item-in" style={{ animationDelay: `${ORDER.indexOf(item.href) * 45}ms` }}>
                      <Link
                        href={busy ? "#" : item.href}
                        onClick={onNavigate}
                        {...railTip(collapsed, item.label)}
                        aria-current={active ? "page" : undefined}
                        aria-disabled={busy || undefined}
                        tabIndex={busy ? -1 : undefined}
                        className={`adm-item ${ITEM} ${lock} ${active ? "bg-brand-50 font-semibold text-brand-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`adm-bar absolute inset-y-2.5 start-0 w-1 origin-center rounded-full bg-brand-600 transition-transform duration-300 ${active ? "scale-y-100" : "scale-y-0"}`}
                        />
                        <span className={ICON}>{item.icon}</span>
                        <Label collapsed={collapsed}>{item.label}</Label>
                        {badge && (
                          <span key={`${badge.tone}${badge.n}`} className="adm-badge" data-tone={badge.tone} data-collapsed={collapsed ? "" : undefined} role="img" aria-label={`${fa(badge.n)} ${badge.text}`}>
                            {badge.n > badge.max ? `${fa(badge.max)}+` : fa(badge.n)}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <i ref={navPill} className="adm-pill" aria-hidden="true" />
        </div>
      </ScrollArea>

      <div className="shrink-0 space-y-1 border-t border-gray-200 p-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          {...railTip(collapsed, "مشاهدهٔ فروشگاه")}
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
            {...railTip(collapsed, "باز کردن منو")}
            className={`${ITEM} cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-wait ${lock}`}
          >
            <span className={ICON}>
              {collapsed ? <PanelRightOpen className="h-5 w-5" aria-hidden="true" /> : <PanelRightClose className="h-5 w-5" aria-hidden="true" />}
            </span>
            <Label collapsed={collapsed}>{collapsed ? "باز کردن منو" : "جمع کردن منو"}</Label>
          </button>
        )}

        <div className="flex h-14 items-center gap-3 overflow-hidden px-2" {...railTip(collapsed, "مدیر فروشگاه")}>
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
          {...railTip(collapsed, "خروج از حساب")}
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

// ستون دسکتاپ (از lg به بالا)؛ جمع‌شده ۷۶ پیکسل و بازشده ۲۵۶ پیکسل. به‌جای چسبیدن به لبه، یک پنل شیشه‌ای گرد است که ۱۲ پیکسل از لبه‌های بالا و پایین و شروع (راست)
// فاصله دارد (shell.css: .adm-dock؛ همان ظاهر دوک پروفایل). لفاف بیرونی فقط این فاصله را می‌دهد و با عرض پنل جمع و باز می‌شود. سمت محتوا فاصله از padding خود main است
export function DesktopSidebar({ collapsed, ...props }) {
  return (
    <div className="relative z-20 hidden shrink-0 py-3 ps-3 lg:flex">
      <aside className={`adm-dock flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out ${collapsed ? "w-[4.75rem]" : "w-64"}`}>
        <SidebarBody collapsed={collapsed} {...props} />
      </aside>
    </div>
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
        className={`absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col bg-gradient-to-b from-brand-50/70 via-white to-white shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <SidebarBody collapsed={false} onClose={onClose} onNavigate={onClose} {...props} />
      </aside>
    </div>
  );
}
