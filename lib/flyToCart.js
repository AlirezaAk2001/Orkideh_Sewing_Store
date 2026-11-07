import { prefersReducedMotion } from "./motion";

// پرواز تصویر محصول به آیکون سبد خرید هدر (مرحلهٔ ۵): بعد از «افزودن به سبد» یک تصویر کوچک از محصول روی یک مسیر قوسی به سبد می‌رود و آیکون سبد
// هنگام رسیدن یک تکان کوچک می‌خورد. فقط تزئینی است: با «کاهش حرکت»، بدون آیکون سبد در هدر یا بدون تصویر هیچ کاری نمی‌کند و هیچ‌وقت خطا نمی‌دهد.
// عنصر پروازی فقط تا پایان انیمیشن در body می‌ماند، pointer-events ندارد و برای صفحه‌خوان پنهان است.

const SIZE = 72;
const DURATION = 760;
const CART_LINK = 'header a[aria-label="سبد خرید"]';

// بهترین تصویر برای شروع پرواز: اگر خودِ img داده شده همان؛ اگر ظرف داده شده، تصویری که بیشترین سطح آن در پنجره دیده می‌شود (اسلایدر چند تصویر دارد)
function bestImage(root) {
  if (!root) return null;
  if (root.tagName === "IMG") return root;
  let best = null;
  let bestArea = 0;
  for (const img of root.querySelectorAll("img")) {
    const r = img.getBoundingClientRect();
    const w = Math.min(r.right, window.innerWidth) - Math.max(r.left, 0);
    const h = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
    const area = Math.max(0, w) * Math.max(0, h);
    if (area > bestArea) {
      best = img;
      bestArea = area;
    }
  }
  return best ?? root.querySelector("img");
}

function visibleCenter(rect) {
  const left = Math.max(rect.left, 0);
  const right = Math.min(rect.right, window.innerWidth);
  const top = Math.max(rect.top, 0);
  const bottom = Math.min(rect.bottom, window.innerHeight);
  if (right - left < 8 || bottom - top < 8) return null;
  return { x: (left + right) / 2, y: (top + bottom) / 2 };
}

// تکان رسیدن روی آیکون سبد
function landOn(target) {
  try {
    target.animate(
      [
        { transform: "none" },
        { transform: "scale(1.28) rotate(-9deg)", offset: 0.35 },
        { transform: "scale(0.94) rotate(5deg)", offset: 0.7 },
        { transform: "none" },
      ],
      { duration: 480, easing: "ease-out" }
    );
  } catch {
    /* بدون Web Animations بی‌صدا رد می‌شود */
  }
}

// source: عنصر img یا ظرفی که تصویر محصول در آن است؛ trigger: دکمه‌ای که کاربر زده (اگر تصویر در پنجره دیده نمی‌شود، پرواز از خود دکمه شروع می‌شود)
export function flyToCart(source, trigger) {
  try {
    if (typeof document === "undefined" || prefersReducedMotion() || typeof document.body.animate !== "function") return;
    const target = document.querySelector(CART_LINK);
    const img = bestImage(source);
    const src = img?.currentSrc || img?.src;
    if (!target || !src) return;
    const to = target.getBoundingClientRect();
    if (!to.width || !to.height) return;

    const from = (img && visibleCenter(img.getBoundingClientRect())) ?? (trigger && visibleCenter(trigger.getBoundingClientRect()));
    if (!from) return;

    const x0 = from.x - SIZE / 2;
    const y0 = from.y - SIZE / 2;
    const x1 = to.left + to.width / 2 - SIZE / 2;
    const y1 = to.top + to.height / 2 - SIZE / 2;
    // نقطهٔ میانی قوس: وسط راه و کمی بالاتر از هر دو سر مسیر
    const xm = (x0 + x1) / 2;
    const ym = Math.min(y0, y1) - 64;

    const el = document.createElement("img");
    el.src = src;
    el.alt = "";
    el.setAttribute("aria-hidden", "true");
    Object.assign(el.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: `${SIZE}px`,
      height: `${SIZE}px`,
      objectFit: "cover",
      border: "2px solid #fff",
      borderRadius: "16px",
      boxShadow: "0 10px 30px rgb(0 0 0 / 0.28)",
      // بالاتر از پیام‌ها (react-hot-toast از ۹۹۹۹ استفاده می‌کند): پیام تأیید روی آیکون‌های هدر می‌نشیند و پرواز باید روی آن هم دیده شود
      zIndex: "10000",
      pointerEvents: "none",
      opacity: "0",
      willChange: "transform, opacity",
    });
    document.body.appendChild(el);

    const cleanup = () => el.remove();
    const flight = el.animate(
      [
        { transform: `translate(${x0}px, ${y0}px) scale(0.55)`, opacity: 0 },
        { transform: `translate(${x0}px, ${y0}px) scale(1)`, opacity: 1, offset: 0.14 },
        { transform: `translate(${xm}px, ${ym}px) scale(0.72)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${x1}px, ${y1}px) scale(0.14)`, opacity: 0.4 },
      ],
      { duration: DURATION, easing: "cubic-bezier(0.45, 0.05, 0.4, 1)", fill: "forwards" }
    );
    flight.onfinish = () => {
      cleanup();
      landOn(target);
    };
    flight.oncancel = cleanup;
    // اگر تب پس‌زمینه بود و انیمیشن تمام نشد، عنصر در صفحه نمی‌ماند
    setTimeout(cleanup, DURATION + 600);
  } catch {
    /* پرواز تزئینی است؛ هر مشکلی بی‌صدا رد می‌شود */
  }
}
