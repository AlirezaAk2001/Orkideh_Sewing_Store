"use client";

import { useEffect, useRef } from "react";

// شست اسکرول سفارشی (ظاهر در globals.css: .sb-track و .sb-thumb). مرورگر اجازه نمی‌دهد نشانگر ماوس روی اسکرول‌بار بومی عوض شود و رنگ و ضخامتش هم نرم تغییر نمی‌کند،
// برای همین زیر ماوس (hover:hover و pointer:fine) اسکرول‌بار بومیِ این اسکرولرها پنهان است (کلاس .sb-hide / html) و این شست به‌جایش می‌آید: سمت راست،
// نازک، با هاور نرم (ضخامت و رنگ) و نشانگر «دست باز» که با کلیک «مشت» می‌شود تا رها کردن. اسکرول با چرخ، کیبورد و لمس همان بومی است؛ این‌جا فقط نشانگر است و کشیدن شست و کلیک روی ریل.
// page = اسکرول خود صفحه (ریل fixed کنار پنجره، PageScrollbar)، وگرنه scrollerRef اسکرولری است که ریل روی لبهٔ راست والدِ relative آن می‌نشیند (ScrollArea).
// topSelector = عنصر چسبانِ بالای ناحیهٔ اسکرول (هدر سایت برای صفحه، سرستون جدول برای جدول، با page: document.querySelector، وگرنه داخل خود اسکرولر): ریل از زیر آن شروع می‌شود،
// پس شست روی هدر نمی‌افتد و نقطهٔ شروع اسکرول همان‌جاست که محتوای قابل‌اسکرول شروع می‌شود.
// شست فقط وقتی دیده می‌شود که محتوا واقعاً از قاب بلندتر باشد: جابه‌جایی transform انیمیشن ورود (که scrollHeight را چند پیکسل بیشتر نشان می‌دهد) و اسکلتونِ بلند حساب نمی‌شوند،
// پس هنگام ورود صفحه یا جدول کوتاه شستِ لحظه‌ای نمی‌آید. روی لفاف ScrollArea هم data-sb-on می‌گذارد (برای مسیر کنار جدول، lane) و --sb-top (ارتفاع سرستون، برای پوشش کنار آن)
const INSET = 2; // فاصلهٔ ریل از بالا و پایین (px)؛ همان 2px پیش‌فرض top/bottom در .sb-track
const MIN_THUMB = 40;

