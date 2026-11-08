"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Avatar from "@/app/components/Avatar";
import { useAuth } from "@/lib/context";
import { AVATAR_FILE_TYPES, AVATAR_MAX_BYTES, AVATAR_SIZE, PRESETS, avatarChoice, avatarLabel } from "@/lib/avatar";
import { Ic } from "./icons";
import { fa } from "./format";

const MB = 1024 * 1024;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// پیش‌نویس انتخاب از روی آواتار ذخیره‌شدهٔ کاربر: { type: initial | google | preset | photo, key, photo: { src, blob? } | null }
// عکس ذخیره‌شده فقط src دارد؛ عکسِ تازه‌برش‌خورده blob هم دارد و تا «ذخیره» به سرور نمی‌رود
const draftFrom = (user) => {
  const { type, key } = avatarChoice(user?.avatar);
  return { type, key, photo: type === "photo" ? { src: user.avatar } : null };
};

// هندسهٔ برش، همه به‌صورت کسری از ضلع کادر: iw و ih اندازهٔ عکس در کادر، fx و fy جابه‌جایی مرکز عکس (تا جایی که عکس همیشه کادر را کامل بپوشاند)
function geometry(crop) {
  const s1 = crop.zoom / Math.min(crop.w, crop.h);
  const iw = crop.w * s1;
  const ih = crop.h * s1;
  return { s1, iw, ih, fx: clamp(crop.fx, -(iw - 1) / 2, (iw - 1) / 2), fy: clamp(crop.fy, -(ih - 1) / 2, (ih - 1) / 2) };
}

// کادر برش دایره‌ای: کشیدن عکس با ماوس و لمس (یا کلیدهای جهت‌نما) و بزرگ‌نمایی با لغزنده
function CropBox({ crop, onChange, onOk, onCancel }) {
  const g = geometry(crop);
  const drag = useRef(null);
  const set = (patch) => {
    const next = { ...crop, ...patch };
    const fit = geometry(next);
    onChange({ ...next, fx: fit.fx, fy: fit.fy });
  };
  const onDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, fx: g.fx, fy: g.fy, size: e.currentTarget.clientWidth };
  };
  const onMove = (e) => {
    const d = drag.current;
    if (d) set({ fx: d.fx + (e.clientX - d.x) / d.size, fy: d.fy + (e.clientY - d.y) / d.size });
  };
  const onKey = (e) => {
    const move = { ArrowLeft: [-0.03, 0], ArrowRight: [0.03, 0], ArrowUp: [0, -0.03], ArrowDown: [0, 0.03] }[e.key];
    if (!move) return;
    e.preventDefault();
    set({ fx: g.fx + move[0], fy: g.fy + move[1] });
  };
  return (
    <div className="crop">
      <div
        className="crop-vp"
        tabIndex={0}
        role="group"
        aria-label="کادر برش عکس؛ با کلیدهای جهت‌نما جابه‌جا کنید"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={onKey}
      >
        {/* عکس انتخابیِ هنوز برش‌نخورده (blob:) است؛ next/image برایش معنی ندارد */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          src={crop.src}
          draggable={false}
          style={{ width: `${g.iw * 100}%`, height: `${g.ih * 100}%`, left: `${(0.5 - g.iw / 2 + g.fx) * 100}%`, top: `${(0.5 - g.ih / 2 + g.fy) * 100}%` }}
        />
      </div>
      <div className="crop-ctl">
        <Ic n="zoomOut" />
        <input type="range" min="1" max="3" step="0.01" value={crop.zoom} onChange={(e) => set({ zoom: +e.target.value })} aria-label="بزرگ‌نمایی" />
        <Ic n="zoomIn" />
      </div>
      <span className="hint">عکس را بکشید تا جای برش را تنظیم کنید</span>
      <div className="crop-btns">
        <button type="button" className="btn btn-primary sm" onClick={onOk}>
          <Ic n="check" />
          ثبت عکس
        </button>
        <button type="button" className="btn btn-ghost sm" onClick={onCancel}>
          انصراف
        </button>
      </div>
    </div>
  );
}

