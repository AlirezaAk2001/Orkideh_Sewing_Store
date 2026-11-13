"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { mdiDeleteCircleOutline, mdiTrashCanOutline } from "@mdi/js";
import { useSegmentSlide } from "@/app/admin/_ui/useSegmentSlide";
import { useCart } from "@/lib/context";
import ConfirmDialog from "./ConfirmDialog";
import { Ic } from "./icons";
import { costLabel } from "@/lib/shipping";
import { formatAddress } from "@/lib/addressFormat";
import { dateFa, dateTimeFa, fa, faDigits, toman } from "./format";
import { Empty, ST, Stack, Thumb, ViewHead, countByStatus } from "./parts";

const FILTERS = [
  ["all", "همه"],
  ["processing", "جاری"],
  ["delivered", "تحویل شده"],
  ["returned", "مرجوع"],
  ["pending", "ناتمام"],
];

// ترتیب نمایش در تب «همه»: وضعیت‌ها به ترتیب خود تب‌ها می‌آیند (جاری، تحویل‌شده، مرجوع و آخر ناتمام) و داخل هر وضعیت ترتیب سرور می‌ماند (تازه‌ترین اول)
const RANK = Object.fromEntries(FILTERS.slice(1).map(([k], i) => [k, i]));

// فیلتر با قرص سفید لغزان: همان تب‌های قطعه‌ای پنل ادمین (.seg / .seg-tab در globals.css). قرص سفیدِ تب فعال شبه‌عنصر خود تب است و با هاور همراهش بالا می‌آید،
// لغزشش بین تب‌ها را useSegmentSlide می‌دهد، و حرکت سه‌بعدی تب‌ها (بلندشدن، کج‌شدن، لبهٔ ضخامت با ButtonDepth) را خودکار دارد
// تب وضعیتی که سفارشی ندارد (مثلاً «ناتمام» با شمارندهٔ ۰) نمایش داده نمی‌شود؛ «همه» همیشه هست
function FilterSeg({ value, counts, onChange }) {
  const ref = useSegmentSlide(value);

  return (
    <div className="fseg seg" ref={ref}>
      {FILTERS.filter(([k]) => k === "all" || counts[k] > 0).map(([k, label]) => (
        <button key={k} type="button" className="seg-tab" aria-pressed={value === k} data-on={value === k ? "" : undefined} onClick={() => onChange(k)}>
          {label}
          <em>{fa(counts[k])}</em>
        </button>
      ))}
    </div>
  );
}

// نوار کوچک مراحل سفارش جاری (تزئینی)، هم‌جا با کاشی «وضعیت سفارش» نمای کلی: ثبت و پرداخت انجام شده، آماده‌سازی در جریان، ارسال و تحویل مانده است
function MiniTracker() {
  return (
    <div className="mini" aria-hidden="true">
      <i className="d" />
      <u className="d" />
      <i className="d" />
      <u className="d" />
      <i className="n" />
      <u />
      <i />
      <u />
      <i />
    </div>
  );
}

// یک سطر اطلاعات جزئیات: کاشی آیکون کوچک، برچسب کم‌رنگ و مقدار (wide = تمام‌عرض)
function DInfo({ icon, label, wide = false, children }) {
  return (
    <div className={`di ${wide ? "wide" : ""}`}>
      <span className="ic">
        <Ic n={icon} />
      </span>
      <div>
        <dt>{label}</dt>
        <dd>{children}</dd>
      </div>
    </div>
  );
}