export default function ScrollThumb({ scrollerRef, page = false, topSelector }) {
  const trackRef = useRef(null);
  const thumbRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return undefined;

    const scroller = () => (page ? document.scrollingElement || document.documentElement : scrollerRef?.current);
    const viewH = (el) => (page ? window.innerHeight : el.clientHeight);
    const topEl = () => (topSelector ? (page ? document.querySelector(topSelector) : scroller()?.querySelector(topSelector)) : null);
    // وقتی دیالوگ MUI صفحه را قفل می‌کند (overflow:hidden روی body) صفحه دیگر اسکرول نمی‌خورد و شست هم نباید باشد
    const locked = () => page && [document.body, document.documentElement].some((n) => ["hidden", "clip"].includes(getComputedStyle(n).overflowY));
    // انیمیشن‌های متناهیِ در حال اجرا (ورود ردیف‌ها و صفحه: translateY چند پیکسلی). گذارها (CSSTransition) و انیمیشن‌های بی‌پایان (اسکلتون، زنگ) حساب نمی‌شوند
    const animating = () => {
      const root = page ? document : scroller();
      if (!root || typeof root.getAnimations !== "function") return false;
      const list = page ? root.getAnimations() : root.getAnimations({ subtree: true });
      return list.some((a) => {
        if ("transitionProperty" in a || (a.playState !== "running" && a.playState !== "pending")) return false;
        if (!Number.isFinite(a.effect?.getComputedTiming?.().endTime)) return false;
        return !a.effect.target?.closest?.(".sb-track");
      });
    };
    // ارتفاع محتوا طبق چیدمان، بدون جابه‌جایی transform فرزندان (scrollHeight جابه‌جایی انیمیشن ورود را هم جای قابل‌اسکرول حساب می‌کند و برای چند صد میلی‌ثانیه
    // شستِ بی‌مورد نشان می‌داد). از فرزندان مستقیم (offsetTop و offsetHeight، که transform را نمی‌بینند) و padding پایین اسکرولر؛ اگر نشد null
    const layoutHeight = (el) => {
      if (page) return document.body.offsetHeight + document.body.offsetTop;
      const own = el.offsetParent;
      let bottom = -1;
      for (const c of el.children) {
        const p = c.offsetParent;
        const top = p === el ? c.offsetTop : p === own && own ? c.offsetTop - el.offsetTop : null;
        if (top === null) return null;
        bottom = Math.max(bottom, top + c.offsetHeight + (parseFloat(getComputedStyle(c).marginBottom) || 0));
      }
      return bottom < 0 ? null : bottom + (parseFloat(getComputedStyle(el).paddingBottom) || 0);
    };
    // اندازهٔ ناحیهٔ ریل: ارتفاع دید منهای ارتفاع هدر چسبان و دو فاصله. scrollH در زمان انیمیشن ورود از روی چیدمان است، نه از scrollHeight
    const geometry = () => {
      const el = scroller();
      if (!el) return null;
      const ch = viewH(el);
      const t = topEl();
      const top = t ? Math.max(0, page ? t.getBoundingClientRect().bottom : t.offsetHeight) : 0;
      let scrollH = el.scrollHeight;
      if (scrollH > ch + 1 && animating()) {
        const lh = layoutHeight(el);
        if (lh !== null) scrollH = Math.min(scrollH, Math.max(ch, lh));
      }
      return { el, ch, top, scrollH, room: scrollH - ch, trackH: ch - top - INSET * 2 };
    };

    let raf = 0;
    let drag = null;
    // لفاف ScrollArea (برای مسیر کنار جدول: data-sb-on فضای شست را رزرو می‌کند و --sb-top ارتفاع سرستون است که پوشش کنار آن را می‌سازد)
    const area = page ? null : track.parentElement;
    const setOn = (on, top = 0) => {
      if (on) track.removeAttribute("data-off");
      else track.setAttribute("data-off", "");
      if (!area) return;
      area.toggleAttribute("data-sb-on", on);
      if (on) area.style.setProperty("--sb-top", `${top}px`);
    };

    const update = () => {
      raf = 0;
      const g = geometry();
      if (!g) return;
      // اسکلتون (.animate-pulse) جای‌نگهدار است، نه محتوا: تا وقتی داخل اسکرولر هست شست نباید دیده شود (وگرنه با اسکلتونِ بلند شست می‌آمد و با رسیدن داده‌های کم‌تر می‌پرید)
      if (g.room <= 1 || g.trackH <= MIN_THUMB || locked() || (!page && g.el.querySelector(".animate-pulse"))) {
        setOn(false);
        return;
      }
      setOn(true, g.top);
      track.style.top = `${g.top + INSET}px`;
      const thumbH = Math.max(MIN_THUMB, (g.trackH * g.ch) / g.scrollH);
      const y = (g.trackH - thumbH) * Math.min(1, Math.max(0, g.el.scrollTop / g.room));
      thumb.style.height = `${thumbH}px`;
      thumb.style.transform = `translateY(${y}px)`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    const scrollTarget = page ? window : scroller();
    scrollTarget.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // انیمیشن ورودِ کارت‌ها و ردیف‌ها (translateY) تا پایانش جای قابل‌اسکرول را چند پیکسل بیشتر نشان می‌دهد و بعد بدون هیچ تغییر اندازه‌ای برمی‌گردد؛
    // با پایان انیمیشن (و گذار، فقط داخل اسکرولر) دوباره می‌سنجیم تا شستِ بی‌مورد روی اسکرولری که اسکرول ندارد نماند
    const settleTarget = page ? document : scroller();
    settleTarget.addEventListener("animationend", schedule, true);
    settleTarget.addEventListener("animationcancel", schedule, true);
    if (!page) settleTarget.addEventListener("transitionend", schedule, true);

    // اندازهٔ اسکرولر و فرزندان مستقیمش (و برای صفحه: html و body)، و هدر چسبان را می‌پاییم؛ فرزند تازه هم با MutationObserver به فهرست می‌آید
    const ro = new ResizeObserver(schedule);
    const watch = () => {
      ro.disconnect();
      if (page) {
        ro.observe(document.documentElement);
        ro.observe(document.body);
      } else {
        const el = scroller();
        ro.observe(el);
        for (const child of el.children) ro.observe(child);
      }
      const t = topEl();
      if (t) ro.observe(t);
    };
    watch();
    const mo = new MutationObserver(() => {
      watch();
      schedule();
    });
    if (page) {
      mo.observe(document.body, { attributes: true, attributeFilter: ["style", "class"], childList: true });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class"] });
    } else {
      mo.observe(scroller(), { childList: true });
    }

    // کشیدن: pointermove و pointerup روی window گوش داده می‌شوند (نه pointer capture روی شست: کروم capture را با اولین جابه‌جایی صفحه رها می‌کرد)، پس حتی وقتی نشانگر از شست بیرون رفت کشیدن ادامه دارد
    const onMove = (e) => {
      if (drag) scroller().scrollTop = drag.top + (e.clientY - drag.y) * drag.k;
    };
    const onUp = () => {
      if (!drag) return;
      drag = null;
      thumb.removeAttribute("data-dragging");
      document.documentElement.classList.remove("sb-dragging");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    const onDown = (e) => {
      if (e.button !== 0) return;
      const g = geometry();
      if (!g) return;
      if (e.target === thumb) {
        e.preventDefault();
        drag = { y: e.clientY, top: g.el.scrollTop, k: g.room / Math.max(1, g.trackH - thumb.offsetHeight) };
        thumb.setAttribute("data-dragging", "");
        document.documentElement.classList.add("sb-dragging");
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
      } else {
        // کلیک روی ریل، مثل اسکرول‌بار بومی: یک صفحه به سمت کلیک
        g.el.scrollBy({ top: (e.clientY < thumb.getBoundingClientRect().top ? -1 : 1) * g.ch * 0.9, behavior: "smooth" });
      }
    };
    // چرخ ماوس روی ریل هم همان اسکرولر را بچرخاند (ریل داخل اسکرولر نیست و وگرنه والد بیرونی اسکرول می‌خورد)
    const onWheel = (e) => {
      const el = scroller();
      if (!el) return;
      e.preventDefault();
      el.scrollBy({ top: e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * viewH(el) : e.deltaY });
    };
    track.addEventListener("pointerdown", onDown);
    track.addEventListener("wheel", onWheel, { passive: false });

    schedule();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      scrollTarget.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      settleTarget.removeEventListener("animationend", schedule, true);
      settleTarget.removeEventListener("animationcancel", schedule, true);
      if (!page) settleTarget.removeEventListener("transitionend", schedule, true);
      ro.disconnect();
      mo.disconnect();
      track.removeEventListener("pointerdown", onDown);
      track.removeEventListener("wheel", onWheel);
      onUp();
    };
  }, [page, scrollerRef, topSelector]);

  // data-off از اول هست و فقط به‌دست در effect برداشته می‌شود (state نیست، پس رندر دوباره آن را برنمی‌گرداند)
  return (
    <div ref={trackRef} data-off="" aria-hidden="true" className={`sb-track${page ? " sb-track--page" : ""}`}>
      <div ref={thumbRef} className="sb-thumb" />
    </div>
  );
}
