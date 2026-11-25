"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Hourglass, History, MapPin, Mailbox, PackageCheck, Phone, ShoppingBag, Truck, Undo2, X } from "lucide-react";
import Highlight from "@/app/admin/_list/Highlight";
import StatusChip from "@/app/admin/_list/StatusChip";
import Thumb from "@/app/admin/_list/Thumb";
import Chip from "@/app/admin/_list/Chip";
import { ORDER_STATUS, statusTint } from "@/app/admin/_list/orderStatus";
import { normalize } from "@/app/admin/_list/search";
import { getImagePath } from "@/app/utils/getImagePath";
import { formatAddress } from "@/lib/addressFormat";
import { prefersReducedMotion } from "@/lib/motion";
import { tip } from "@/lib/tip";
import CopyButton from "./CopyButton";
import OrderTimeline from "./OrderTimeline";
import { agoText, daysAgo, fa, faDate, faDigits, faTime } from "./format";

const VISIBLE_ITEMS = 2; // بیشتر از این، بقیه پشت «نمایش … قلم دیگر» جمع می‌شود (کارت کوتاه بماند تا دکمه‌های پایینش بی‌اسکرول دیده شوند)
const ASK_MS = 6000; // مهلت تأیید دوم؛ بعد از آن دکمه‌ها به حالت اول برمی‌گردند
const ARM_MS = 600; // دکمهٔ تأیید تا این مدت کلیک نمی‌گیرد، تا دابل‌کلیک یا نگه‌داشتن Enter روی دکمهٔ اول بی‌خواست ثبت نکند

// دو کار روی سفارش جاری: متن دکمهٔ اول، متن تأیید دوم و رنگ‌ها
const ACTIONS = {
  delivered: {
    label: "تحویل داده شد",
    confirm: "بله، تحویل داده شد",
    hint: "ثبت تحویل سفارش به مشتری",
    icon: PackageCheck,
    // bar-sheen: برق هاور دکمه، همان برق دکمه‌های اصلی سایت (globals.css)
    first: "bar-sheen bg-emerald-700 text-white shadow-sm shadow-emerald-700/25 hover:bg-emerald-800 focus-visible:ring-emerald-400 focus-visible:ring-offset-2",
    second: "bar-sheen bg-emerald-700 hover:bg-emerald-800 focus-visible:ring-emerald-400",
  },
  returned: {
    label: "مرجوع شد",
    confirm: "بله، مرجوع شد",
    hint: "ثبت مرجوعی سفارش",
    icon: Undo2,
    first: "bg-white text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50 focus-visible:ring-red-300",
    second: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-400",
  },
};

const BUTTON = "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

// دکمه‌های وضعیت با تأیید دومرحله‌ای (ثبت تحویل یا مرجوعی در پنل برگشت ندارد): کلیک اول دکمه‌ها را با «مطمئنید؟»، دکمهٔ تأیید و «انصراف» عوض می‌کند و فوکوس به تأیید می‌رود؛
// فقط کلیک دوم درخواست را می‌فرستد. با «انصراف»، Esc یا گذشت مهلت (نوار باریک زیر دکمهٔ تأیید خالی می‌شود) برمی‌گردد. busy = درخواست در راه، locked = ثبت شده و کارت دارد می‌رود
function StatusActions({ busy, locked, onConfirm }) {
  const [asking, setAsking] = useState(null); // { id, at }: کاری که منتظر تأیید دوم است و لحظهٔ کلیک اول (event.timeStamp)
  const rootRef = useRef(null);
  const confirmRef = useRef(null);
  const back = useRef(""); // دکمه‌ای که پس از برگشت باید دوباره فوکوس بگیرد

  // برگشت به دو دکمهٔ اول؛ فوکوس فقط وقتی برمی‌گردد که هنوز داخل همین دکمه‌ها باشد (مهلتِ تمام‌شده فوکوس را از جای دیگر نمی‌کشد)
  const cancel = () => {
    if (rootRef.current?.contains(document.activeElement)) back.current = asking?.id ?? "";
    setAsking(null);
  };
  const confirm = async (event) => {
    if (busy || !asking || event.timeStamp - asking.at < ARM_MS) return;
    const ok = await onConfirm(asking.id);
    if (!ok) cancel();
  };

  useEffect(() => {
    if (!asking || busy || locked) return undefined;
    const timer = setTimeout(() => {
      if (rootRef.current?.contains(document.activeElement)) back.current = asking.id;
      setAsking(null);
    }, ASK_MS);
    return () => clearTimeout(timer);
  }, [asking, busy, locked]);

  useEffect(() => {
    if (asking) confirmRef.current?.focus({ preventScroll: true });
    else if (back.current) {
      rootRef.current?.querySelector(`[data-act="${back.current}"]`)?.focus({ preventScroll: true });
      back.current = "";
    }
  }, [asking]);

  const pending = asking && !locked ? ACTIONS[asking.id] : null;
  const ConfirmIcon = pending?.icon;

  return (
    <div ref={rootRef} className="flex min-h-9 flex-wrap items-center gap-2">
      {pending ? (
        <div
          key={asking.id}
          role="group"
          aria-label={pending.hint}
          className="od-ask flex flex-wrap items-center gap-2"
          onKeyDown={(e) => {
            if (e.key !== "Escape" || busy) return;
            e.preventDefault();
            cancel();
          }}
        >
          <span className="text-[13px] font-bold text-gray-700">مطمئنید؟</span>
          <button ref={confirmRef} type="button" onClick={confirm} disabled={!!busy} className={`${BUTTON} relative overflow-hidden text-white shadow-sm focus-visible:ring-offset-2 ${pending.second}`}>
            {busy ? (
              <span aria-hidden="true" className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-white border-t-transparent motion-reduce:animate-none" />
            ) : (
              <ConfirmIcon className="h-[18px] w-[18px]" aria-hidden="true" />
            )}
            {pending.confirm}
            {!busy && <span aria-hidden="true" className="od-timer" style={{ animationDuration: `${ASK_MS}ms` }} />}
          </button>
          <button type="button" onClick={cancel} disabled={!!busy} className={`${BUTTON} bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-400`}>
            <X className="h-[18px] w-[18px]" aria-hidden="true" />
            انصراف
          </button>
        </div>
      ) : (
        Object.entries(ACTIONS).map(([id, action]) => {
          const Glyph = action.icon;
          return (
            <button key={id} type="button" data-act={id} disabled={locked} onClick={(event) => setAsking({ id, at: event.timeStamp })} {...tip(action.hint)} className={`${BUTTON} ${action.first}`}>
              <Glyph className="h-[18px] w-[18px]" aria-hidden="true" />
              {action.label}
            </button>
          );
        })
      )}
    </div>
  );
}

