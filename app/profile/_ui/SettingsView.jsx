"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import Avatar from "@/app/components/Avatar";
import { useAuth } from "@/lib/context";
import { evaluatePassword, STRENGTH_LABELS } from "@/lib/passwordStrength";
import AvatarPicker from "./AvatarPicker";
import { Ic } from "./icons";
import { dateFa, fa } from "./format";
import { FL, ViewHead } from "./parts";

const usernameRegex = /^[a-zA-Z0-9_]+$/;
const CHECK_DELAY = 600;
const ltr = { direction: "ltr", textAlign: "right" };

// نام کاربری: همان قواعد قبلی (حروف و عدد و _)؛ بعد از ۰٫۶ ثانیه توقف تایپ، آزاد بودنش از سرور پرسیده می‌شود.
// state: idle | same | bad | checking | ok
function UsernameCard() {
  const { currentUser, updateUser } = useAuth();
  const current = currentUser?.username ?? "";
  const [value, setValue] = useState(current);
  const [state, setState] = useState("idle");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const ticket = useRef(0);

  // اگر کاربر دیرتر از اولین رندر رسید، نام فعلی را وقتی آمد در فیلد می‌گذاریم
  useEffect(() => {
    setValue((prev) => prev || current);
  }, [current]);

  useEffect(() => () => void (ticket.current += 1), []);

  const onChange = (raw) => {
    const v = raw.trim();
    setValue(raw);
    const mine = ++ticket.current;
    if (!v) {
      setState("bad");
      setMsg("نام کاربری نمی‌تواند خالی باشد.");
      return;
    }
    if (v === current) {
      setState("same");
      setMsg("این نام کاربری فعلی شماست.");
      return;
    }
    if (!usernameRegex.test(v)) {
      setState("bad");
      setMsg("نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و خط زیر (_) باشد.");
      return;
    }
    setState("checking");
    setMsg("در حال بررسی…");
    setTimeout(async () => {
      if (mine !== ticket.current) return;
      try {
        const res = await axios.get(`/api/user/check-username?username=${encodeURIComponent(v)}`);
        if (mine !== ticket.current) return;
        if (res.data.exists) {
          setState("bad");
          setMsg("این نام کاربری قبلاً گرفته شده است.");
        } else {
          setState("ok");
          setMsg("این نام کاربری آزاد است");
        }
      } catch {
        if (mine === ticket.current) {
          setState("idle");
          setMsg("");
        }
      }
    }, CHECK_DELAY);
  };

  const save = async (e) => {
    e.preventDefault();
    if (state !== "ok" || saving) return;
    setSaving(true);
    try {
      await updateUser({ username: value.trim() });
      toast.success("نام کاربری با موفقیت تغییر کرد.");
      setState("idle");
      setMsg("");
    } catch (error) {
      const taken = error.message?.includes("نام کاربری قبلاً ثبت شده است") || error.code === "P2002";
      if (taken) {
        setState("bad");
        setMsg("این نام کاربری قبلاً گرفته شده است.");
      } else toast.error(error.message || "تغییر نام کاربری انجام نشد.");
    }
    setSaving(false);
  };

  const tone = state === "ok" ? "ok" : state === "bad" ? "bad" : "";
  return (
    <section className="tile scard rise" style={{ "--i": 3 }}>
      <h3>
        <span className="ib">
          <Ic n="user" />
        </span>
        نام کاربری
      </h3>
      <p className="sd">نام کاربری باید یکتا باشد؛ فقط حروف انگلیسی، عدد و _ مجاز است.</p>
      <form onSubmit={save} noValidate>
        {/* برچسب شناور: عنوان داخل باکس است و با فوکوس یا پر بودن روی لبه می‌رود؛ مثال (placeholder) بعد از کلیک دیده می‌شود. برچسب باید بعد از input بیاید (profile.css، کلاس fl) */}
        <div className="field fl">
          <div className={`inp ${tone}`}>
            <Ic n="user" />
            <input id="un" value={value} onChange={(e) => onChange(e.target.value)} placeholder="aaa_123" style={ltr} autoComplete="off" spellCheck={false} />
            <FL htmlFor="un">نام کاربری</FL>
          </div>
          <div className={`hint ${tone}`}>{msg}</div>
        </div>
        <div className="sfoot">
          <button type="submit" className="btn btn-primary" disabled={state !== "ok" || saving}>
            {saving && <Ic n="loader" className="spin" />}
            {saving ? "در حال ذخیره…" : "ذخیرهٔ نام کاربری"}
          </button>
        </div>
      </form>
    </section>
  );
}

