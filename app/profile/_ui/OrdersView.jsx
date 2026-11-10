"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { mdiDeleteCircleOutline, mdiTrashCanOutline } from "@mdi/js";
import { useCart } from "@/lib/context";
import ConfirmDialog from "./ConfirmDialog";
import { Ic } from "./icons";
import { dateFa, fa, toman } from "./format";
import { Empty, ST, Stack, Thumb, ViewHead, countByStatus } from "./parts";

const FILTERS = [
  ["all", "همه"],
  ["processing", "جاری"],
  ["delivered", "تحویل شده"],
  ["returned", "مرجوع"],
  ["pending", "ناتمام"],
];

// فیلتر با قرص سفید لغزان: قرص پشت دکمهٔ فعال با اندازه‌گیری جا می‌گیرد (left فیزیکی، چون offsetLeft هم فیزیکی است) و با فنر می‌لغزد
function FilterSeg({ value, counts, onChange }) {
  const ref = useRef(null);
  const pill = useRef(null);

  const place = () => {
    const cur = ref.current?.querySelector('[aria-pressed="true"]');
    if (!cur || !pill.current) return;
    pill.current.style.left = `${cur.offsetLeft}px`;
    pill.current.style.width = `${cur.offsetWidth}px`;
  };

  useLayoutEffect(place, [value, counts]);
  useLayoutEffect(() => {
    const el = ref.current;
    const ro = new ResizeObserver(place);
    ro.observe(el);
    el.querySelectorAll("button").forEach((b) => ro.observe(b));
    document.fonts?.ready.then(place);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="fseg" ref={ref}>
      <span className="pill" ref={pill} aria-hidden="true" />
      {FILTERS.map(([k, label]) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}>
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

function OrderCard({ order, index, open, leaving, busy, onToggle, onPay, onAskDelete, onRebuy, rebuying }) {
  const s = ST[order.status];
  const items = order.OrderItems ?? [];
  const qty = items.reduce((a, it) => a + it.quantity, 0);
  const firstSlug = items[0]?.Product?.slug;
  const detailId = `order-${order.id}-details`;

  return (
    <article className={`ocard ${open ? "open" : ""} ${leaving ? "leave" : ""}`} style={{ "--c": s.c, "--i": index }}>
      <div className="oc-main">
        <div className="oc-id">
          <b>سفارش شمارهٔ {fa(order.userOrderNumber)}</b>
          <small>{dateFa(order.createdAt)}</small>
        </div>
        <div className="oc-mid">
          <Stack items={items.map((it) => ({ id: it.id, image: it.Product?.image, name: it.Product?.name }))} size={46} />
          {order.status === "processing" && <MiniTracker />}
          <span className={`chip ${order.status === "processing" ? "live" : ""}`} style={{ "--c": s.c }}>
            <i />
            {s.label}
          </span>
        </div>
        <div className="oc-total">
          <small>{fa(qty)} کالا</small>
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
      <div className="detail" id={detailId}>
        <div>
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
  const list = all.filter((o) => filter === "all" || o.status === filter);

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