function OrderCard({ order, index, open, leaving, busy, onToggle, onPay, onAskDelete, onRebuy, rebuying }) {
  const s = ST[order.status];
  const items = order.OrderItems ?? [];
  const qty = items.reduce((a, it) => a + it.quantity, 0);
  const firstSlug = items[0]?.Product?.slug;
  const detailId = `order-${order.id}-details`;
  const showList = items.length > 1 || items.some((it) => it.quantity > 1);
  const single = showList ? null : items[0];
  const goodsTotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const hasShipping = order.shippingMethod != null; // سفارش‌های قبل از قابلیت ارسال روش ندارند و ریز مبلغ هم نمی‌آید (مبلغ کارت همان جمع کالاهاست)
  const settledLabel = order.status === "delivered" ? "تاریخ تحویل" : order.status === "returned" ? "تاریخ مرجوعی" : null;

  const copyTrack = async (code) => {
    try {
      await navigator.clipboard.writeText(String(code));
      toast.success("کد پیگیری کپی شد.");
    } catch {
      toast.error("کپی انجام نشد؛ کد را دستی انتخاب کنید.");
    }
  };

  return (
    // id و tabIndex: «جزئیات سفارش» نمای کلی صفحه را تا این کارت می‌آورد، فوکوس می‌دهد و دورش پالس می‌زند (arrive در page.jsx، data-spot در profile.css)
    <article id={`order-card-${order.id}`} tabIndex={-1} className={`ocard ${open ? "open" : ""} ${leaving ? "leave" : ""}`} style={{ "--c": s.c, "--i": index }}>
      <div className="oc-main">
        <div className="oc-id">
          <b>سفارش شمارهٔ {fa(order.userOrderNumber)}</b>
          <small>{dateFa(order.createdAt)}</small>
        </div>
        <div className="oc-mid">
          <Stack items={items.map((it) => ({ id: it.id, image: it.Product?.image, name: it.Product?.name }))} size={46} />
          {order.status === "processing" && <MiniTracker />}
          <span className="chip" style={{ "--c": s.c }}>
            {/* نقطهٔ چیپ همهٔ وضعیت‌ها همان نقطهٔ تپندهٔ داشبورد است (beat-dot در globals.css) و هالهٔ هر کدام به رنگ وضعیت خودش است */}
            <i className="beat-dot" />
            {s.label}
          </span>
        </div>
        <div className="oc-total">
          {/* تعداد کالاها همان چیپ خاکستری کاشی‌های سبد و علاقه‌مندی‌های نمای کلی است */}
          <div className="oc-qty">
            <span className="chip" style={{ "--c": "var(--ink-3)" }}>
              {fa(qty)} کالا
            </span>
          </div>
          <b>{toman(order.totalPrice)}</b>
        </div>
      </div>
      <div className="oc-acts">
        {order.status === "pending" && (
          <>
            <button type="button" className="btn btn-primary sm" disabled={busy} onClick={() => onPay(order)}>
              {busy === "pay" ? "در حال انتقال به درگاه…" : "ادامهٔ پرداخت"}
            </button>
            <button type="button" className="btn btn-soft-red sm" disabled={!!busy} onClick={() => onAskDelete(order)}>
              <Ic n="trash" />
              {busy === "delete" ? "در حال حذف…" : "حذف سفارش"}
            </button>
          </>
        )}
        {order.status === "delivered" && (
          <>
            <button type="button" className="btn btn-ghost sm" disabled={rebuying} onClick={() => onRebuy(order)}>
              <Ic n={rebuying ? "loader" : "repeat"} className={rebuying ? "spin" : ""} />
              خرید مجدد
            </button>
            {firstSlug && (
              <Link href={`/products/${firstSlug}#comments`} className="btn btn-ghost sm">
                <Ic n="star" />
                ثبت نظر
              </Link>
            )}
          </>
        )}
        <span className="sp" />
        <button type="button" className="btn btn-ghost sm" onClick={() => onToggle(order.id)} aria-expanded={open} aria-controls={detailId}>
          جزئیات
          <Ic n="chevD" className="chev" />
        </button>
      </div>
      {/* جزئیات: فقط چیزهایی که روی کارت نیست. فهرست کالاها فقط وقتی می‌آید که بیشتر از یک کالا یا تعداد بیشتر از ۱ باشد؛ برای یک کالای تک، نامش (لینک‌دار) بالای آدرس می‌نشیند.
          بعد آدرس، کد پستی (جدا)، شمارهٔ تماس، شیوهٔ ارسال (اگر ثبت شده)، زمان ثبت، (تحویل‌شده/مرجوعی) تاریخ تحویل یا مرجوعی، (پرداخت‌شده) کد پیگیری با دکمهٔ کپی یا «ثبت نشده»؛ و ریز مبلغ برای همه */}
      <div className="detail" id={detailId}>
        <div>
          <div className="dbody">
            {showList && (
              <div className="drows">
                {items.map((it) => {
                  const p = it.Product;
                  const href = p?.slug ? `/products/${p.slug}` : null;
                  return (
                    <div className="drow" key={it.id}>
                      <Thumb src={p?.image} alt="" width={54} height={54} />
                      <div className="nm">
                        {href ? <Link href={href}>{p?.name}</Link> : p?.name ?? "نامشخص"}
                        <small>
                          {fa(it.quantity)} عدد × {toman(it.price)}
                        </small>
                      </div>
                      <b>{toman(it.price * it.quantity)}</b>
                    </div>
                  );
                })}
              </div>
            )}
            <dl className="dinfo">
              {single && (
                <DInfo icon="bag" label="کالا" wide>
                  {single.Product?.slug ? <Link href={`/products/${single.Product.slug}`}>{single.Product.name}</Link> : single.Product?.name ?? "نامشخص"}
                </DInfo>
              )}
              <DInfo icon="pin" label="آدرس تحویل" wide>
                {order.Address ? faDigits(formatAddress(order.Address)) : "آدرسی ثبت نشده است"}
              </DInfo>
              {/* کد پستی بخش جدا دارد (نه داخل متن آدرس)؛ کنار شمارهٔ تماس می‌نشیند */}
              {order.Address && (
                <DInfo icon="mail" label="کد پستی">
                  <bdi dir="ltr">{faDigits(order.Address.postalCode) || "—"}</bdi>
                </DInfo>
              )}
              <DInfo icon="phone" label="شمارهٔ تماس">
                <bdi dir="ltr">{faDigits(order.phoneNumber) || "—"}</bdi>
              </DInfo>
              {hasShipping && (
                <DInfo icon="truck" label="شیوهٔ ارسال">
                  {order.shippingMethod}
                  <span>|</span>
                  <span>{costLabel(order.shippingCost, fa)}</span>
                </DInfo>
              )}
              <DInfo icon="cal" label="زمان ثبت سفارش">
                {dateTimeFa(order.createdAt)}
              </DInfo>
              {settledLabel && (
                <DInfo icon={order.status === "delivered" ? "packcheck" : "undo"} label={settledLabel}>
                  {dateTimeFa(order.updatedAt)}
                </DInfo>
              )}
              {/* سفارش پرداخت‌شده‌ای که کدی ندارد (داده‌ٔ قدیمی، نمونه یا تغییر دستی وضعیت توسط مدیر) «ثبت نشده» می‌نویسد، نه اینکه ردیف بی‌صدا نیاید */}
              {order.status !== "pending" && (
                <DInfo icon="receipt" label="کد پیگیری پرداخت">
                  {order.paymentTrackId ? (
                    <>
                      <bdi dir="ltr">{faDigits(order.paymentTrackId)}</bdi>
                      <button type="button" className="ib-btn xs" onClick={() => copyTrack(order.paymentTrackId)} aria-label="کپی کد پیگیری پرداخت">
                        <Ic n="copy" />
                      </button>
                    </>
                  ) : (
                    <span className="na">ثبت نشده</span>
                  )}
                </DInfo>
              )}
            </dl>
            {/* ریز مبلغ برای همهٔ سفارش‌ها؛ سفارش قدیمی که هزینهٔ ارسالش ثبت نشده در ردیف ارسال «ثبت نشده» می‌گیرد (مبلغ کل آن همان جمع کالاهاست) */}
            <div className="dsum">
              <div>
                <span>جمع کالاها</span>
                <b>{toman(goodsTotal)}</b>
              </div>
              <div>
                <span>هزینهٔ ارسال</span>
                {hasShipping ? <b className={order.shippingCost > 0 ? undefined : "free"}>{costLabel(order.shippingCost, fa)}</b> : <b className="na">ثبت نشده</b>}
              </div>
              <div className="tot">
                <span>{order.status === "pending" ? "مبلغ قابل پرداخت" : "مبلغ پرداخت‌شده"}</span>
                <b>{toman(order.totalPrice)}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// سفارش‌ها: فیلتر وضعیت، کارت هر سفارش با رنگ وضعیتش، جزئیات بازشونده و کارهای مخصوص هر وضعیت (ادامهٔ پرداخت و حذف سفارش ناتمام، خرید مجدد و ثبت نظر تحویل‌شده)
export default function OrdersView({ orders, payingId, deletingId, onPay, onDelete }) {
  const { addToCart } = useCart();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(() => new Set());
  const [leaving, setLeaving] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [rebuying, setRebuying] = useState(null);

  const loading = orders == null;
  const all = orders ?? [];
  const counts = { all: all.length, ...countByStatus(all) };
  // تبی که خالی شد (مثلاً آخرین سفارش ناتمام حذف شد) از نوار برداشته می‌شود؛ پس به «همه» برمی‌گردیم تا فهرست خالیِ بدون تب فعال نماند
  if (!loading && filter !== "all" && !counts[filter]) setFilter("all");
  const list = filter === "all" ? [...all].sort((a, b) => (RANK[a.status] ?? FILTERS.length) - (RANK[b.status] ?? FILTERS.length)) : all.filter((o) => o.status === filter);

  const toggle = (id) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // کالاهای سفارش را (با قیمت امروزشان) دوباره به سبد می‌افزاید؛ هر کالا پیام خودش را از سبد می‌گیرد
  const rebuy = async (order) => {
    setRebuying(order.id);
    try {
      for (const it of order.OrderItems ?? []) {
        const p = it.Product;
        await addToCart({ id: it.productId, name: p?.name, price: p?.price, finalPrice: p?.finalPrice, image: p?.image, quantity: it.quantity });
      }
    } catch {
      toast.error("مشکلی پیش آمد. دوباره تلاش کنید.");
    }
    setRebuying(null);
  };

  // پس از تأیید، کارت محو می‌شود و بعد حذف انجام می‌شود (اگر حذف شکست بخورد، کارت برمی‌گردد)
  const confirmDelete = () => {
    const order = confirm;
    setConfirm(null);
    setLeaving(order.id);
    setTimeout(async () => {
      await onDelete(order);
      setLeaving(null);
    }, 380);
  };

  const busyOf = (o) => (payingId === o.id ? "pay" : deletingId === o.id ? "delete" : null);

  return (
    <>
      <ViewHead icon="bag" title="سفارش‌های من" sub="پیگیری و تاریخچهٔ خریدهای شما">
        <FilterSeg value={filter} counts={counts} onChange={setFilter} />
      </ViewHead>

      {loading ? (
        <div className="olist" aria-hidden="true">
          <div className="skel" />
          <div className="skel" />
          <div className="skel" />
        </div>
      ) : list.length ? (
        <div className="olist" key={filter}>
          {list.map((o, i) => (
            <OrderCard
              key={o.id}
              order={o}
              index={i}
              open={open.has(o.id)}
              leaving={leaving === o.id}
              busy={busyOf(o)}
              rebuying={rebuying === o.id}
              onToggle={toggle}
              onPay={onPay}
              onAskDelete={setConfirm}
              onRebuy={rebuy}
            />
          ))}
        </div>
      ) : all.length === 0 ? (
        <Empty icon="bag" title="هنوز سفارشی ثبت نکرده‌اید" text="محصول مورد نظرتان را پیدا کنید و به سبد خرید اضافه کنید.">
          <Link href="/products" className="btn btn-primary" style={{ marginTop: 10 }}>
            <Ic n="store" />
            مشاهدهٔ محصولات
          </Link>
        </Empty>
      ) : (
        <Empty icon="bag" title="سفارشی در این وضعیت نیست" />
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={confirmDelete}
        title="حذف سفارش"
        icon={mdiTrashCanOutline}
        confirmLabel="بله، حذف کن"
        confirmIcon={mdiDeleteCircleOutline}
      >
        سفارش #{confirm && fa(confirm.userOrderNumber)} حذف خواهد شد و محصول «{confirm?.OrderItems?.[0]?.Product?.name || "نامشخص"}» از سبد خریدتان نیز حذف خواهد شد. آیا مطمئن هستید؟
      </ConfirmDialog>
    </>
  );
}
