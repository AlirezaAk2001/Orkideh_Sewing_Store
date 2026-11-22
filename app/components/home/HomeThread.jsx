"use client";

import { useEffect, useRef } from "react";
import { Ruler, Scissors, Spool } from "lucide-react";
import "./thread.css";

const STEP = 640; // ارتفاع هر پیچ نخ (px)
const NEEDLE = 46; // طول سوزن (px)؛ با عرض svg سوزن پایین یکی است
const KEEP = ".hs-text"; // متن‌هایی که نخ باید دورشان بپیچد: عنوان بخش‌ها با برچسب و زیرعنوان و بخیه‌شان (SectionHeading؛ شامل بخش برندها)
const CLEAR_X = 22; // فاصلهٔ نخ از دور هر متن (px)
const CLEAR_Y = 18;
const SAMPLE = 6; // فاصلهٔ نقطه‌های نمونه‌برداری از مسیر (px)

// چهار ابزار خیاطی معلق مثل پنل کاربری (ProfileBackdrop)؛ فقط از ۱۵۰۰ پیکسل به بالا دیده می‌شوند تا روی صفحه‌های باریک شلوغ نشود. جاها درصدی‌اند، چون ارتفاع صفحه ثابت نیست
const TOOLS = [
  { icon: Spool, className: "right-[2.5%] top-[14%] h-16 w-16", style: { "--r": "-8deg", "--dur": "10s" } },
  { icon: Scissors, className: "left-[2%] top-[38%] h-14 w-14", style: { "--r": "12deg", "--dur": "12s", "--delay": "-4s" } },
  { icon: Ruler, className: "right-[3%] top-[62%] h-14 w-14", style: { "--r": "-18deg", "--dur": "11s", "--delay": "-7s" } },
  { icon: Spool, className: "left-[3%] top-[84%] h-16 w-16", style: { "--r": "8deg", "--dur": "12s", "--delay": "-2s" } },
];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const inside = (p, r) => p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h;

// نزدیک‌ترین نقطهٔ مرز مستطیل به p (برای نقطه‌ای که بیرون مستطیل است همان کلمپ‌شده؛ برای نقطهٔ داخل، نزدیک‌ترین ضلع)
function snapToEdge(p, r) {
  let x = clamp(p.x, r.x, r.x + r.w);
  let y = clamp(p.y, r.y, r.y + r.h);
  if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) {
    const d = [x - r.x, r.x + r.w - x, y - r.y, r.y + r.h - y];
    const m = Math.min(...d);
    if (m === d[0]) x = r.x;
    else if (m === d[1]) x = r.x + r.w;
    else if (m === d[2]) y = r.y;
    else y = r.y + r.h;
  }
  return { x, y };
}

// فاصلهٔ پیمایش ساعت‌گرد مرز مستطیل از گوشهٔ بالا-چپ تا نقطه‌ای روی مرز
function perimeterAt(q, r) {
  if (q.y === r.y) return q.x - r.x;
  if (q.x === r.x + r.w) return r.w + (q.y - r.y);
  if (q.y === r.y + r.h) return r.w + r.h + (r.x + r.w - q.x);
  return 2 * r.w + r.h + (r.y + r.h - q.y);
}

