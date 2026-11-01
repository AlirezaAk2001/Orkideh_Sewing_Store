"use client";

import { useEffect } from "react";

// فقط برای موس: حرکت سه‌بعدی دکمه‌ها (قاعدهٔ «دکمهٔ سه‌بعدی همهٔ دکمه‌ها» در globals.css) سه چیز لازم دارد که CSS تنها نمی‌داند و این‌جا هنگام ورود موس به دکمه
// در همان دکمه می‌گذاریم:
//  --face  رنگِ دیده‌شدهٔ خود دکمه؛ لبهٔ ضخامت از همین رنگ کمی تیره‌تر ساخته می‌شود. رنگ زمینهٔ دکمه و پدرهایش (تا اولین زمینهٔ کدر یا گرادیان) روی هم
//          چیده می‌شود، پس دکمهٔ شیشه‌ای (white/15) یا بی‌زمینه روی صورتی داشبورد لبهٔ صورتی می‌گیرد نه خاکستری. رنگ زمینه با hover عوض می‌شود
//          (hover:bg-...)، پس بعد از پایان گذار رنگ دوباره خوانده می‌شود، و بعد از کلیک هم (مثلاً وقتی تب فعال می‌شود).
//  --s     اندازهٔ بالا آمدن، کج‌شدن و لبه از ۱ (کامل) تا ۰٫۳؛ فقط وقتی کم می‌شود که بالای دکمه، داخل کادر بریده‌شونده یا نوار اسکرول (overflow غیر از visible)،
//          جای کافی نباشد تا لبه‌اش بریده نشود.
//  --z     اندازهٔ «بیرون‌آمدن» به سمت بیننده از ۱ تا ۰ که دکمه را کمی بزرگ می‌کند. دکمهٔ پهن بیشتر از حدود ۱۱ پیکسل بزرگ نمی‌شود (روی لبهٔ موبایل بیرون نزند)،
//          دکمه‌ای که کنار دکمهٔ دیگر چسبیده یا با فاصلهٔ کم است (تب‌های قطعه‌ای) فقط تا نصف فاصله‌اش بزرگ می‌شود تا نیمی از فاصله همیشه خالی بماند و به همسایه‌اش نچسبد، و داخل کادر بریده‌شونده از جای
//          خالی کنارش بزرگ‌تر نمی‌شود.
const SELECTOR = "button:not(.chip-3d, .btn-flat, .delete-btn, .img-slider-dot), .btn-3d";
const GROWTH = 26 / (420 - 26); // درصد بزرگ‌شدن از translateZ(26px) زیر perspective(420px)
const LIFT = 4;
const COLOR = /(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^)]*\)|#[0-9a-f]{3,8}\b/gi;

let pixel = null;
// چند رنگ (از زیر به رو) را روی بوم ۱×۱ روی هم می‌ریزد و رنگ نهایی را برمی‌گرداند؛ بوم هر قالب رنگ (oklch، color-mix، ...) را می‌فهمد
function composite(layers) {
  pixel ??= Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { willReadFrequently: true });
  pixel.clearRect(0, 0, 1, 1);
  for (const css of ["#fff", ...layers]) {
    pixel.fillStyle = "#000";
    pixel.fillStyle = css;
    pixel.fillRect(0, 0, 1, 1);
  }
  const [r, g, b] = pixel.getImageData(0, 0, 1, 1).data;
  return `rgb(${r} ${g} ${b})`;
}

const isClear = (c) => !c || c === "transparent" || c === "rgba(0, 0, 0, 0)";
const isOpaque = (c) => !/\/|rgba|hsla/.test(c);

// رنگ‌های زمینهٔ دکمه و پدرهایش تا اولین پایهٔ کدر؛ دکمهٔ گرادیانی (مثل «ذخیره» در فرم‌های ادمین) با آخرین رنگ گرادیان که تیره‌ترین است
function layersOf(el) {
  const stack = [];
  for (let n = el; n; n = n.parentElement) {
    const cs = getComputedStyle(n);
    const image = cs.backgroundImage !== "none" ? cs.backgroundImage.match(COLOR)?.at(-1) : null;
    const bg = cs.backgroundColor;
    if (image) stack.push(image);
    if (!isClear(bg)) stack.push(bg);
    if (image || (!isClear(bg) && isOpaque(bg))) break;
  }
  stack.reverse();
  // تب فعال زمینه‌اش قرص سفید ::before (useSegmentSlide) است، نه خود دکمه
  if (el.matches(".seg-tab[data-on]")) stack.push(getComputedStyle(el, "::before").backgroundColor);
  return stack;
}

function setFace(el) {
  el.style.setProperty("--face", composite(layersOf(el)));
}

// کمترین فاصلهٔ افقی تا همسایهٔ هم‌ردیف (قبلی و بعدی)؛ با offset* چون ترنسفورم هاور همسایه‌ای که تازه موس را از آن برداشته‌ایم اندازه‌گیری را عوض نمی‌کند
function neighbourGap(el) {
  let gap = Infinity;
  for (const sb of [el.previousElementSibling, el.nextElementSibling]) {
    if (!sb || !sb.offsetWidth || !sb.offsetParent || sb.offsetParent !== el.offsetParent) continue;
    const overlapY = Math.min(el.offsetTop + el.offsetHeight, sb.offsetTop + sb.offsetHeight) - Math.max(el.offsetTop, sb.offsetTop);
    if (overlapY < 2) continue;
    const g = sb.offsetLeft >= el.offsetLeft ? sb.offsetLeft - (el.offsetLeft + el.offsetWidth) : el.offsetLeft - (sb.offsetLeft + sb.offsetWidth);
    if (g >= -0.5) gap = Math.min(gap, Math.max(0, g));
  }
  return gap;
}

function setScale(el) {
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const sideGrowth = (r.width * GROWTH) / 2;
  let z = Math.min(1, 170 / r.width, (neighbourGap(el) / 2) / sideGrowth);
  let roomTop = Infinity;
  for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
    const cs = getComputedStyle(a);
    if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
    const ar = a.getBoundingClientRect();
    z = Math.min(z, (r.left - ar.left) / sideGrowth, (ar.right - r.right) / sideGrowth);
    roomTop = Math.min(roomTop, r.top - ar.top);
  }
  z = Math.max(0, z);
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