// انتخاب‌گر آواتار (کارت «تغییر آواتار» در تنظیمات): پیش‌نمایش زنده، عکس شخصی (کشیدن و رها کردن، برش دایره‌ای، کوچک‌سازی به ۲۵۶×۲۵۶ در مرورگر)
// و ۱۲ طرح آمادهٔ فروشگاه. هیچ‌چیز تا «ذخیره» عوض نمی‌شود؛ بعد از ذخیره هدر، پنل و نظرها هم‌زمان عوض می‌شوند
export default function AvatarPicker() {
  const { currentUser: user, setUserAvatar } = useAuth();
  const [draft, setDraft] = useState(() => draftFrom(user));
  const [seen, setSeen] = useState(user?.avatar);
  const [crop, setCrop] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [over, setOver] = useState(false);
  const fileInput = useRef(null);
  const cropImage = useRef(null);

  // آواتار از بیرون عوض شد (بعد از ذخیره): پیش‌نویس از نو از روی آن ساخته می‌شود
  if (user?.avatar !== seen) {
    setSeen(user?.avatar);
    setDraft(draftFrom(user));
  }

  // آدرس‌های blob: هر عکسِ جایگزین‌شده و آنچه با بسته‌شدن کارت می‌ماند آزاد می‌شود
  useEffect(() => {
    const src = draft.photo?.blob ? draft.photo.src : null;
    return () => src && URL.revokeObjectURL(src);
  }, [draft.photo]);
  useEffect(() => () => cropImage.current?.src && URL.revokeObjectURL(cropImage.current.src), []);

  if (!user) return null;

  const saved = avatarChoice(user.avatar);
  const dirty = draft.type !== saved.type || (draft.type === "preset" && draft.key !== saved.key) || (draft.type === "photo" && !!draft.photo?.blob);
  const draftValue = draft.type === "preset" ? `preset:${draft.key}` : draft.type === "photo" ? draft.photo?.src || "" : draft.type === "google" ? user.googleAvatar || "" : "";

  const pick = (type, key = null) => {
    setError("");
    setDraft((d) => ({ ...d, type, key }));
  };

  const closeCrop = () => {
    if (cropImage.current?.src) URL.revokeObjectURL(cropImage.current.src);
    cropImage.current = null;
    setCrop(null);
  };

  const handleFile = (file) => {
    setError("");
    if (!file) return;
    if (!AVATAR_FILE_TYPES.includes(file.type)) return setError("فقط عکس JPG، PNG یا WebP پذیرفته می‌شود.");
    if (file.size > AVATAR_MAX_BYTES) return setError(`حجم عکس (${fa((file.size / MB).toFixed(1))} مگابایت) بیشتر از ${fa(AVATAR_MAX_BYTES / MB)} مگابایت است.`);
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (cropImage.current?.src) URL.revokeObjectURL(cropImage.current.src);
      cropImage.current = image;
      setCrop({ src: url, w: image.naturalWidth, h: image.naturalHeight, zoom: 1, fx: 0, fy: 0 });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("این فایل عکس معتبری نیست.");
    };
    image.src = url;
  };

  // بخشی از عکس که در دایره دیده می‌شود را به بوم ۲۵۶×۲۵۶ می‌کشد و WebP می‌کند (مرورگری که WebP نسازد PNG می‌دهد؛ سرور هر دو را می‌پذیرد)
  const commitCrop = () => {
    const image = cropImage.current;
    if (!crop || !image) return;
    const g = geometry(crop);
    const left = 0.5 - g.iw / 2 + g.fx;
    const top = 0.5 - g.ih / 2 + g.fy;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, -left / g.s1, -top / g.s1, 1 / g.s1, 1 / g.s1, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
    canvas.toBlob(
      (blob) => {
        if (!blob) return setError("برش عکس انجام نشد؛ عکس دیگری را امتحان کنید.");
        closeCrop();
        setDraft({ type: "photo", key: null, photo: { src: URL.createObjectURL(blob), blob } });
      },
      "image/webp",
      0.88
    );
  };

  const removePhoto = () => {
    setError("");
    setDraft((d) => ({ type: d.type === "photo" ? (user.googleAvatar ? "google" : "initial") : d.type, key: d.type === "photo" ? null : d.key, photo: null }));
  };

  const cancel = () => {
    closeCrop();
    setError("");
    setDraft(draftFrom(user));
  };

  const save = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      let res;
      if (draft.type === "photo") {
        const form = new FormData();
        form.append("file", draft.photo.blob, "avatar.webp");
        res = await fetch("/api/user/avatar", { method: "POST", headers, body: form });
      } else {
        res = await fetch("/api/user/avatar", { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ type: draft.type, key: draft.key }) });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "ذخیرهٔ آواتار انجام نشد.");
      setUserAvatar(data);
      toast.success(data.removedPhoto ? "آواتار ذخیره شد و عکس قبلی حذف شد." : "آواتار ذخیره شد.");
    } catch (e) {
      toast.error(e.message || "خطا در ارتباط با سرور.");
    }
    setSaving(false);
  };

  const base = [];
  if (draft.photo) base.push({ type: "photo", label: "عکس شما" });
  if (user.googleAvatar) base.push({ type: "google", label: "عکس گوگل" });
  base.push({ type: "initial", label: "حرف اول نام" });
  const presets = PRESETS.map((p) => ({ type: "preset", key: p.key, label: p.label }));
  const isOn = (t) => draft.type === t.type && (t.type !== "preset" || draft.key === t.key);
  const valueOf = (t) => (t.type === "preset" ? `preset:${t.key}` : t.type === "photo" ? draft.photo.src : t.type === "google" ? user.googleAvatar : "");

  const tiles = (list) =>
    list.map((t) => (
      <button key={`${t.type}:${t.key || ""}`} type="button" role="radio" aria-checked={isOn(t)} className={`pk-tile${isOn(t) ? " on" : ""}`} onClick={() => pick(t.type, t.key)}>
        <span className="avw">
          <Avatar value={valueOf(t)} name={user.name} />
          {t.type === "google" && <i className="gbadge">G</i>}
        </span>
        <i className="chk">
          <Ic n="check" />
        </i>
        <span className="tl">{t.label}</span>
      </button>
    ));

  const kb = draft.photo?.blob ? Math.max(1, Math.round(draft.photo.blob.size / 1024)) : null;
  const warn = saved.type === "photo" && draft.type !== "photo";

  return (
    <div className="picker">
      <div className="pk-top">
        <div className="pk-ring">
          <Avatar value={draftValue} name={user.name} size={84} />
        </div>
        <div className="pk-meta">
          <b>{user.name}</b>
          <div className="un">@{user.username}</div>
          <span className="pk-cur" aria-live="polite">
            <Ic n="check" />
            {avatarLabel(draft.type, draft.key)}
          </span>
        </div>
      </div>

      <div className="pk-block">
        <div className="pk-h">
          <span className="ib">
            <Ic n="imageUp" />
          </span>
          <div>
            <b>عکس شما</b>
            <small>JPG، PNG یا WebP · تا {fa(AVATAR_MAX_BYTES / MB)} مگابایت · دایره‌ای برش می‌خورد</small>
          </div>
        </div>
        {crop ? (
          <CropBox crop={crop} onChange={setCrop} onOk={commitCrop} onCancel={closeCrop} />
        ) : draft.photo ? (
          <div className="ph-row">
            <Avatar value={draft.photo.src} name={user.name} size={64} />
            <div className="info">
              <b>{draft.photo.blob ? "عکس انتخاب‌شده" : "عکس آپلودشده"}</b>
              {fa(AVATAR_SIZE)}×{fa(AVATAR_SIZE)} پیکسل{kb ? ` · حدود ${fa(kb)} کیلوبایت` : ""}
            </div>
            <div className="acts">
              <button type="button" className="btn btn-ghost sm" onClick={() => fileInput.current?.click()}>
                <Ic n="upload" />
                جایگزینی
              </button>
              <button type="button" className="btn btn-soft-red sm" onClick={removePhoto}>
                <Ic n="trash2" />
                حذف عکس
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`dz${over ? " over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              handleFile(e.dataTransfer.files[0]);
            }}
          >
            <span className="ic">
              <Ic n="imageUp" />
            </span>
            <p>
              <b>عکس خود را اینجا رها کنید</b> یا از رایانه‌تان انتخاب کنید.
            </p>
            <button type="button" className="btn btn-primary sm" onClick={() => fileInput.current?.click()}>
              <Ic n="upload" />
              انتخاب عکس
            </button>
          </div>
        )}
        {error && (
          <div className="pk-err" role="alert">
            {error}
          </div>
        )}
        <input
          ref={fileInput}
          className="sr"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            handleFile(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>

      <div className="pk-block">
        <div className="pk-h">
          <span className="ib">
            <Ic n="sparkles" />
          </span>
          <div>
            <b>انتخاب آواتار</b>
            <small>یکی را برگزینید؛ پیش‌فرض حرف اول نام شماست</small>
          </div>
        </div>
        <div role="radiogroup" aria-label="آواتارها">
          <div className="pk-grid">{tiles(base)}</div>
          <div className="pk-sep">
            <span>طرح‌های فروشگاه</span>
          </div>
          <div className="pk-grid">{tiles(presets)}</div>
        </div>
      </div>

      {warn && <div className="pk-warn">با ذخیره، عکس آپلودشدهٔ فعلی شما حذف می‌شود.</div>}

      <div className="pk-foot">
        <span className="sp">{dirty ? "تغییرها هنوز ذخیره نشده‌اند" : ""}</span>
        <button type="button" className="btn btn-ghost sm" onClick={cancel} disabled={(!dirty && !crop) || saving}>
          انصراف
        </button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={!dirty || saving}>
          {saving && <Ic n="loader" className="spin" />}
          {saving ? "در حال ذخیره…" : "ذخیرهٔ آواتار"}
        </button>
      </div>
    </div>
  );
}
