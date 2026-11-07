"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal, flushSync } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Clock, PackageSearch, SearchX, X } from "lucide-react";
import AppImage from "./AppImage";
import ScrollArea from "./ScrollArea";
import SearchGlyph from "./SearchGlyph";
import { OrbBubbles, OrbBusy, useOrbTilt } from "./SearchOrb";

const fa = (n) => Number(n).toLocaleString("fa-IR");

// جستجوی هدر فروشگاه. در هدر همیشه یک فیلد ثابت دیده می‌شود (دکمهٔ شبیه فیلد با گوی براقِ معلق و نوشتهٔ راهنمای چرخان؛ با هاور حلقه‌ای دور گوی کشیده می‌شود)؛
// با کلیک روی آن (یا کلید «/» و Ctrl+K) کارت جستجو از جای گوی به‌صورت فنری باز می‌شود و صفحهٔ پشت آن کم‌نور و مات می‌شود. در کارت: فیلد، جستجوهای اخیر و دسته‌ها،
// و نتایج زندهٔ /api/search با هایلایت نوشته. با هر حرفی که کاربر می‌نویسد کمانی دور گوی داخل کارت می‌چرخد (= در حال جستجو) تا نتیجه برسد.
// کیبورد: ↑ ↓ بین ردیف‌ها (اخیرها یا نتایج و «مشاهدهٔ همهٔ نتایج») می‌گردد، Enter ردیف انتخاب‌شده را باز می‌کند (بدون انتخاب: /products?q=...)، Esc می‌بندد و فوکوس را به فیلد هدر برمی‌گرداند.
// ظاهر و حرکت‌ها: بخش «جستجو» در globals.css (.xs-* مشترک با ExpandSearch، .hs-* فیلد هدر و ردیف نتایج، .sp-* کارت). disabled = صفحهٔ تعمیرات یا هدر هنوز بارگذاری می‌شود.
// روی گوشی فیلد ردیف دوم هدر است و با اسکرول به پایین جمع می‌شود (با باز بودن کارت یا اسکرول به بالا دوباره می‌آید) تا هدر چسبان جای صفحه را نخورد
const HINTS = ["جستجو در فروشگاه چرخ خیاطی ارکیده", "مثلاً ژانومه ۶۲۵", "سردوز، پدال یا لوازم جانبی", "نام برند یا محصول را بنویسید"];
const DEBOUNCE_MS = 350;
const TYPING_MS = 800; // بعد از آخرین حرف، کمان «در حال جستجو» دست‌کم یک دور کامل می‌چرخد
const RECENT_KEY = "orkideh:recent-searches";
const RECENT_MAX = 5;
const isTyping = (t) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
const subscribeNothing = () => () => {};

const readRecents = () => {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(list) ? list.filter((x) => typeof x === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return []; // حافظهٔ مرورگر بسته یا خراب است: بدون اخیرها ادامه می‌دهیم
  }
};
const writeRecents = (list) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // حافظه پر یا بسته است؛ فقط اخیرها ذخیره نمی‌شوند
  }
};

// نوشتهٔ جست‌وجوشده داخل نام محصول هایلایت می‌شود
function Highlight({ text, query }) {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="hs-mark">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

function Skeleton() {
  return Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="flex animate-pulse items-center gap-3 p-2.5">
      <div className="h-12 w-12 rounded-xl bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-3/5 rounded-full bg-gray-200" />
        <div className="h-3 w-2/5 rounded-full bg-gray-100" />
      </div>
      <div className="h-4 w-20 rounded-full bg-gray-200" />
    </div>
  ));
}

// نوشتهٔ راهنمایی که هر چند ثانیه با محو و جابه‌جایی نرم عوض می‌شود
function RotatingHint({ index }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span key={index} className="block truncate" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.28 }}>
        {HINTS[index]}
      </motion.span>
    </AnimatePresence>
  );
}

