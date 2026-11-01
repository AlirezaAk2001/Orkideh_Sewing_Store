"use client";

import { useEffect } from "react";

// فقط برای موس: حرکت سه‌بعدی دکمه‌ها (قاعدهٔ «دکمهٔ سه‌بعدی همهٔ دکمه‌ها» در globals.css) دو چیز لازم دارد که CSS تنها نمی‌داند و این‌جا هنگام ورود موس به دکمه
// در همان دکمه می‌گذاریم:
//  --face  رنگ زمینهٔ خود دکمه؛ لبهٔ ضخامت از همین رنگ کمی تیره‌تر ساخته می‌شود. دکمهٔ بی‌زمینه چیزی نمی‌گیرد و لبهٔ خاکستری می‌شود.
//          رنگ زمینه با hover عوض می‌شود (hover:bg-...)، پس بعد از پایان گذار رنگ دوباره خوانده می‌شود تا لبه با رنگ نهایی بخواند، و بعد از کلیک هم
//          (مثلاً وقتی تب فعال می‌شود و زمینه‌اش سفید می‌شود).
//  --s     اندازهٔ بالا آمدن، کج‌شدن و لبه از ۱ (کامل) تا ۰٫۳؛ --z اندازهٔ «بیرون‌آمدن» به سمت بیننده از ۱ تا ۰٫۲ که دکمه را کمی بزرگ می‌کند.
//          دکمهٔ پهن بیشتر از حدود ۱۱ پیکسل بزرگ نمی‌شود (--z، تا روی لبهٔ موبایل بیرون نزند) و دکمه‌ای که داخل کادر بریده‌شونده یا نوار اسکرول است
//          (overflow غیر از visible) از جای خالی بالا و کنارش بیشتر بالا نمی‌آید و بزرگ نمی‌شود تا لبه‌اش بریده نشود.
const SELECTOR = "button:not(.chip-3d, .btn-flat, .delete-btn, .img-slider-dot), .btn-3d";
const GROWTH = 26 / (420 - 26); // درصد بزرگ‌شدن از translateZ(26px) زیر perspective(420px)
const LIFT = 4;

const COLOR = /(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^)]*\)|#[0-9a-f]{3,8}\b/gi;

// دکمه با گرادیان (مثل «ذخیره» در فرم‌های ادمین) زمینهٔ تک‌رنگ ندارد؛ آخرین رنگ گرادیان را می‌گیریم که تیره‌ترین است
function faceOf(cs) {
  if (cs.backgroundImage !== "none") return cs.backgroundImage.match(COLOR)?.at(-1) ?? null;
  const bg = cs.backgroundColor;
  return !bg || /^(transparent|rgba\(0, 0, 0, 0\))$/.test(bg) ? null : bg;
}

function setFace(el) {
  const face = faceOf(getComputedStyle(el));
  if (face) el.style.setProperty("--face", face);
  else el.style.removeProperty("--face");
}

function setScale(el) {
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return;
  // --z فقط «بیرون‌آمدن» (translateZ) را کم می‌کند، چون عرض دکمه را بزرگ می‌کند؛ بالا آمدن و لبه فقط با جای خالی بالا کم می‌شوند (--s)
  const sideGrowth = (r.width * GROWTH) / 2;
  let z = Math.min(1, 170 / r.width);
  let roomTop = Infinity;
  for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
    const cs = getComputedStyle(a);
    if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
    const ar = a.getBoundingClientRect();
    z = Math.min(z, (r.left - ar.left) / sideGrowth, (ar.right - r.right) / sideGrowth);
    roomTop = Math.min(roomTop, r.top - ar.top);
  }
  z = Math.max(0.2, z);
  const s = Math.min(1, (roomTop - (r.height * GROWTH * z) / 2) / LIFT);
  el.style.setProperty("--z", z.toFixed(2));
  el.style.setProperty("--s", Math.max(0.3, s).toFixed(2));
}

export default function ButtonDepth() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;

    const find = (target) => (target instanceof Element ? target.closest(SELECTOR) : null);
    const onOver = (e) => {
      const el = find(e.target);
      if (!el || el.contains(e.relatedTarget)) return;
      setFace(el);
      setScale(el);
    };
    const onTransitionEnd = (e) => {
      if (e.propertyName !== "background-color") return;
      const el = find(e.target);
      if (el === e.target && el.matches(":hover")) setFace(el);
    };
    const onClick = (e) => {
      const el = find(e.target);
      if (!el) return;
      // بعد از کلیک وضعیت (و رنگ) دکمه تازه عوض می‌شود؛ دو فریم صبر تا رنگ جدید خوانده شود
      requestAnimationFrame(() => requestAnimationFrame(() => el.isConnected && el.matches(":hover") && setFace(el)));
    };

    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("transitionend", onTransitionEnd, { passive: true });
    document.addEventListener("click", onClick, { passive: true });
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("transitionend", onTransitionEnd);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
