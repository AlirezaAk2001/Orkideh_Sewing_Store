"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { mdiCartMinus, mdiDeleteCircleOutline, mdiDeleteSweepOutline } from "@mdi/js";
import { useAuth, useCart } from "@/lib/context";
import { useShipping } from "@/lib/useShipping";
import ConfirmDialog from "./ConfirmDialog";
import { Ic } from "./icons";
import { fa, toEn, toman } from "./format";
import { Empty, FL, Thumb, Tick, ViewHead } from "./parts";

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

// سفارش ناتمام با آیتم‌های قبلی ساخته شده و با تغییر سبد کهنه می‌شود؛ فقط خودِ سفارش را پاک می‌کنیم (سفارش جدید از سبد ساخته می‌شود) و سبد دست‌نخورده می‌ماند
async function dropPendingOrder() {
  try {
    const res = await fetch("/api/orders", { headers: auth() });
    const data = await res.json();
    const pending = res.ok && data.orders?.find((o) => o.status === "pending");
    if (pending) await fetch(`/api/orders/${pending.id}`, { method: "DELETE", headers: auth() });
  } catch (err) {
    console.error("خطا در حذف سفارش ناتمام:", err);
  }
}

function CartItem({ item, index, leaving, qtyBusy, onQty, onAskRemove }) {
  const href = item.slug ? `/products/${item.slug}` : null;
  const max = item.maxQuantity ?? Infinity;
  return (
    <article className={`citem ${leaving ? "leave" : ""}`} style={{ "--i": index }}>
      <Thumb src={item.image} alt={item.name} width={96} height={76} />
      <div>
        <h3>{href ? <Link href={href}>{item.name}</Link> : item.name}</h3>
        <div className="u">قیمت واحد: {toman(item.price)}</div>
      </div>
      {/* در صفحهٔ راست‌به‌چپ عنصر اولِ DOM سمت راست می‌نشیند؛ «−» اول است تا «+» سمت چپ و «−» سمت راست بیفتد (مثل گام‌شمار صفحهٔ محصول، QuantityStepper) */}
      <div className="step" role="group" aria-label="تعداد">
        <button type="button" onClick={() => onQty(item, item.quantity - 1)} disabled={qtyBusy || item.quantity <= 1} aria-label="کاهش تعداد">
          <Ic n="minus" />
        </button>
        <span aria-live="polite">
          <Tick value={item.quantity}>{fa(item.quantity)}</Tick>
        </span>
        <button type="button" onClick={() => onQty(item, item.quantity + 1)} disabled={qtyBusy || item.quantity >= max} aria-label="افزایش تعداد" title={item.quantity >= max ? "بیشتر از موجودی نمی‌شود" : undefined}>
          <Ic n="plus" />
        </button>
      </div>
      <div className="line-total">
        <Tick value={item.price * item.quantity}>{toman(item.price * item.quantity)}</Tick>
      </div>
      <button type="button" className="ib-btn red" onClick={() => onAskRemove(item)} aria-label={`حذف ${item.name} از سبد`}>
        <Ic n="trash" />
      </button>
    </article>
  );
}

