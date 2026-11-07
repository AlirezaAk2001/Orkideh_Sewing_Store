"use client";

import { useCallback, useRef } from "react";

// تکه‌های مشترک «گوی براق جستجو» (کلاس‌های xs-* در globals.css): حباب‌هایی که از گوی بالا می‌روند، حلقهٔ هاور که دور گوی کشیده می‌شود،
// حلقهٔ «در حال جستجو» که با هر تایپ دور گوی می‌چرخد، و هوک کجی سه‌بعدی گوی به سمت نشانگر. پوستهٔ گوی (xs-skin) را هر کامپوننت خودش می‌گذارد
// چون ExpandSearch آن را داخل لایهٔ مایع (xs-goo) می‌برد.
const BUBBLES = [
  { left: "20%", top: "4%", "--dx": "-6px", animationDelay: "0s" },
  { left: "58%", top: "2%", "--dx": "8px", width: "6px", height: "6px", animationDelay: "1.3s" },
  { left: "38%", top: "6%", "--dx": "2px", width: "5px", height: "5px", animationDelay: "2.4s" },
];

export function OrbBubbles() {
  return BUBBLES.map((style, i) => <i key={i} className="xs-bubble" style={style} aria-hidden="true" />);
}

// حلقهٔ هاور: با هاور درست روی حاشیهٔ گوی کشیده می‌شود (xs-halo در CSS؛ فاصله و ضخامتش آنجا حساب شده)
export function OrbHalo() {
  return (
    <svg className="xs-halo" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="45.3" pathLength="1" />
    </svg>
  );
}

// حلقهٔ «در حال جستجو»: وقتی والد (.is-busy) روشن است کمانی دور گوی می‌چرخد
export function OrbBusy() {
  return (
    <svg className="xs-busy" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="47" pathLength="1" />
    </svg>
  );
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// کجی سه‌بعدی گوی و نوری که دنبال نشانگر می‌آید. orbRef روی خود گوی (xs-orb) و دو هندلر روی عنصری که هاور می‌گیرد (گوی یا دکمه‌ای که گوی داخل آن است) می‌روند.
// مقدارها فقط متغیر CSS و صفت data-hot روی گوی (و روی همان عنصر هاورشونده)اند (بدون state و رندر دوباره)؛ لمس نادیده گرفته می‌شود.
// data-hot یعنی «نشانگر واقعاً روی این حرکت کرده» و افکت‌های هاور در CSS به آن بسته‌اند، نه به :hover: وقتی فیلدی جمع می‌شود و گوی زیر نشانگرِ ایستاده می‌ماند
// (یا نشانگر هنگام جمع‌شدن لحظه‌ای روی گوی می‌افتد) افکتی نمی‌پرد. reset() همه را پاک می‌کند؛ باز و بسته‌شدن فیلد آن را صدا می‌زند.
// tilt: false = شکل گوی هرگز عوض نمی‌شود (نه کجی، نه بزرگ‌شدن) و فقط نور براق دنبال نشانگر می‌آید؛ برای فیلد هدر که نشانگر سرتاسر یک فیلد پهن می‌چرخد و کجی به سمت نقطه‌ای دور گوی را می‌پیچاند.
export function useOrbTilt({ tilt = true } = {}) {
  const orbRef = useRef(null);
  const hostRef = useRef(null);
  const onPointerMove = useCallback(
    (e) => {
    const el = orbRef.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const px = clamp((e.clientX - r.left) / r.width, -0.6, 1.6);
    const py = clamp((e.clientY - r.top) / r.height, -0.6, 1.6);
    if (tilt) {
      el.style.setProperty("--ry", `${((px - 0.5) * 24).toFixed(1)}deg`);
      el.style.setProperty("--rx", `${((0.5 - py) * 24).toFixed(1)}deg`);
      el.style.setProperty("--sc", "1.1");
    }
    el.style.setProperty("--gx", `${(clamp(px, 0, 1) * 100).toFixed(0)}%`);
    el.style.setProperty("--gy", `${(clamp(py, 0, 1) * 100).toFixed(0)}%`);
    el.setAttribute("data-hot", "");
    const host = e.currentTarget;
    if (host !== el) host.setAttribute("data-hot", "");
    hostRef.current = host;
    },
    [tilt],
  );
  const reset = useCallback(() => {
    const el = orbRef.current;
    if (el) {
      for (const k of ["--rx", "--ry", "--sc", "--gx", "--gy"]) el.style.removeProperty(k);
      el.removeAttribute("data-hot");
    }
    hostRef.current?.removeAttribute("data-hot");
    hostRef.current = null;
  }, []);
  return { orbRef, onPointerMove, onPointerLeave: reset, reset };
}