// سن سفارش‌های باز: جاری‌ها «… در انتظار» (تا دیروز خاکستری، ۲ و ۳ روز کهربایی، از ۴ روز قرمز با نقطهٔ تپنده)؛ پرداخت‌نشده‌ها فقط «… پیش»
function AgeChip({ order }) {
  if (order.status !== "processing" && order.status !== "pending") return null;
  const days = daysAgo(order.createdAt);
  if (order.status === "pending") return <Chip tone="gray">{agoText(days)}</Chip>;
  const tone = days >= 4 ? "red" : days >= 2 ? "amber" : "gray";
  return (
    <Chip tone={tone}>
      {days >= 4 && <span aria-hidden="true" className="beat-dot h-1.5 w-1.5 rounded-full bg-red-500" />}
      {days === 0 ? "ثبت امروز" : days === 1 ? "از دیروز در انتظار" : `${fa(days)} روز در انتظار`}
    </Chip>
  );
}

// یک سطر اطلاعات ارسال (یک‌خطی): کاشی آیکون، برچسب کم‌رنگ، مقدار و (اختیاری) دکمهٔ کپی
function Info({ icon: Glyph, label, copy, what, children, className = "" }) {
  return (
    <div className={`od-info flex min-w-0 items-center gap-2 rounded-lg p-0.5 ${className}`}>
      <span className="od-info-ic grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-500">
        <Glyph className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <dt className="shrink-0 text-xs text-gray-400">{label}:</dt>
      <dd className="min-w-0 flex-1 break-words text-[13px] font-medium leading-5 text-gray-800">{children}</dd>
      {copy && (
        <dd className="shrink-0">
          <CopyButton value={copy} what={what} />
        </dd>
      )}
    </div>
  );
}

function Item({ item, terms }) {
  const name = item.Product?.name ?? "کالای حذف‌شده";
  const image = item.Product?.image;
  return (
    <li className="flex items-center gap-2.5 py-1">
      <Thumb src={image ? getImagePath(image) : ""} className="h-9 w-9" sizes="36px" />
      <div className="min-w-0 flex-1">
        {/* نام بلند یک‌خطی می‌ماند و کاملش در راهنماست */}
        <p {...tip(name)} className="truncate text-[13px] font-semibold leading-5 text-gray-800">
          <Highlight text={name} terms={terms} />
        </p>
        <p className="text-[11px] leading-4 text-gray-500">
          <span className="font-bold tabular-nums text-gray-700">{fa(item.quantity)}</span> × {fa(item.price)} تومان
        </p>
      </div>
      <p className="shrink-0 text-[13px] font-bold tabular-nums text-gray-800">
        {fa(item.quantity * item.price)} <span className="text-[11px] font-medium text-gray-400">تومان</span>
      </p>
    </li>
  );
}