// سبد خرید: ردیف‌هایی با گام‌شمار تعداد و خلاصهٔ تیره و چسبان. پرداخت تا وارد شدن شمارهٔ همراه معتبر غیرفعال است؛ ثبت سفارش و رفتن به درگاه همان منطق قبلی سبد است
export default function CartView({ onGo }) {
  const { cartItems, removeFromCart, clearCart, updateQuantity, cartCount } = useCart();
  const { currentUser, addresses } = useAuth();
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [qtyBusy, setQtyBusy] = useState(null);
  const [leaving, setLeaving] = useState(null);
  const [askRemove, setAskRemove] = useState(null);
  const [askClear, setAskClear] = useState(false);

  const ship = useShipping();
  const total = cartItems.reduce((s, it) => s + it.price * it.quantity, 0);
  // مبلغ قابل پرداخت = جمع کالاها + هزینهٔ روش ارسال انتخاب‌شده (سرور همین را از تنظیمات خودش می‌سازد)
  const payable = total + ship.cost;
  const shipReady = !ship.loading && !ship.error;
  const num = toEn(phone);
  const phoneOk = /^09\d{9}$/.test(num);

  const changeQty = async (item, quantity) => {
    setQtyBusy(item.id);
    try {
      await updateQuantity(item.id, quantity);
    } finally {
      setQtyBusy(null);
    }
  };

  const confirmRemove = () => {
    const item = askRemove;
    setAskRemove(null);
    setLeaving(item.id);
    setTimeout(async () => {
      await dropPendingOrder();
      removeFromCart(item.id);
      setLeaving(null);
      toast.success("محصول موردنظر از سبد خرید شما حذف شد.", { icon: "🗑️" });
    }, 360);
  };

  const confirmClear = async () => {
    setAskClear(false);
    await dropPendingOrder();
    clearCart();
    toast.success("تمام محصولات از سبد خرید شما حذف شدند.", { icon: "🗑️" });
  };

  const checkout = async (e) => {
    e.preventDefault();
    if (!currentUser) return toast("برای ثبت سفارش، ابتدا وارد حساب کاربری خود شوید.", { icon: "⚠️" });
    if (!cartItems.length) return toast("سبد خرید شما خالی است.", { icon: "⚠️" });
    if (!phoneOk) return toast("شماره تلفن نامعتبر است.", { icon: "⚠️" });
    if (!shipReady) return toast("روش‌های ارسال هنوز بارگذاری نشده‌اند.", { icon: "⚠️" });

    setPaying(true);
    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth() },
        body: JSON.stringify({ phoneNumber: num, shippingMethod: ship.selected }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        // بدون آدرس سفارشی ساخته نمی‌شود: به‌جای فقط یک پیام، کاربر را مستقیم به بخش آدرس‌ها می‌بریم تا ثبتش کند (سبد دست‌نخورده می‌ماند و سروری که پاسخ داده خودش مرجع است، نه فهرست آدرس‌های هنوز بارگذاری‌نشدهٔ مرورگر)
        if (orderData.code === "ADDRESS_REQUIRED") {
          toast(orderData.error || "لطفاً ابتدا آدرس خود را ثبت کنید", { icon: "⚠️" });
          setPaying(false);
          onGo("addresses");
          return;
        }
        throw new Error(orderData.error || "خطا در ثبت سفارش");
      }

      // مبلغ و آدرس برگشت از درگاه را سرور تعیین می‌کند؛ فقط شناسهٔ سفارش را می‌فرستیم
      const payRes = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth() },
        body: JSON.stringify({ orderId: orderData.order.id }),
      });
      const data = await payRes.json();
      if (!payRes.ok || data.result !== 100) throw new Error(data.error || `خطا در پرداخت. کد خطا: ${data.result}`);

      window.location.href = data.payUrl;
      return;
    } catch (err) {
      toast.error(err.message);
    }
    setPaying(false);
  };

  if (!cartItems.length) {
    return (
      <>
        <ViewHead icon="cart" title="سبد خرید" sub="محصولی در سبد نیست" />
        <Empty icon="cart" title="سبد خرید شما خالی است" text="از علاقه‌مندی‌ها یا فروشگاه محصول اضافه کنید.">
          <Link href="/products" className="btn btn-primary" style={{ marginTop: 10 }}>
            <Ic n="store" />
            رفتن به فروشگاه
          </Link>
        </Empty>
      </>
    );
  }

  return (
    <>
      <ViewHead icon="cart" title="سبد خرید" sub={`${fa(cartCount)} کالا · آمادهٔ ثبت سفارش`}>
        {cartItems.length > 1 && (
          <button type="button" className="btn btn-soft-red sm" onClick={() => setAskClear(true)}>
            <Ic n="trash" />
            حذف همه
          </button>
        )}
      </ViewHead>

      <div className="cgrid">
        <div className="clist">
          {cartItems.map((it, i) => (
            <CartItem key={it.id} item={it} index={i} leaving={leaving === it.id} qtyBusy={qtyBusy === it.id} onQty={changeQty} onAskRemove={setAskRemove} />
          ))}
        </div>

        <aside className="tile sum rise" style={{ "--i": 2 }}>
          <form onSubmit={checkout} noValidate>
            <div className="t-head">
              <div className="t-title">
                <span className="ib">
                  <Ic n="bag" />
                </span>
                خلاصهٔ سفارش
              </div>
            </div>
            <div className="srow">
              <span>تعداد کالاها</span>
              <b>
                <Tick value={cartCount}>{fa(cartCount)}</Tick>
              </b>
            </div>
            <div className="srow">
              <span>جمع کالاها</span>
              <b>
                <Tick value={total}>{toman(total)}</Tick>
              </b>
            </div>
            {/* شیوهٔ ارسال: روش‌ها و هزینه‌شان را مدیر در پنل مدیریت (ارسال) تنظیم می‌کند؛ بدون روش فعال این بخش نمی‌آید */}
            {ship.loading && <div className="ship-skel" aria-hidden="true" />}
            {ship.error && (
              <div className="ship-msg" role="alert">
                روش‌های ارسال دریافت نشد.
                <button type="button" onClick={ship.reload}>
                  تلاش دوباره
                </button>
              </div>
            )}
            {ship.methods?.length > 0 && (
              <fieldset className="ship">
                <legend>شیوهٔ ارسال</legend>
                {ship.methods.map((m) => (
                  <label key={m.id} className={`opt ${ship.selected === m.id ? "on" : ""}`}>
                    <input type="radio" name="ship" value={m.id} checked={ship.selected === m.id} onChange={() => ship.setSelected(m.id)} />
                    <span className="rd" aria-hidden="true" />
                    <span className="tx">
                      <b>{m.label}</b>
                      {m.description && <small>{m.description}</small>}
                    </span>
                    <span className="pr">
                      {m.cost > 0 ? (
                        <>
                          {fa(m.cost)}
                          <small>تومان</small>
                        </>
                      ) : (
                        <em className="free">رایگان</em>
                      )}
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            {ship.method && (
              <div className="srow">
                <span>هزینهٔ ارسال</span>
                <b>{ship.cost > 0 ? <Tick value={ship.cost}>{toman(ship.cost)}</Tick> : <span className="free">رایگان</span>}</b>
              </div>
            )}
            <div className="stotal">
              <span>مبلغ قابل پرداخت</span>
              <b>
                <Tick value={payable}>{fa(payable)}</Tick>
                <small>تومان</small>
              </b>
            </div>
            {/* برچسب شناور (کلاس fl در profile.css؛ رنگ‌های برشِ کارت تیره زیر .sum تعریف شده): عنوان داخل باکس و با فوکوس یا پر بودن روی لبه */}
            <div className="field fl">
              <div className={`inp ${phone ? (phoneOk ? "ok" : "bad") : ""}`}>
                <Ic n="phone" />
                <input id="phone" type="tel" inputMode="tel" placeholder="09123456789" maxLength={11} autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <FL htmlFor="phone">شمارهٔ تماس</FL>
              </div>
              <div className={`hint ${phone ? (phoneOk ? "ok" : "bad") : ""}`}>
                {!phone ? "برای هماهنگی ارسال، شمارهٔ همراه را وارد کنید" : phoneOk ? "شمارهٔ معتبر است" : "شماره با ۰۹ شروع می‌شود و ۱۱ رقم است"}
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={!phoneOk || paying || !shipReady}>
              <Ic n={paying ? "loader" : "shield"} className={paying ? "spin" : ""} />
              {paying ? "در حال انتقال به درگاه…" : "تأیید و پرداخت"}
            </button>
            {addresses.length === 0 && (
              <div className="note">
                <Ic n="pin" />
                برای ثبت سفارش باید یک آدرس ثبت کنید.
                <button type="button" className="btn-flat" onClick={() => onGo("addresses")}>
                  ثبت آدرس
                </button>
              </div>
            )}
            <div className="secure">
              <Ic n="lock" />
              پرداخت امن از طریق درگاه بانکی
            </div>
          </form>
        </aside>
      </div>

      <ConfirmDialog
        open={!!askRemove}
        onClose={() => setAskRemove(null)}
        onConfirm={confirmRemove}
        title="حذف از سبد خرید"
        icon={mdiCartMinus}
        tone="blue"
        confirmLabel="بله، حذف کن"
        confirmIcon={mdiDeleteCircleOutline}
      >
        محصول
        <strong style={{ color: "#E53935", margin: "0 4px" }}>«{askRemove?.name}»</strong>
        از سبد خرید شما حذف خواهد شد. آیا مطمئن هستید؟
      </ConfirmDialog>

      <ConfirmDialog
        open={askClear}
        onClose={() => setAskClear(false)}
        onConfirm={confirmClear}
        title="خالی کردن سبد خرید"
        icon={mdiDeleteSweepOutline}
        tone="blue"
        minWidth="320px"
        confirmLabel="بله، همه را حذف کن"
        confirmIcon={mdiDeleteSweepOutline}
      >
        آیا مطمئن هستید که می‌خواهید تمام محصولات زیر را از سبد خرید خود حذف کنید؟
        <ul style={{ marginTop: 10, paddingRight: 8, display: "flex", flexDirection: "column", gap: 6, listStyle: "none" }}>
          {cartItems.map((it, i) => (
            <li key={it.id} style={{ fontSize: 13, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", backgroundColor: "#3b82f6", color: "#fff", fontSize: 11, fontWeight: "bold", flexShrink: 0 }}>
                {fa(i + 1)}
              </span>
              {it.name}
              {it.quantity > 1 && <span style={{ color: "#6b7280", fontSize: 12 }}>(×{fa(it.quantity)})</span>}
            </li>
          ))}
        </ul>
      </ConfirmDialog>
    </>
  );
}