// مسیری از a تا b که دور مستطیل r می‌چرخد، نه از میانش. دو راه هست (ساعت‌گرد و پادساعت‌گرد)؛ کوتاه‌تر انتخاب می‌شود، با ۹۰ پیکسل امتیاز برای راهی که
// از گوشهٔ بالا-راست می‌گذرد (عنوان‌ها در سمت راستِ ستون محتوا هستند و نخ همان طرف، از گوشهٔ بیرونی، رد می‌شود). گوشه‌ها داخل [bx0, bx1] می‌مانند تا نخ از صفحه بیرون نزند
function around(r, a, b, bounds) {
  const per = 2 * (r.w + r.h);
  const corners = [
    { x: r.x, y: r.y },
    { x: r.x + r.w, y: r.y },
    { x: r.x + r.w, y: r.y + r.h },
    { x: r.x, y: r.y + r.h },
  ].map((c) => ({ x: clamp(c.x, bounds.min, bounds.max), y: c.y }));
  const cornerAt = [0, r.w, r.w + r.h, 2 * r.w + r.h];
  const qa = snapToEdge(a, r);
  const qb = snapToEdge(b, r);
  const sa = perimeterAt(qa, r);
  const sb = perimeterAt(qb, r);

  const walk = (dir) => {
    const total = dir > 0 ? (sb - sa + per) % per : (sa - sb + per) % per;
    const hits = [];
    corners.forEach((c, index) => {
      const dist = dir > 0 ? (cornerAt[index] - sa + per) % per : (sa - cornerAt[index] + per) % per;
      if (dist > 0 && dist < total) hits.push({ index, dist, c });
    });
    hits.sort((p, q) => p.dist - q.dist);
    const points = [qa, ...hits.map((h) => h.c), qb];
    let len = 0;
    for (let k = 1; k < points.length; k++) len += Math.hypot(points[k].x - points[k - 1].x, points[k].y - points[k - 1].y);
    return { points, score: len - (hits.some((h) => h.index === 1) ? 90 : 0) };
  };

  const cw = walk(1);
  const ccw = walk(-1);
  return (cw.score <= ccw.score ? cw : ccw).points;
}

// همهٔ تکه‌هایی از مسیر که داخل مستطیل r می‌افتند با مسیر دورزننده جایگزین می‌شوند
function detour(points, r, bounds) {
  const out = [];
  let i = 0;
  while (i < points.length) {
    if (!inside(points[i], r)) {
      out.push(points[i]);
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < points.length && inside(points[j + 1], r)) j++;
    const entry = i > 0 ? points[i - 1] : points[i];
    const exit = j + 1 < points.length ? points[j + 1] : points[j];
    out.push(...around(r, entry, exit, bounds));
    i = j + 1;
  }
  return out;
}

// نقطه‌های ناهم‌فاصله را به نقطه‌های هر `step` پیکسل تبدیل می‌کند
function resample(points, step) {
  const out = [points[0]];
  let prev = points[0];
  let carry = 0;
  for (let k = 1; k < points.length; k++) {
    const cur = points[k];
    let segment = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    while (segment > 0 && carry + segment >= step) {
      const t = (step - carry) / segment;
      prev = { x: prev.x + (cur.x - prev.x) * t, y: prev.y + (cur.y - prev.y) * t };
      out.push(prev);
      segment = Math.hypot(cur.x - prev.x, cur.y - prev.y);
      carry = 0;
    }
    carry += segment;
    prev = cur;
  }
  out.push(points[points.length - 1]);
  return out;
}

// میانگین‌گیری متحرک چندبارهٔ نقطه‌ها: گوشه‌های مسیر دورزننده را گرد می‌کند و ابتدا و انتها را ثابت می‌گذارد
function smooth(points, passes = 3) {
  let cur = points;
  for (let pass = 0; pass < passes; pass++) {
    const prev = cur;
    cur = prev.map((p, idx) => {
      if (idx === 0 || idx === prev.length - 1) return p;
      let sx = 0;
      let sy = 0;
      let n = 0;
      for (let d = -2; d <= 2; d++) {
        const q = prev[idx + d];
        if (!q) continue;
        sx += q.x;
        sy += q.y;
        n++;
      }
      return { x: sx / n, y: sy / n };
    });
  }
  return cur;
}

