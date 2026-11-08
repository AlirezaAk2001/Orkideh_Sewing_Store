"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/context";
import { toPersianDigits } from "@/lib/format";
import { scrollBehavior } from "@/lib/motion";
import { Ic } from "./icons";
import { fa, toEn } from "./format";
import { MapBox, ViewHead } from "./parts";

const MIN_TEXT = 5;

// آدرس‌ها: کارت نقشه‌دار برای هر آدرس و یک فرم بازشونده که هم برای افزودن و هم برای ویرایش است (آدرس هر کاربر فقط نشانی و کد پستی دارد)
export default function AddressesView() {
  const { addresses, addAddress, updateAddress } = useAuth();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null); // null = افزودن
  const [text, setText] = useState("");
  const [postal, setPostal] = useState("");
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);
  const textRef = useRef(null);

  const digits = toEn(postal).replace(/\D/g, "");
  const postalOk = /^\d{10}$/.test(digits);
  const textOk = text.trim().length >= MIN_TEXT;
  const canSave = postalOk && textOk && !saving;

  const reset = () => {
    setEditId(null);
    setText("");
    setPostal("");
  };

  const close = () => {
    setOpen(false);
    setTimeout(reset, 300);
  };

  const openForm = (address) => {
    if (address) {
      setEditId(address.id);
      setText(address.address);
      setPostal(address.postalCode);
    } else if (editId != null) {
      reset();
    }
    setOpen(true);
    // فرم از بالای لیست باز می‌شود؛ وقتی کاربر پایین‌تر اسکرول کرده، بعد از شروع باز شدن به دیدش می‌آوریم
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "nearest" });
      textRef.current?.focus({ preventScroll: true });
    }, 320);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      if (editId != null) {
        await updateAddress({ id: editId, address: text.trim(), postalCode: digits });
        toast.success("آدرس با موفقیت به‌روزرسانی شد");
      } else {
        await addAddress({ address: text.trim(), postalCode: digits });
        toast.success("آدرس با موفقیت اضافه شد");
      }
      close();
    } catch (err) {
      toast.error(err.message || (editId != null ? "خطا در به‌روزرسانی آدرس" : "خطا در افزودن آدرس"));
    }
    setSaving(false);
  };

  const editing = editId != null;

  return (
    <>
      <ViewHead icon="pin" title="آدرس‌های من" sub={addresses.length ? `${fa(addresses.length)} آدرس ثبت شده` : "هنوز آدرسی ثبت نشده"}>
        <button type="button" className="btn btn-primary" onClick={() => (open && !editing ? close() : openForm())}>
          <Ic n="plus" />
          آدرس جدید
        </button>
      </ViewHead>

      <div className={`fa-form ${open ? "open" : ""}`} ref={formRef}>
        <div>
          <div className="fa-inner">
            <form className="tile" style={{ marginBottom: 16 }} onSubmit={submit} noValidate>
              <div className="t-head">
                <div className="t-title">
                  <span className="ib">
                    <Ic n={editing ? "pencil" : "plus"} />
                  </span>
                  {editing ? "ویرایش آدرس" : "افزودن آدرس جدید"}
                </div>
                <button type="button" className="ib-btn" onClick={close} aria-label="بستن">
                  <Ic n="x" />
                </button>
              </div>
              <div className="form">
                <div className="field">
                  <label htmlFor="a-text">نشانی کامل</label>
                  <div className="inp">
                    <Ic n="pin" />
                    <textarea id="a-text" ref={textRef} rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="استان، شهر، خیابان، پلاک و واحد" />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="a-pc">کد پستی</label>
                  <div className={`inp ${postal ? (postalOk ? "ok" : "bad") : ""}`}>
                    <Ic n="mail" />
                    <input
                      id="a-pc"
                      inputMode="numeric"
                      maxLength={10}
                      value={postal}
                      onChange={(e) => setPostal(e.target.value)}
                      placeholder="۱۰ رقم، بدون خط تیره"
                      style={{ direction: "ltr", textAlign: "right" }}
                      autoComplete="off"
                    />
                  </div>
                  <div className={`hint ${postal ? (postalOk ? "ok" : "bad") : ""}`}>{postal && !postalOk ? "کد پستی باید ۱۰ رقم باشد" : ""}</div>
                </div>
                <div className="sfoot" style={{ marginTop: 2 }}>
                  <button type="submit" className="btn btn-primary" disabled={!canSave}>
                    {saving && <Ic n="loader" className="spin" />}
                    {saving ? "در حال ذخیره…" : editing ? "ذخیرهٔ تغییرات" : "ذخیرهٔ آدرس"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="agrid">
        {addresses.map((a, i) => (
          <article className="tile acard" style={{ "--i": i }} key={a.id}>
            <MapBox seed={i} />
            <div className="abody">
              <h3>
                <Ic n="home" />
                آدرس {fa(i + 1)}
              </h3>
              <p>{toPersianDigits(a.address)}</p>
              <span className="pc">
                <Ic n="mail" />
                {toPersianDigits(a.postalCode)}
              </span>
              <div className="aacts">
                <span className="sp" />
                <button type="button" className="ib-btn" onClick={() => openForm(a)} aria-label={`ویرایش آدرس ${fa(i + 1)}`}>
                  <Ic n="pencil" />
                </button>
              </div>
            </div>
          </article>
        ))}
        {/* بدون هیچ آدرس، کاشی دعوت تمام عرض می‌شود */}
        <button type="button" className="newa rise" style={{ "--i": addresses.length, gridColumn: addresses.length === 0 ? "1 / -1" : undefined }} onClick={() => openForm()}>
          <span>
            <span className="pl">
              <Ic n="plus" />
            </span>
            <b>افزودن آدرس تازه</b>
            <small>برای ارسال سریع‌تر سفارش‌ها</small>
          </span>
        </button>
      </div>
    </>
  );
}
