"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/context";
import { toPersianDigits } from "@/lib/format";
import { scrollBehavior } from "@/lib/motion";
import { PenIcon, TrashCan } from "@/app/components/ActionIcons";
import { Ic } from "./icons";
import { fa, toEn } from "./format";
import { MapBox, ViewHead } from "./parts";
import { MAP_KEY, reverseGeocode } from "./mapClient";

// SDK نقشه (حدود ۱٫۹ مگابایت) فقط در مرورگر و فقط بعد از اولین بازشدن فرم بار می‌شود
const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="mp">
      <div className="mp-state" role="status">
        <Ic n="loader" className="spin" /> در حال بارگذاری نقشه…
      </div>
    </div>
  ),
});

const MIN_TEXT = 5;
const PRESETS = ["خانه", "محل کار"];
const OTHER = "دیگر";
const TEHRAN = { lat: 35.6892, lng: 51.389, zoom: 12 };

// نوع عنوان در لیست: «خانه»، «محل کار»، «دیگر» (متن دلخواه) یا خالی (آدرس قدیمی بی‌عنوان)
const kindOf = (title) => (!title ? "" : PRESETS.includes(title) ? title : OTHER);
const titleIcon = (title) => (title === "محل کار" ? "briefcase" : title && title !== "خانه" ? "pin" : "home");
const same = (a, b) => a && b && Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lng - b.lng) < 1e-6;