// نخ و سوزن: یک مسیر موجی از راست به چپ و برعکس در کل ارتفاع صفحهٔ اصلی (ریشهٔ همین کامپوننت) کشیده می‌شود. خط‌چین کم‌رنگ کل مسیر است و با اسکرول
// خط پررنگِ «دوخته‌شده» کشیده می‌شود و سوزن، روی همان بخش دوخته‌شده، نوک آن را می‌برد.
// - مسیر از زیر هدر (بالای صفحه) و از راست شروع می‌شود، از پشت هیرو می‌گذرد و زیر کارت بنر از سمت چپ بیرون می‌آید؛ دوخت و سوزن هم از همان ابتدای مسیر
//   با چند پیکسل اسکرول شروع می‌شوند.
// - پیشرفت نسبت اسکرول به کل اسکرول سند است، پس نوک سوزن همیشه نزدیک پنجره است و از بالا تا پایین آن پایین می‌آید.
// - نخ هیچ‌وقت از روی عنوان بخش‌ها (متن، زیرعنوان و بخیه) نمی‌گذرد و بریده هم نمی‌شود: هر جا مسیر موج به یکی از آن‌ها بخورد، مسیر همان‌جا دور آن می‌چرخد
//   (ترجیحاً از گوشهٔ بالا-راستش) و دوباره به موج برمی‌گردد.
// فقط تزئینی است (aria-hidden). بدون جاوااسکریپت چیزی کشیده نمی‌شود؛ با «کاهش حرکت» کل نخ ثابت و کامل دیده می‌شود و سوزن نیست.
// مسیر از اندازهٔ واقعی صفحه ساخته می‌شود و با عوض‌شدن اندازه (تغییر پنجره، بارگذاری عکس و فونت، پایان ظاهرشدن یک بخش) دوباره ساخته می‌شود.
export default function HomeThread() {
  const wrap = useRef(null);
  const svg = useRef(null);
  const ghost = useRef(null);
  const drawn = useRef(null);
  const needle = useRef(null);

  useEffect(() => {
    const root = wrap.current?.parentElement;
    const svgEl = svg.current;
    const ghostEl = ghost.current;
    const drawnEl = drawn.current;
    const needleEl = needle.current;
    if (!root || !svgEl || !ghostEl || !drawnEl || !needleEl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let alive = true;
    let length = 0;
    let scrollFrame = 0;
    let buildFrame = 0;

    const update = () => {
      scrollFrame = 0;
      if (!length) return;
      if (reduced) {
        drawnEl.style.strokeDashoffset = "0";
        return;
      }
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
      const at = length * progress;
      drawnEl.style.strokeDashoffset = String(length - at);
      // سوزن روی بخش دوخته‌شده می‌نشیند: نوکش دقیقاً سرِ خط پررنگ است و ته‌اش (سوراخ نخ) پشت سر، تا هیچ‌جای آن روی خط‌چینِ دوخته‌نشده نیفتد.
      // سوزن خط راست بین دو نقطهٔ مسیر (ته و نوک) است؛ در ۴۶ پیکسل اول مسیر کوتاه‌تر می‌شود (scaleX) و از نوک بیرون می‌آید
      const tip = drawnEl.getPointAtLength(at);
      const tail = drawnEl.getPointAtLength(Math.max(0, at - NEEDLE));
      const chord = Math.hypot(tip.x - tail.x, tip.y - tail.y);
      const deg = (Math.atan2(tip.y - tail.y, tip.x - tail.x) * 180) / Math.PI;
      const cx = (tip.x + tail.x) / 2;
      const cy = (tip.y + tail.y) / 2;
      needleEl.style.transform = `translate(${cx - NEEDLE / 2}px, ${cy - 7}px) rotate(${deg}deg) scaleX(${Math.min(1, chord / NEEDLE)})`;
      // سوزن با کمی اسکرول (چند پیکسل) پیدا می‌شود
      needleEl.classList.toggle("on", window.scrollY > 8 && progress < 0.998);
    };

    const build = () => {
      buildFrame = 0;
      const width = root.clientWidth;
      const height = root.offsetHeight;
      if (!width || !height) return;
      const rootBox = root.getBoundingClientRect();
      svgEl.setAttribute("viewBox", `0 0 ${width} ${height}`);

      // موج پایه: همان مسیر اولیه (از ۹۵٪ عرض تا ۵٪ و برعکس، هر ۶۴۰ پیکسل)
      const xs = [width * 0.95, width * 0.05];
      let base = `M ${xs[0]} -10`;
      let turn = 0;
      for (let y = -10; y < height; y += STEP, turn++) {
        const from = xs[turn % 2];
        const to = xs[(turn + 1) % 2];
        base += ` C ${from} ${y + STEP * 0.45}, ${to} ${y + STEP * 0.55}, ${to} ${y + STEP}`;
      }
      drawnEl.setAttribute("d", base);
      const baseLength = drawnEl.getTotalLength();
      let points = [];
      for (let t = 0; t < baseLength; t += SAMPLE) {
        const p = drawnEl.getPointAtLength(t);
        points.push({ x: p.x, y: p.y });
      }
      const end = drawnEl.getPointAtLength(baseLength);
      points.push({ x: end.x, y: end.y });

      // مستطیل‌های دورزدن: دور متن هر عنوان. مکان از متن خودش (Range) می‌آید، نه از بلوکِ تمام‌عرض. بخشی که هنوز در حال ظاهرشدن است
      // (Reveal: translateY موقت) به‌اندازهٔ همان جابه‌جایی برمی‌گردد؛ با پایان ظاهرشدن دوباره ساخته می‌شود
      const clearances = [];
      root.querySelectorAll(KEEP).forEach((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const box = range.getBoundingClientRect();
        if (!box.width || !box.height) return;
        let shift = 0;
        const wrapper = el.closest("[data-reveal]");
        if (wrapper) {
          try {
            shift = new DOMMatrixReadOnly(getComputedStyle(wrapper).transform).m42;
          } catch {
            shift = 0;
          }
        }
        clearances.push({
          x: box.left - rootBox.left - CLEAR_X,
          y: box.top - rootBox.top - shift - CLEAR_Y,
          w: box.width + CLEAR_X * 2,
          h: box.height + CLEAR_Y * 2,
        });
      });
      const bounds = { min: 4, max: width - 4 };
      clearances.sort((a, b) => a.y - b.y).forEach((r) => (points = detour(points, r, bounds)));

      const final = smooth(resample(points, SAMPLE));
      const d = final.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
      ghostEl.setAttribute("d", d);
      drawnEl.setAttribute("d", d);
      length = drawnEl.getTotalLength();
      drawnEl.style.strokeDasharray = String(length);
      update();
    };

    const onScroll = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(update);
    };
    const scheduleBuild = () => {
      if (!alive) return;
      cancelAnimationFrame(buildFrame);
      buildFrame = requestAnimationFrame(build);
    };
    // پایان ظاهرشدن نرم هر بخش (Reveal) جای عنوان‌هایش را نهایی می‌کند
    const onTransitionEnd = (event) => {
      if (event.target instanceof Element && event.target.hasAttribute("data-reveal")) scheduleBuild();
    };

    build();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", scheduleBuild);
    root.addEventListener("transitionend", onTransitionEnd);
    document.fonts?.ready.then(scheduleBuild);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleBuild);
    observer?.observe(root);

    return () => {
      alive = false;
      cancelAnimationFrame(scrollFrame);
      cancelAnimationFrame(buildFrame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", scheduleBuild);
      root.removeEventListener("transitionend", onTransitionEnd);
      observer?.disconnect();
    };
  }, []);

  return (
    <div ref={wrap} className="ht" aria-hidden="true">
      <svg ref={svg} className="ht-svg">
        <path ref={ghost} className="ht-ghost" />
        <path ref={drawn} className="ht-drawn" />
      </svg>
      <div ref={needle} className="ht-needle">
        <svg width={NEEDLE} height="14" viewBox="0 0 46 14">
          {/* هالهٔ سفید زیر سوزن: سوزن روی خط دوخته‌شده می‌نشیند و باید از آن جدا دیده شود */}
          <path d="M2 7h34" stroke="#fff" strokeOpacity="0.9" strokeWidth="5.2" strokeLinecap="round" fill="none" />
          <path d="M36 5.6 45 7 36 8.4z" fill="#fff" fillOpacity="0.9" stroke="#fff" strokeOpacity="0.9" strokeWidth="2" strokeLinejoin="round" />
          <path d="M2 7h34" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M36 5.6 45 7 36 8.4z" fill="currentColor" />
          <ellipse cx="7" cy="7" rx="3.4" ry="1.8" fill="#fff" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </div>
      {TOOLS.map(({ icon: Icon, className, style }) => (
        <Icon key={className} className={`auth-float absolute hidden text-brand-300/50 min-[1500px]:block ${className}`} style={style} strokeWidth={1.1} />
      ))}
    </div>
  );
}