export default function HeaderSearch({ disabled = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const uid = useId();
  const listId = `${uid}-list`;
  const triggerRef = useRef(null);
  const layerRef = useRef(null);
  const cardRef = useRef(null);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimer = useRef(0);
  const clearTimer = useRef(0);
  const catsLoaded = useRef(false);
  const { orbRef, onPointerMove, onPointerLeave, reset } = useOrbTilt({ tilt: false }); // گوی داخل فیلد هدر با هاور شکلش را عوض نمی‌کند
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState({ ox: 0, oy: 0 });
  const [query, setQuery] = useState("");
  const [data, setData] = useState({ q: "", items: [] }); // آخرین نتیجهٔ رسیده و نوشته‌ای که برایش بوده
  const [active, setActive] = useState(-1);
  const [hint, setHint] = useState(0);
  const [typing, setTyping] = useState(false);
  const [recents, setRecents] = useState([]);
  const [cats, setCats] = useState([]);
  const [bodyH, setBodyH] = useState(null);
  const [scrolledDown, setScrolledDown] = useState(false);
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);

  const q = query.trim();
  const idle = q === "";
  const loading = !idle && data.q !== q;
  const items = loading ? [] : data.items;
  const total = idle ? recents.length : loading ? 0 : items.length + 1; // ردیف آخر نتایج: «مشاهدهٔ همهٔ نتایج»
  const busy = open && (typing || loading);
  const collapsed = scrolledDown && !open;

  // جستجو با تأخیر کوتاه؛ درخواست قبلی با نوشتن ادامه لغو می‌شود تا نتیجهٔ کهنه جای تازه را نگیرد
  useEffect(() => {
    if (q === "") return undefined;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const json = await res.json();
        setData({ q, items: Array.isArray(json) ? json : [] });
      } catch (err) {
        if (err?.name !== "AbortError") setData({ q, items: [] });
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  // نوشتهٔ راهنمای فیلد هر چند ثانیه عوض می‌شود (هم فیلد هدر، هم فیلد خالی کارت)
  useEffect(() => {
    if (disabled) return undefined;
    const timer = setInterval(() => setHint((h) => (h + 1) % HINTS.length), 3200);
    return () => clearInterval(timer);
  }, [disabled]);

  // اسکرول به پایین ردیف جستجوی گوشی را جمع می‌کند، اسکرول به بالا یا نزدیک بالای صفحه دوباره باز می‌کند. تصمیم از روی مسافت پیموده‌شده از نقطهٔ تغییر جهت است
  // (نه یک قدم اسکرول)، چون با جمع‌شدن ردیف، محتوای صفحه چند پیکسل جابه‌جا می‌شود و بدون این، همان لرزش کوچک ردیف را دوباره باز می‌کرد
  useEffect(() => {
    let lastY = window.scrollY;
    let anchor = lastY;
    let dir = 0;
    const onScroll = () => {
      const y = window.scrollY;
      const step = Math.sign(y - lastY);
      if (step !== 0 && step !== dir) {
        dir = step;
        anchor = lastY;
      }
      lastY = y;
      if (y < 60 || anchor - y > 40) setScrolledDown(false);
      else if (y - anchor > 40 && y > 140) setScrolledDown(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ارتفاع بدنهٔ کارت (اخیرها ↔ نتایج ↔ اسکلت) نرم عوض می‌شود: ارتفاع محتوا اندازه‌گیری و به لفاف داده می‌شود (در CSS transition دارد)
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setBodyH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted]);

  // تا کارت باز است چرخ و کشیدنِ پشت آن صفحهٔ زیرین را نمی‌برد (فقط فهرست نتایج داخل کارت اسکرول می‌خورد)
  useEffect(() => {
    const layer = layerRef.current;
    if (!open || !layer) return undefined;
    const stop = (e) => {
      if (!(e.target instanceof Element) || !e.target.closest(".sb-hide")) e.preventDefault();
    };
    layer.addEventListener("wheel", stop, { passive: false });
    layer.addEventListener("touchmove", stop, { passive: false });
    return () => {
      layer.removeEventListener("wheel", stop);
      layer.removeEventListener("touchmove", stop);
    };
  }, [open]);

  useEffect(
    () => () => {
      clearTimeout(typingTimer.current);
      clearTimeout(clearTimer.current);
    },
    [],
  );

  // با هر حرف (یا انتخاب یک پیشنهاد) کمان «در حال جستجو» دور گوی می‌چرخد و تا کمی بعد از آخرین حرف می‌ماند
  const markTyping = useCallback(() => {
    setTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), TYPING_MS);
  }, []);

  const openSearch = useCallback(() => {
    const trigger = triggerRef.current;
    const card = cardRef.current;
    if (!trigger || !card) return;
    // کارت از جای گوی داخل فیلد هدر باز می‌شود: مبدأ بزرگ‌شدن مرکز گوی نسبت به گوشهٔ کارت است (اندازه‌های چیدمانی؛ تبدیل‌های فعلی اثر ندارند)
    const orb = trigger.querySelector(".xs-orb");
    const br = (orb || trigger).getBoundingClientRect();
    clearTimeout(clearTimer.current); // باز شدن دوباره پیش از پاک‌شدن نوشتهٔ قبلی
    reset(); // هاور فیلد با باز شدن کارت تمام می‌شود و بعد از بسته‌شدن فقط با حرکت واقعی نشانگر دوباره روشن می‌شود
    const visible = br.width > 0 && br.height > 0;
    const ox = visible ? br.left + br.width / 2 - card.offsetLeft : card.offsetWidth / 2;
    const oy = visible ? br.top + br.height / 2 - card.offsetTop : 0;
    // همگام رندر می‌شود تا فوکوس هنوز داخل همان کلیک (برای باز شدن صفحه‌کلید گوشی) روی فیلد برود
    flushSync(() => {
      setOrigin({ ox, oy });
      setRecents(readRecents());
      setActive(-1);
      setOpen(true);
    });
    inputRef.current?.focus({ preventScroll: true });
    inputRef.current?.select();
    // دسته‌ها فقط یک بار و هنگام اولین باز شدن گرفته می‌شوند
    if (!catsLoaded.current) {
      catsLoaded.current = true;
      fetch("/api/admin/categories")
        .then((res) => res.json())
        .then((list) => {
          if (Array.isArray(list)) setCats(list.filter((c) => c?.name && c?.slug).slice(0, 8).map((c) => ({ id: c.id, name: c.name, slug: c.slug })));
        })
        .catch(() => {
          catsLoaded.current = false; // دفعهٔ بعد دوباره امتحان می‌شود
        });
    }
  }, [reset]);

  // بسته‌شدن: کارت با انیمیشن جمع می‌شود و بعد نوشتهٔ داخلش پاک می‌شود (فیلد هدر دوباره راهنمای چرخان را نشان می‌دهد و باز شدن بعدی از اول است)
  const closeSearch = useCallback((refocus = true) => {
    setOpen(false);
    const trigger = triggerRef.current;
    if (refocus && trigger) {
      trigger.setAttribute("data-restored", ""); // فوکوس برمی‌گردد ولی حلقهٔ فوکوس نشان نمی‌دهد (CSS)
      trigger.focus({ preventScroll: true });
    }
    clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => {
      setQuery("");
      setActive(-1);
    }, 700);
  }, []);

  // صفحهٔ دیگری باز شد (دکمهٔ برگشت، لینک): جستجو بسته شود
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // کلید «/» (بیرون از فیلدها) و Ctrl+K جستجو را باز می‌کنند
  useEffect(() => {
    if (disabled) return undefined;
    const onKey = (e) => {
      if (e.defaultPrevented || open) return;
      const slash = e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e.target);
      const ctrlK = (e.ctrlKey || e.metaKey) && e.code === "KeyK";
      if (slash || ctrlK) {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled, open, openSearch]);

  // جستجوی انجام‌شده به اخیرها اضافه می‌شود (تکراری‌ها جابه‌جا می‌شوند، حداکثر ۵ تا)
  const remember = () => {
    if (q.length < 2) return;
    const next = [q, ...readRecents().filter((x) => x !== q)].slice(0, RECENT_MAX);
    writeRecents(next);
    setRecents(next);
  };
  const forget = () => {
    writeRecents([]);
    setRecents([]);
    setActive(-1);
    inputRef.current?.focus({ preventScroll: true });
  };
  const pick = (text) => {
    setQuery(text);
    setActive(-1);
    markTyping();
    inputRef.current?.focus({ preventScroll: true });
  };

  // رفتن به صفحهٔ دیگر: جستجو در حافظه می‌ماند و کارت بسته می‌شود (نوشته بعد از انیمیشن پاک می‌شود)
  const leave = (href) => {
    remember();
    closeSearch(false);
    if (href) router.push(href);
  };
  const submit = () => {
    if (idle) {
      if (active >= 0 && active < recents.length) pick(recents[active]);
      return;
    }
    if (active >= 0 && active < items.length) leave(`/products/${items[active].slug}`);
    else leave(`/products?q=${encodeURIComponent(q)}`);
  };
  const onInputKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!total) return;
      setActive((a) => (e.key === "ArrowDown" ? (a + 1) % total : a <= 0 ? total - 1 : a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };
  // Esc از هر جای کارت می‌بندد؛ Tab داخل کارت می‌چرخد و به صفحهٔ پشت آن نمی‌رود
  const onLayerKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeSearch();
    } else if (e.key === "Tab") {
      const nodes = [...(cardRef.current?.querySelectorAll("input, button, a[href]") ?? [])].filter((n) => !n.disabled && n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const hasList = open && (!idle || recents.length > 0);
  const activeId = active >= 0 && active < total ? `${uid}-${idle ? "rec" : "opt"}-${active}` : undefined;

  return (
    <>
      {/* فیلد همیشه‌دیدنیِ هدر */}
      <div
        className={`hs-slot relative order-3 w-full basis-full flex-1 transition-[max-height,opacity,margin] duration-300 sm:order-none sm:mx-auto sm:w-auto sm:max-w-2xl sm:basis-auto ${
          collapsed ? "-mt-2 max-h-0 overflow-hidden opacity-0 sm:mt-0 sm:max-h-none sm:overflow-visible sm:opacity-100" : "max-h-24 opacity-100"
        }`}
      >
        <button
          ref={triggerRef}
          type="button"
          className="hs-trigger"
          aria-label="جستجو در فروشگاه"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={`${uid}-panel`}
          aria-keyshortcuts="/"
          disabled={disabled}
          onClick={openSearch}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          onBlur={(e) => e.currentTarget.removeAttribute("data-restored")}
        >
          <span className="hs-trigger-hint" aria-hidden="true">
            <RotatingHint index={hint} />
          </span>
          <kbd className="hs-slash" aria-hidden="true">
            /
          </kbd>
          <span ref={orbRef} className="xs-orb hs-orb" aria-hidden="true">
            <span className="xs-skin" />
            <OrbBubbles />
            <SearchGlyph className="h-[1.05rem] w-[1.05rem] sm:h-5 sm:w-5" />
          </span>
        </button>
      </div>

      {/* کارت جستجو و پس‌زمینهٔ مات (در body تا روی هدر چسبان بنشیند) */}
      {mounted &&
        createPortal(
          <div
            ref={layerRef}
            className={`sp-layer ${open ? "is-open" : ""}`}
            inert={!open}
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) closeSearch();
            }}
            onKeyDown={onLayerKeyDown}
          >
            <div ref={cardRef} id={`${uid}-panel`} role="dialog" aria-modal="true" aria-label="جستجو در فروشگاه" className="sp-card" style={{ "--ox": `${origin.ox}px`, "--oy": `${origin.oy}px` }}>
              <form
                role="search"
                aria-label="جستجو در فروشگاه"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <div className={`sp-top ${busy ? "is-busy" : ""}`}>
                  <span className="xs-orb sp-orb" aria-hidden="true">
                    <span className="xs-skin" />
                    <OrbBubbles />
                    <OrbBusy />
                    <SearchGlyph className="h-5 w-5" />
                  </span>
                  <div className="sp-field">
                    <input
                      ref={inputRef}
                      type="text"
                      role="combobox"
                      aria-expanded={hasList}
                      aria-controls={listId}
                      aria-activedescendant={activeId}
                      aria-autocomplete="list"
                      aria-label="جستجو در فروشگاه"
                      autoComplete="off"
                      enterKeyHint="search"
                      maxLength={60}
                      className="sp-input"
                      placeholder={HINTS[0]}
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setActive(-1);
                        markTyping();
                      }}
                      onKeyDown={onInputKeyDown}
                    />
                    {idle && (
                      <span className="sp-hint" aria-hidden="true">
                        <RotatingHint index={hint} />
                      </span>
                    )}
                  </div>
                  <kbd className="sp-esc" aria-hidden="true">
                    Esc
                  </kbd>
                  <button type="button" className="sp-close" aria-label="بستن جستجو" onClick={() => closeSearch()}>
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </form>

              <div className="sp-bodywrap" style={bodyH === null ? undefined : { height: bodyH }}>
                <div ref={bodyRef}>
                  {idle ? (
                    <div key="idle" className="sp-pane">
                      {recents.length > 0 && (
                        <div id={listId} role="listbox" aria-label="جستجوهای اخیر" className="sp-group">
                          <div className="sp-cap sp-rise" style={{ "--i": 0 }}>
                            <span>جستجوهای اخیر</span>
                            <button type="button" className="sp-clear" onClick={forget}>
                              پاک کردن
                            </button>
                          </div>
                          {recents.map((text, i) => (
                            <button
                              key={text}
                              type="button"
                              id={`${uid}-rec-${i}`}
                              role="option"
                              aria-selected={active === i}
                              data-active={active === i ? "" : undefined}
                              className="sp-recent sp-rise"
                              style={{ "--i": i + 1 }}
                              onMouseEnter={() => setActive(i)}
                              onMouseLeave={() => setActive((a) => (a === i ? -1 : a))}
                              onClick={() => pick(text)}
                            >
                              <Clock className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                              <span className="min-w-0 flex-1 truncate">{text}</span>
                              <ChevronLeft className="hs-go h-4 w-4" aria-hidden="true" />
                            </button>
                          ))}
                        </div>
                      )}
                      {cats.length > 0 && (
                        <div className="sp-group">
                          <div className="sp-cap sp-rise" style={{ "--i": recents.length + 1 }}>
                            <span>دسته‌ها</span>
                          </div>
                          <div className="sp-chips">
                            {cats.map((c, i) => (
                              <Link key={c.id} href={`/categories/${encodeURIComponent(c.slug)}`} className="sp-chip sp-rise" style={{ "--i": recents.length + 2 + i }} onClick={() => leave()}>
                                {c.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {recents.length === 0 && cats.length === 0 && (
                        <div className="sp-tip sp-rise" style={{ "--i": 0 }}>
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                            <PackageSearch className="h-5 w-5" aria-hidden="true" />
                          </span>
                          نام محصول یا برند را بنویسید؛ نتیجه‌ها همین‌جا و هم‌زمان با نوشتن می‌آیند.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div key="results" className="sp-pane sp-pane--results" id={listId} role="listbox" aria-label="نتایج جستجو">
                      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-2.5 text-xs text-gray-500">
                        <span className="min-w-0 truncate">
                          نتایج برای «<b className="font-bold text-gray-800">{q}</b>»
                        </span>
                        {!loading && <span className="shrink-0">{fa(items.length)} محصول</span>}
                      </div>
                      <ScrollArea className="max-h-[min(22rem,calc(100dvh-14rem))]" innerClassName="p-2">
                        {loading ? (
                          <Skeleton />
                        ) : items.length === 0 ? (
                          <div className="grid justify-items-center gap-2 px-4 py-8 text-center text-sm text-gray-500">
                            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gray-100 text-gray-400">
                              <SearchX className="h-6 w-6" aria-hidden="true" />
                            </span>
                            محصولی با این نام پیدا نشد.
                            <span className="text-xs text-gray-400">املای دیگری امتحان کنید یا همهٔ محصولات را ببینید.</span>
                          </div>
                        ) : (
                          items.map((p, i) => (
                            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.3 }}>
                              <Link
                                href={`/products/${p.slug}`}
                                id={`${uid}-opt-${i}`}
                                role="option"
                                aria-selected={active === i}
                                data-active={active === i ? "" : undefined}
                                className="hs-item"
                                onMouseEnter={() => setActive(i)}
                                onMouseLeave={() => setActive((a) => (a === i ? -1 : a))}
                                onClick={() => leave()}
                              >
                                <span className="hs-thumb grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-200">
                                  {p.image && <AppImage src={p.image} alt="" width={48} height={48} className="h-12 w-12 object-cover" />}
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col">
                                  <span className="truncate text-sm font-semibold text-gray-900">
                                    <Highlight text={p.name} query={q} />
                                  </span>
                                  {p.Category?.name && <span className="truncate text-xs text-gray-500">در دسته {p.Category.name}</span>}
                                </span>
                                <span className="shrink-0 text-end">
                                  {p.finalPrice && p.finalPrice < p.price ? (
                                    <>
                                      <span className="block text-xs font-bold text-rose-600">{fa(p.finalPrice)} تومان</span>
                                      <span className="block text-[11px] text-gray-400 line-through">{fa(p.price)}</span>
                                    </>
                                  ) : (
                                    <span className="text-xs font-bold text-gray-700">{fa(p.price)} تومان</span>
                                  )}
                                </span>
                                <ChevronLeft className="hs-go h-4 w-4" aria-hidden="true" />
                              </Link>
                            </motion.div>
                          ))
                        )}
                      </ScrollArea>
                      {!loading && (
                        <Link
                          href={`/products?q=${encodeURIComponent(q)}`}
                          id={`${uid}-opt-${items.length}`}
                          role="option"
                          aria-selected={active === items.length}
                          data-active={active === items.length ? "" : undefined}
                          className="hs-all"
                          onMouseEnter={() => setActive(items.length)}
                          onMouseLeave={() => setActive((a) => (a === items.length ? -1 : a))}
                          onClick={() => leave()}
                        >
                          <span className="min-w-0 truncate">مشاهدهٔ همهٔ نتایج برای «{q}»</span>
                          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="sp-foot" aria-hidden="true">
                <span>
                  <kbd>↑</kbd>
                  <kbd>↓</kbd> حرکت
                </span>
                <span>
                  <kbd>Enter</kbd> باز کردن
                </span>
                <span>
                  <kbd>Esc</kbd> بستن
                </span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