// آدرس‌ها: کارت نقشه‌دار برای هر آدرس (نقشهٔ واقعی نشان وقتی موقعیت ثبت شده) و یک فرم بازشونده که هم برای افزودن و هم ویرایش است:
// نقشهٔ انتخاب موقعیت (جستجو و GPS؛ آدرس را خودکار پر می‌کند)، عنوان (لیست)، آدرس، پلاک، واحد و کد پستی. حذف دو مرحله‌ای است (سطل ← «بله، حذف شود»)
export default function AddressesView() {
  const { addresses, addAddress, updateAddress, deleteAddress } = useAuth();
  const [open, setOpen] = useState(false);
  const [mapOn, setMapOn] = useState(false); // بعد از اولین بازشدن فرم نقشه بار می‌شود
  const [editId, setEditId] = useState(null); // null = افزودن
  const [kind, setKind] = useState("خانه");
  const [custom, setCustom] = useState("");
  const [text, setText] = useState("");
  const [plate, setPlate] = useState("");
  const [unit, setUnit] = useState("");
  const [postal, setPostal] = useState("");
  const [point, setPoint] = useState(null); // { lat, lng } وقتی کاربر موقعیتی روی نقشه انتخاب کرده
  const [view, setView] = useState({ ...TEHRAN, key: 0 }); // جای شروع نقشه؛ key تازه = بپر
  const [geoText, setGeoText] = useState(""); // آخرین آدرسی که نقشه برای نقطهٔ انتخابی پیدا کرده
  const [saving, setSaving] = useState(false);
  const [askId, setAskId] = useState(null); // کارتی که منتظر تأیید حذف است
  const [deleting, setDeleting] = useState(false);
  const formRef = useRef(null);
  const textRef = useRef(null);
  // مقدار لحظه‌ای برای پاسخ‌های ناهم‌زمان آدرس‌یابی (state آن لحظه کهنه است)
  const valueRef = useRef("");
  const touchedRef = useRef(false); // کاربر خودش آدرس را نوشته/ویرایش کرده؛ آدرس‌یابی نباید رویش بنویسد
  const geoRef = useRef("");
  const pointRef = useRef(null);
  const seq = useRef(0);

  const digits = toEn(postal).replace(/\D/g, "");
  const postalOk = /^\d{10}$/.test(digits);
  const textOk = text.trim().length >= MIN_TEXT;
  const canSave = postalOk && textOk && !saving;

  const setValue = (v, byUser) => {
    valueRef.current = v;
    setText(v);
    if (byUser) touchedRef.current = v.trim() !== "" && v !== geoRef.current;
  };

  const choosePoint = (p) => {
    pointRef.current = p;
    setPoint(p);
  };

  const reset = () => {
    seq.current++;
    setEditId(null);
    setKind("خانه");
    setCustom("");
    setValue("", false);
    touchedRef.current = false;
    geoRef.current = "";
    setGeoText("");
    setPlate("");
    setUnit("");
    setPostal("");
    choosePoint(null);
  };

  const close = () => {
    setOpen(false);
    setTimeout(reset, 300);
  };

  const openForm = (address) => {
    const fresh = !open || address || editId != null;
    if (address) {
      seq.current++;
      setEditId(address.id);
      setKind(kindOf(address.title));
      setCustom(kindOf(address.title) === OTHER ? address.title : "");
      setValue(address.address, false);
      touchedRef.current = true; // متن ذخیره‌شده را آدرس‌یابی ننویسد؛ «پر کردن از روی نقشه» دست کاربر است
      geoRef.current = "";
      setGeoText("");
      setPlate(address.plate || "");
      setUnit(address.unit || "");
      setPostal(address.postalCode);
      const has = Number.isFinite(address.lat) && Number.isFinite(address.lng);
      choosePoint(has ? { lat: address.lat, lng: address.lng } : null);
      if (fresh) setView((v) => ({ ...(has ? { lat: address.lat, lng: address.lng, zoom: 16 } : TEHRAN), key: v.key + 1 }));
    } else {
      if (editId != null) reset();
      if (fresh) setView((v) => ({ ...TEHRAN, key: v.key + 1 }));
    }
    setMapOn(true);
    setOpen(true);
    // فرم از بالای لیست باز می‌شود؛ وقتی کاربر پایین‌تر اسکرول کرده، بعد از شروع باز شدن به دیدش می‌آوریم.
    // با نقشه، افزودنِ تازه فوکوس نمی‌گیرد: اول موقعیت را انتخاب می‌کند و صفحه‌کلید گوشی نقشه را نمی‌پوشاند
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "nearest" });
      if (!MAP_KEY || address) textRef.current?.focus({ preventScroll: true });
    }, 320);
  };

  // نقشه نقطه‌ای را انتخاب کرد (کشیدن، کلیک، نتیجهٔ جستجو یا GPS): موقعیت ثبت و آدرس نوشتاری‌اش در کادر آدرس پر می‌شود
  const onPick = async (lat, lng) => {
    const next = { lat, lng };
    if (same(next, pointRef.current)) return; // فقط بزرگ‌نمایی بود، همان نقطه
    choosePoint(next);
    const id = ++seq.current;
    try {
      const r = await reverseGeocode(lat, lng);
      if (id !== seq.current) return; // نقطهٔ جدیدتری انتخاب شده یا فرم بسته شده
      const found = r.address || "";
      geoRef.current = found;
      setGeoText(found);
      if (found && (!touchedRef.current || !valueRef.current.trim())) {
        touchedRef.current = false;
        setValue(found, false);
      }
    } catch (err) {
      if (id === seq.current) toast.error(err.message, { id: "map-geocode" });
    }
  };

  const clearPoint = () => {
    seq.current++;
    choosePoint(null);
    geoRef.current = "";
    setGeoText("");
  };

  const fillFromMap = () => {
    touchedRef.current = false;
    setValue(geoText, false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    const payload = {
      title: kind === OTHER ? custom.trim() : kind,
      address: text.trim(),
      plate: toEn(plate).trim(),
      unit: toEn(unit).trim(),
      postalCode: digits,
      lat: point ? point.lat : null,
      lng: point ? point.lng : null,
    };
    try {
      if (editId != null) {
        await updateAddress({ id: editId, ...payload });
        toast.success("آدرس با موفقیت به‌روزرسانی شد");
      } else {
        await addAddress(payload);
        toast.success("آدرس با موفقیت اضافه شد");
      }
      close();
    } catch (err) {
      toast.error(err.message || (editId != null ? "خطا در به‌روزرسانی آدرس" : "خطا در افزودن آدرس"));
    }
    setSaving(false);
  };

  const remove = async (a) => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteAddress(a.id);
      toast.success("آدرس حذف شد");
      if (editId === a.id) close();
    } catch (err) {
      toast.error(err.message || "خطا در حذف آدرس");
    }
    setDeleting(false);
    setAskId(null);
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
              <div className="form flf">
                {MAP_KEY
                  ? mapOn && (
                      <div className="field" role="group" aria-labelledby="mp-label">
                        <span id="mp-label" className="flabel">
                          موقعیت روی نقشه (اختیاری)
                        </span>
                        <MapPicker view={view} onPick={onPick} />
                        <div className={`mp-status ${point ? "on" : ""}`}>
                          {point ? (
                            <>
                              <Ic n="check" />
                              موقعیت روی نقشه ثبت شد
                              <button type="button" className="linkbtn" onClick={clearPoint}>
                                برداشتن موقعیت
                              </button>
                            </>
                          ) : (
                            "نقشه را بکشید، جستجو کنید یا موقعیت فعلی‌تان را بزنید؛ آدرس خودکار پر می‌شود."
                          )}
                        </div>
                      </div>
                    )
                  : process.env.NODE_ENV !== "production" && (
                      <div className="mp-note">
                        نقشه غیرفعال است. برای فعال شدن، کلید «نقشهٔ وب» نشان را در <code>NEXT_PUBLIC_NESHAN_MAP_KEY</code> و کلید API را در <code>NESHAN_API_KEY</code> فایل <code>.env</code> بگذارید و سرور را دوباره بسازید/بالا بیاورید. (این یادآوری فقط در حالت توسعه دیده می‌شود.)
                      </div>
                    )}

                {/* برچسب هر باکس داخل خود باکس است (کلاس fl در profile.css): با فوکوس یا پر بودن روی لبهٔ باکس می‌رود و مثال placeholder آن‌وقت دیده می‌شود. برچسب باید بعد از input/textarea بیاید (انتخابگر هم‌نیای ~) و برای select کلاس has نشانهٔ «انتخاب شده» است */}
                <div className="frow">
                  <div className="field fl">
                    <div className={`inp sel ${kind ? "has" : ""}`}>
                      <Ic n={kind === OTHER ? "pin" : titleIcon(kind)} />
                      <select id="a-title" value={kind} onChange={(e) => setKind(e.target.value)}>
                        {kind === "" && (
                          <option value="" disabled>
                            انتخاب کنید
                          </option>
                        )}
                        {PRESETS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                        <option value={OTHER}>دیگر…</option>
                      </select>
                      <Ic n="chevD" className="chev" />
                      <label htmlFor="a-title">عنوان آدرس</label>
                    </div>
                  </div>
                  <div className="field fl">
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
                      <label htmlFor="a-pc">کد پستی</label>
                    </div>
                    <div className={`hint ${postal ? (postalOk ? "ok" : "bad") : ""}`}>{postal && !postalOk ? "کد پستی باید ۱۰ رقم باشد" : ""}</div>
                  </div>
                </div>

                {kind === OTHER && (
                  <div className="field fl">
                    <div className="inp">
                      <Ic n="pencil" />
                      <input id="a-title-custom" maxLength={40} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="مثلاً خانهٔ مادربزرگ" autoComplete="off" />
                      <label htmlFor="a-title-custom">عنوان دلخواه</label>
                    </div>
                  </div>
                )}

                <div className="field fl">
                  <div className="inp">
                    <Ic n="pin" />
                    <textarea id="a-text" ref={textRef} rows={2} value={text} onChange={(e) => setValue(e.target.value, true)} placeholder="استان، شهر، خیابان، کوچه و …" />
                    <label htmlFor="a-text">آدرس</label>
                  </div>
                  {geoText && text.trim() !== geoText && (
                    <div className="hint">
                      <button type="button" className="linkbtn" onClick={fillFromMap}>
                        پر کردن از روی نقشه
                      </button>
                    </div>
                  )}
                </div>

                <div className="frow">
                  <div className="field fl">
                    <div className="inp">
                      <Ic n="hash" />
                      <input id="a-plate" maxLength={20} value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="مثلاً ۱۲" autoComplete="off" />
                      <label htmlFor="a-plate">پلاک</label>
                    </div>
                  </div>
                  <div className="field fl">
                    <div className="inp">
                      <Ic n="door" />
                      <input id="a-unit" maxLength={20} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="مثلاً ۳ (اگر دارد)" autoComplete="off" />
                      <label htmlFor="a-unit">واحد</label>
                    </div>
                  </div>
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
        {addresses.map((a, i) => {
          const label = a.title || `آدرس ${fa(i + 1)}`;
          const asking = askId === a.id;
          return (
            <article className={`tile acard${addresses.length === 1 ? " solo" : ""}`} style={{ "--i": i }} key={a.id}>
              <MapBox key={a.mapUrl || "art"} seed={i} src={a.mapUrl} />
              <div className="abody">
                <h3>
                  <Ic n={titleIcon(a.title)} />
                  {label}
                </h3>
                <p>{toPersianDigits(a.address)}</p>
                <div className="achips">
                  <span className="pc">
                    <Ic n="mail" />
                    {toPersianDigits(a.postalCode)}
                  </span>
                  {a.plate && (
                    <span className="pc plain">
                      <Ic n="hash" />
                      پلاک {toPersianDigits(a.plate)}
                    </span>
                  )}
                  {a.unit && (
                    <span className="pc plain">
                      <Ic n="door" />
                      واحد {toPersianDigits(a.unit)}
                    </span>
                  )}
                </div>
                <div className={`aacts ${asking ? "ask" : ""}`}>
                  <span className="sp" />
                  {asking ? (
                    <>
                      <span className="q">این آدرس حذف شود؟</span>
                      <button type="button" className="bsm danger" onClick={() => remove(a)} disabled={deleting}>
                        {deleting ? "در حال حذف…" : "بله، حذف شود"}
                      </button>
                      <button type="button" className="bsm ghost" onClick={() => setAskId(null)} disabled={deleting}>
                        انصراف
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="ib-btn icon-action" onClick={() => openForm(a)} aria-label={`ویرایش ${label}`} title="ویرایش">
                        <PenIcon />
                      </button>
                      <button type="button" className="ib-btn red icon-action" onClick={() => setAskId(a.id)} aria-label={`حذف ${label}`} title="حذف">
                        <TrashCan />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          );
        })}
        {/* کاشی دعوت فقط وقتی آدرسی نیست (تمام عرض، تا صفحه خالی نماند؛ مثلاً وقتی از سبد خرید برای ثبت آدرس می‌آیند). با آدرس ثبت‌شده، دکمهٔ «آدرس جدید» بالای صفحه کافی است */}
        {addresses.length === 0 && (
          <button type="button" className="newa rise" style={{ "--i": 0, gridColumn: "1 / -1" }} onClick={() => openForm()}>
            <span>
              <span className="pl">
                <Ic n="plus" />
              </span>
              <b>افزودن آدرس تازه</b>
              <small>برای ارسال سریع‌تر سفارش‌ها</small>
            </span>
          </button>
        )}
      </div>
    </>
  );
}