// کارت یک سفارش (استایل od- در orders.css؛ --od-c رنگ وضعیت): نوار رنگی لبهٔ شروع، سربرگ (کاشی شماره، نام کاربر و تاریخ، سن سفارش و چیپ وضعیت)، خط زمان،
// اطلاعات ارسال با دکمه‌های کپی (و «کپی اطلاعات ارسال» برای برچسب بسته)، اقلام با تصویر (بیش از ۲ قلم جمع می‌شود)، و پایین کارت جمع مبلغ و دکمه‌های وضعیت.
// کارت فشرده است (حدود ۳۹۰ پیکسل با یک قلم) تا ردیف اول فهرست با دکمه‌هایش بی‌اسکرول دیده شود. کارت پهن (از ۵۶rem، مثل کارت تنهای آخرِ یک روز که دو ستون را می‌گیرد)
// اطلاعات ارسال و اقلام را کنار هم می‌گذارد.
// تغییر وضعیت: اول درخواست به سرور (onStatus فقط true یا false)، و اگر موفق بود مُهر «تحویل داده شد» یا «مرجوع شد» روی کارت می‌خورد، رنگ و خط زمان همان‌جا عوض می‌شود،
// کارت محو می‌شود (comment-dissolve) و بعد تغییر در فهرست می‌نشیند (onPatch)؛ با «کاهش حرکت» فوری.
// terms = واژه‌های جست‌وجو برای رنگ‌کردن یافته‌ها
export default function OrderCard({ order, index, terms, onStatus, onPatch }) {
  const [busy, setBusy] = useState(""); // وضعیتی که درخواستش در راه است
  const [stamp, setStamp] = useState(""); // وضعیت تازهٔ تأییدشده که مُهرش روی کارت است
  const [leaving, setLeaving] = useState(false);
  const [open, setOpen] = useState(false);
  const foldId = useId();

  const status = stamp || order.status;
  const meta = ORDER_STATUS[status];
  const name = order.User?.username || "کاربر ناشناس";
  const number = order.userOrderNumber || 1;
  const items = order.OrderItems || [];
  const head = items.slice(0, VISIBLE_ITEMS);
  const rest = items.slice(VISIBLE_ITEMS);
  // یافتهٔ جست‌وجو در کالای پنهان، فهرست را باز می‌کند
  const foundInRest = terms.length > 0 && rest.some((item) => terms.some((t) => normalize(item.Product?.name).includes(t)));
  const showRest = open || foundInRest;

  const phone = order.phoneNumber || "";
  const address = formatAddress(order.Address);
  const postal = order.Address?.postalCode || "";
  const shipping = order.shippingMethod ?? null; // سفارش‌های قبل از قابلیت ارسال روشی ندارند
  const parcel = [`کاربر: ${name}`, phone && `شماره تماس: ${phone}`, address && `نشانی: ${address}`, postal && `کد پستی: ${postal}`, shipping && `شیوهٔ ارسال: ${shipping}`].filter(Boolean).join("\n");

  const change = async (next) => {
    if (busy || stamp) return false;
    setBusy(next);
    const ok = await onStatus(order.id, next);
    setBusy("");
    if (!ok) return false;
    const patch = { status: next, updatedAt: new Date().toISOString() };
    if (prefersReducedMotion()) {
      onPatch(order.id, patch);
      return true;
    }
    setStamp(next);
    setTimeout(() => setLeaving(true), 1100);
    setTimeout(() => onPatch(order.id, patch), 1660);
    return true;
  };

  const StampIcon = stamp === "returned" ? Undo2 : PackageCheck;

  return (
    <article className={`od-card admin-row-in @container ${leaving ? "comment-dissolve" : ""}`} style={{ "--od-c": meta?.color, animationDelay: `${Math.min(index, 10) * 45}ms` }}>
      <span aria-hidden="true" className="od-rail" />
      {stamp && (
        <div aria-hidden="true" className="od-stamp">
          <span>
            <StampIcon className="h-7 w-7" />
            {stamp === "returned" ? "مرجوع شد" : "تحویل داده شد"}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2.5 p-3.5 ps-[18px] sm:p-4 sm:ps-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="od-num grid h-10 min-w-10 shrink-0 place-items-center rounded-xl px-2 text-[13px] font-extrabold tabular-nums" style={meta ? statusTint(meta) : undefined} aria-hidden="true">
              #{fa(number)}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-extrabold leading-6 text-gray-900">
                سفارش {fa(number)} — <Highlight text={name} terms={terms} />
              </h3>
              <p className="text-[11px] leading-4 text-gray-400">
                {faDate(order.createdAt)}، ساعت {faTime(order.createdAt)} | شناسه <Highlight text={fa(order.id)} terms={terms} />#
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!stamp && <AgeChip order={order} />}
            <StatusChip key={status} status={status} className="admin-swap" />
          </div>
        </header>

        <OrderTimeline status={status} />

        <div className="grid gap-2.5 @4xl:grid-cols-2 @4xl:items-start @4xl:gap-4">
        <section aria-label="اطلاعات ارسال">
          <dl className="grid gap-x-2 gap-y-0.5 @lg:grid-cols-2">
            <Info icon={Phone} label="شماره تماس" copy={phone} what="شماره تماس">
              {phone ? (
                <a href={`tel:${phone}`} dir="ltr" {...tip("تماس")} className="inline-block cursor-pointer rounded hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300">
                  <Highlight text={faDigits(phone)} terms={terms} />
                </a>
              ) : (
                "نامشخص"
              )}
            </Info>
            <Info icon={Mailbox} label="کد پستی" copy={postal} what="کد پستی">
              {postal ? <Highlight text={faDigits(postal)} terms={terms} /> : "نامشخص"}
            </Info>
            <Info icon={MapPin} label="آدرس" copy={address} what="آدرس" className="@lg:col-span-2">
              {address ? <Highlight text={faDigits(address)} terms={terms} /> : "نامشخص"}
            </Info>
          </dl>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 px-0.5">
            {shipping !== null ? (
              <p className="flex min-w-0 flex-wrap items-center gap-2 text-[13px] text-gray-600">
                <Truck className="h-4 w-4 shrink-0 -scale-x-100 text-gray-400" aria-hidden="true" />
                <span className="font-semibold text-gray-800">
                  <Highlight text={shipping} terms={terms} />
                </span>
                <Chip tone={order.shippingCost > 0 ? "gray" : "green"}>{order.shippingCost > 0 ? `${fa(order.shippingCost)} تومان` : "ارسال رایگان"}</Chip>
              </p>
            ) : (
              <span />
            )}
            <CopyButton value={parcel} what="اطلاعات ارسال">
              کپی اطلاعات ارسال
            </CopyButton>
          </div>
        </section>

        <section className="rounded-xl bg-gray-50/80 px-2.5 py-1.5 ring-1 ring-gray-100" aria-label="اقلام سفارش">
          <h4 className="flex items-center gap-1.5 text-[11px] font-bold leading-4 text-gray-500">
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
            اقلام سفارش ({fa(items.length)})
          </h4>
          <ul className="divide-y divide-gray-200/70">
            {head.map((item) => (
              <Item key={item.id} item={item} terms={terms} />
            ))}
          </ul>
          {rest.length > 0 && (
            <>
              <div id={foldId} className="od-fold" data-open={showRest ? "" : undefined} inert={!showRest}>
                <div>
                  <ul className="divide-y divide-gray-200/70 border-t border-gray-200/70">
                    {rest.map((item) => (
                      <Item key={item.id} item={item} terms={terms} />
                    ))}
                  </ul>
                </div>
              </div>
              {!foundInRest && (
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-expanded={showRest}
                  aria-controls={foldId}
                  className="btn-flat flex w-full cursor-pointer items-center justify-center gap-1.5 border-t border-dashed border-gray-200 py-1 text-[11px] font-bold text-brand-700 transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                >
                  <ChevronDown className={`h-4 w-4 transition-[rotate] duration-300 motion-reduce:transition-none ${showRest ? "rotate-180" : ""}`} aria-hidden="true" />
                  {showRest ? "بستن اقلام" : `نمایش ${fa(rest.length)} قلم دیگر`}
                </button>
              )}
            </>
          )}
        </section>
        </div>

        <footer className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-dashed border-gray-200 pt-2.5">
          <p className="text-[13px] leading-6 text-gray-500">
            قیمت کل: <strong className="text-lg font-extrabold tabular-nums text-gray-900">{fa(order.totalPrice)}</strong> <span className="text-xs">تومان</span>
            {order.shippingCost > 0 && <span className="block text-[11px] leading-4 text-gray-400">شامل هزینهٔ ارسال {fa(order.shippingCost)} تومان</span>}
          </p>

          {order.status === "processing" && <StatusActions busy={busy} locked={!!stamp} onConfirm={change} />}

          {order.status === "pending" && (
            <p className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
              <Hourglass className="od-hourglass h-4 w-4" aria-hidden="true" />
              منتظر تکمیل پرداخت توسط کاربر
            </p>
          )}

          {(order.status === "delivered" || order.status === "returned") && order.updatedAt && (
            <p className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <History className="h-3.5 w-3.5" aria-hidden="true" />
              آخرین به‌روزرسانی: {faDate(order.updatedAt)}، ساعت {faTime(order.updatedAt)}
            </p>
          )}
        </footer>
      </div>
    </article>
  );
}