// رمز عبور: قوانین و قدرت از همان ارزیاب ثبت‌نام (lib/passwordStrength.js)؛ دکمه فقط وقتی رمز جدید همهٔ قوانین را دارد، با تکرارش یکی است و رمز فعلی پر شده فعال می‌شود
function PasswordCard() {
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [again, setAgain] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const { level, rules, valid } = evaluatePassword(pw);
  const same = again.length > 0 && again === pw;
  const canSave = valid && same && cur.length > 0 && !saving;

  const save = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ currentPassword: cur, newPassword: pw }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || "تغییر رمز عبور انجام نشد.");
      else {
        toast.success("رمز عبور با موفقیت تغییر کرد.");
        setCur("");
        setPw("");
        setAgain("");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور.");
    }
    setSaving(false);
  };

  const type = show ? "text" : "password";
  return (
    <section className="tile scard rise" style={{ "--i": 4 }}>
      <h3>
        <span className="ib">
          <Ic n="lock" />
        </span>
        تغییر رمز عبور
      </h3>
      <p className="sd">برای امنیت بیشتر از رمزی قوی و منحصربه‌فرد استفاده کنید.</p>
      <form onSubmit={save} noValidate>
        <div className="form flf">
          <div className="field fl">
            <div className="inp">
              <Ic n="lock" />
              {/* بدون مثال: placeholder=" " فقط برای اینکه :placeholder-shown «پر بودن» را تشخیص بدهد */}
              <input id="pw0" type="password" value={cur} onChange={(e) => setCur(e.target.value)} placeholder=" " style={ltr} autoComplete="current-password" />
              <FL htmlFor="pw0">رمز عبور فعلی</FL>
            </div>
          </div>
          <div className="row2">
            <div className="field fl">
              <div className="inp">
                <Ic n="lock" />
                <input id="pw1" type={type} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="A@123456" style={ltr} autoComplete="new-password" />
                <button type="button" className="ib-btn" style={{ width: 30, height: 30, boxShadow: "none" }} onClick={() => setShow((v) => !v)} aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}>
                  <Ic n={show ? "eyeOff" : "eye"} />
                </button>
                <FL htmlFor="pw1">رمز عبور جدید</FL>
              </div>
            </div>
            <div className="field fl">
              <div className={`inp ${again ? (same ? "ok" : "bad") : ""}`}>
                <Ic n="lock" />
                <input id="pw2" type={type} value={again} onChange={(e) => setAgain(e.target.value)} placeholder="A@123456" style={ltr} autoComplete="new-password" />
                <FL htmlFor="pw2">تکرار رمز جدید</FL>
              </div>
            </div>
          </div>
          <div>
            <div className="meter" data-l={level} aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="hint" style={{ marginTop: 6 }}>
              {STRENGTH_LABELS[level] || "قدرت رمز عبور"}
            </div>
            <ul className="rules">
              {rules.map((r) => (
                <li key={r.id} className={r.ok ? "ok" : ""}>
                  <i>
                    <Ic n="check" />
                  </i>
                  <span>
                    {r.label}
                    {r.symbols && (
                      <>
                        {" "}
                        <bdi dir="ltr">{r.symbols}</bdi>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="sfoot">
          <button type="submit" className="btn btn-primary" disabled={!canSave}>
            {saving && <Ic n="loader" className="spin" />}
            {saving ? "در حال تغییر…" : "تغییر رمز عبور"}
          </button>
        </div>
      </form>
    </section>
  );
}

// کارت «تغییر آواتار»: انتخاب‌گر آواتار (AvatarPicker). مداد کارت صورتی نمای کلی مستقیم به همین کارت می‌آید (tabIndex برای همین است: بعد از رسیدن، فوکوس روی کارت می‌نشیند)
function AvatarCard() {
  return (
    <section id="avatar-card" className="tile scard rise" style={{ "--i": 2 }} tabIndex={-1} aria-labelledby="avatar-title">
      <h3 id="avatar-title">
        <span className="ib">
          <Ic n="imageUp" />
        </span>
        تغییر آواتار
      </h3>
      <p className="sd">عکس خودتان یا یکی از طرح‌های فروشگاه؛ در هدر سایت، پنل و زیر نظرهایتان دیده می‌شود.</p>
      <AvatarPicker />
    </section>
  );
}

// تنظیمات حساب: کارت پروفایل (آواتار با پالس، ایمیل، تاریخ عضویت، تعداد سفارش‌ها و خروج) و کارت‌های آواتار، نام کاربری و رمز عبور
export default function SettingsView({ user, placedOrders, onLogout }) {
  return (
    <>
      <ViewHead icon="sliders" title="تنظیمات حساب" sub="آواتار، نام کاربری و رمز عبور" />
      <div className="sgrid">
        <aside className="tile me-card rise" style={{ "--i": 1 }}>
          <div className="me-av">
            <Avatar value={user?.avatar} name={user?.name} size={100} label={user?.name || "حساب کاربری"} />
          </div>
          <h3>{user?.name}</h3>
          <div className="sub">@{user?.username}</div>
          <div className="facts">
            <div className="fact">
              <Ic n="mail" />
              <span>ایمیل</span>
              <b>{user?.email}</b>
            </div>
            {user?.created_at && (
              <div className="fact">
                <Ic n="cal" />
                <span>عضویت از</span>
                <b style={{ direction: "rtl" }}>{dateFa(user.created_at)}</b>
              </div>
            )}
            {placedOrders != null && (
              <div className="fact">
                <Ic n="bag" />
                <span>سفارش‌های ثبت‌شده</span>
                <b style={{ direction: "rtl" }}>{fa(placedOrders)}</b>
              </div>
            )}
          </div>
          <button type="button" className="btn btn-soft-red" onClick={onLogout}>
            <Ic n="out" />
            خروج از حساب
          </button>
        </aside>
        <div className="scol">
          <AvatarCard />
          <UsernameCard />
          <PasswordCard />
        </div>
      </div>
    </>
  );
}
