"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clapperboard, Loader2, Maximize, Minimize, Pause, Play, RotateCcw, VideoOff, Volume1, Volume2, VolumeX } from "lucide-react";
import { tip } from "@/lib/tip";
import AppImage from "./AppImage";
import "./video-player.css";

// پخش‌کنندهٔ ویدیو با کنترل‌های سفارشی (استایل و انیمیشن‌ها در video-player.css)، جای کنترل‌های بومی مرورگر. چهار حالت (data-state روی ریشه):
//  idle = پیش از اولین پخش: قاب اول ویدیو (preload="metadata" فقط اندازه و فریم اول را می‌آورد، نه کل فایل)، دکمهٔ بزرگ پخش و چیپ مدت؛
//  playing/paused = نوار شیشه‌ای: پیشرفت با بافر و چیپ زمانِ هاور و دستگیره، پخش/توقف، زمان، صدا (لغزندهٔ بازشونده)، سرعت، تمام‌صفحه. هنگام پخش بعد از ۲٫۶ ثانیه بی‌حرکتی نوار و نشانگر پنهان می‌شوند؛
//  ended = دکمهٔ «پخش دوباره» روی آخرین فریم؛ و خطا اگر فایل باز نشد.
// کیبورد: فاصله یا K پخش/توقف، ← → پنج ثانیه، ↑ ↓ صدا، M بی‌صدا، F تمام‌صفحه، Esc بستن منوی سرعت. دوبار کلیک روی تصویر = تمام‌صفحه.
// پیشرفت و بافر بی‌رندر دوباره و هر فریم (requestAnimationFrame) از طریق متغیرهای CSS --vp-p و --vp-b روی ریشه نوشته می‌شوند؛ فقط ثانیهٔ نمایشی state است.
// نوار و نوشته‌ها چپ‌به‌راست‌اند (مثل کنترل بومی)، ولی ارقام زمان فارسی‌اند. src عوض شود، والد باید key بدهد تا پخش‌کننده از اول ساخته شود.
// poster (اختیاری، آدرس تصویر): جای فریم اول ویدیو دیده می‌شود و ویدیو تا اولین پخش اصلاً بارگذاری نمی‌شود (preload="none")؛ برای صفحهٔ محصول مشتری که ویدیو تا ۳۰ مگابایت است
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const fa = (text) => String(text).replace(/\d/g, (d) => FA_DIGITS[d]);
const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
const rateLabel = (r) => `${r.toLocaleString("fa-IR")}×`;

const clock = (t) => {
  const s = Math.max(0, Math.floor(Number.isFinite(t) ? t : 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return fa(h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`);
};

export default function VideoPlayer({ src, label = "ویدیو", className = "", autoPlay = false, poster, posterSizes = "(max-width: 768px) 100vw, 880px" }) {
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const seekRef = useRef(null);
  const frameRef = useRef(null); // بومِ فریم اول (فقط وقتی poster نداریم): عکسِ ایستایی که هاور پیش از پخش آن را زوم می‌کند
  const menuRef = useRef(null);
  const hideTimer = useRef(0);
  const dragRef = useRef(false);
  const popId = useRef(0);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [framed, setFramed] = useState(false); // ویدیو اولین فریمِ واقعی را داده است (پوستر محو می‌شود)
  const [duration, setDuration] = useState(0);
  const [second, setSecond] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [ui, setUi] = useState(true);
  const [menu, setMenu] = useState(false);
  const [drag, setDrag] = useState(false);
  const [hover, setHover] = useState(null); // چیپ زمانِ هاور روی نوار پیشرفت: { pct, t }
  const [pop, setPop] = useState(null); // نشان پخش/توقف وسط کادر: { id, kind }

  // پیشرفت و بافر را روی ریشه می‌نویسد و ثانیهٔ نمایشی را فقط وقتی عوض شد state می‌کند
  const sync = useCallback(() => {
    const v = videoRef.current;
    const root = rootRef.current;
    if (!v || !root) return;
    const d = v.duration;
    const ok = Number.isFinite(d) && d > 0;
    const t = v.currentTime;
    root.style.setProperty("--vp-p", ok ? clamp(t / d) : 0);
    let end = 0;
    for (let i = 0; i < v.buffered.length; i++) {
      if (v.buffered.start(i) <= t + 0.25 && v.buffered.end(i) >= t) end = v.buffered.end(i);
    }
    root.style.setProperty("--vp-b", ok ? clamp(end / d) : 0);
    const sec = Math.floor(t);
    setSecond((s) => (s === sec ? s : sec));
  }, []);

  // فریم اول ویدیو را یک‌بار روی بوم می‌کشد (حداکثر ۱۲۸۰ پیکسل عرض تا حافظهٔ ویدیوی ۴K زیاد نشود). خود <video> هیچ‌وقت زوم نمی‌شود (لرزش می‌داد)؛ زوم هاور روی همین بوم است.
  // فایل هم‌مبدأ است، پس drawImage مشکلی ندارد و چون هرگز از بوم نمی‌خوانیم، آلوده‌شدنش هم مهم نیست
  const capture = useCallback(() => {
    const v = videoRef.current;
    const c = frameRef.current;
    if (!v || !c || v.readyState < 2 || !v.videoWidth) return;
    const k = Math.min(1, 1280 / v.videoWidth);
    c.width = Math.round(v.videoWidth * k);
    c.height = Math.round(v.videoHeight * k);
    c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
  }, []);

  // هنگام پخش هر فریم پیشرفت را به‌روز می‌کند (timeupdate فقط چهار بار در ثانیه می‌آید و نوار را پله‌پله می‌کرد)
  useEffect(() => {
    if (!playing) return undefined;
    let id = requestAnimationFrame(function loop() {
      sync();
      id = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  }, [playing, sync]);

  // نوار کنترل: با هر حرکت یا لمس می‌آید و هنگام پخش بعد از ۲٫۶ ثانیه بی‌حرکتی می‌رود
  const poke = useCallback(() => {
    setUi(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setUi(false), 2600);
  }, []);
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // کلیک بیرون از منوی سرعت آن را می‌بندد
  useEffect(() => {
    if (!menu) return undefined;
    const outside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false);
    };
    document.addEventListener("pointerdown", outside, true);
    return () => document.removeEventListener("pointerdown", outside, true);
  }, [menu]);

  const toggle = (withPop = false) => {
    const v = videoRef.current;
    if (!v || failed) return;
    if (v.paused || v.ended) {
      if (v.ended) v.currentTime = 0;
      v.play().catch(() => {});
      if (withPop) setPop({ id: ++popId.current, kind: "play" });
    } else {
      v.pause();
      if (withPop) setPop({ id: ++popId.current, kind: "pause" });
    }
  };

  const skip = (delta) => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration)) return;
    v.currentTime = clamp(v.currentTime + delta, 0, v.duration);
    sync();
  };

  const setVol = (n) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = clamp(n);
    v.muted = n <= 0;
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.muted || v.volume === 0) {
      v.muted = false;
      if (v.volume === 0) v.volume = 0.5;
    } else {
      v.muted = true;
    }
  };

  const changeRate = (r) => {
    const v = videoRef.current;
    if (v) v.playbackRate = r;
    setRate(r);
    setMenu(false);
  };

  const toggleFullscreen = () => {
    const root = rootRef.current;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else if (root?.requestFullscreen) root.requestFullscreen().catch(() => {});
    else videoRef.current?.webkitEnterFullscreen?.(); // آیفون: فقط خود ویدیو تمام‌صفحه می‌شود
  };

  // نوار پیشرفت (اشاره‌گر: کلیک، کشیدن و چیپ زمانِ هاور)
  const timeAt = (clientX) => {
    const bar = seekRef.current;
    const v = videoRef.current;
    if (!bar || !v || !Number.isFinite(v.duration)) return null;
    const r = bar.getBoundingClientRect();
    const pct = clamp((clientX - r.left) / r.width);
    return { pct, t: pct * v.duration };
  };
  const seekTo = (clientX) => {
    const at = timeAt(clientX);
    if (!at) return;
    videoRef.current.currentTime = at.t;
    sync();
  };
  const onSeekDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = true;
    setDrag(true);
    seekTo(e.clientX);
  };
  const onSeekMove = (e) => {
    setHover(timeAt(e.clientX));
    if (dragRef.current) seekTo(e.clientX);
  };
  const onSeekUp = () => {
    dragRef.current = false;
    setDrag(false);
  };
  const onSeekKey = (e) => {
    const v = videoRef.current;
    if (!v) return;
    const map = { ArrowLeft: () => skip(-5), ArrowRight: () => skip(5), Home: () => skip(-v.duration), End: () => skip(v.duration) };
    if (!map[e.key]) return;
    e.preventDefault();
    e.stopPropagation();
    map[e.key]();
  };

  const onKeyDown = (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const target = e.target;
    if (target.closest?.("input, [role='slider']")) return;
    const key = e.key;
    if (key === "Escape" && menu) {
      e.preventDefault();
      setMenu(false);
      return;
    }
    if ((key === " " || key === "Enter") && target.closest?.("button")) return; // خود دکمه کلیک می‌شود
    const v = videoRef.current;
    if (key === " " || key === "k" || key === "K") toggle(true);
    else if (key === "ArrowLeft") skip(-5);
    else if (key === "ArrowRight") skip(5);
    else if (key === "ArrowUp" && v) setVol(v.volume + 0.1);
    else if (key === "ArrowDown" && v) setVol(v.volume - 0.1);
    else if (key === "m" || key === "M") toggleMute();
    else if (key === "f" || key === "F") toggleFullscreen();
    else return;
    e.preventDefault();
    poke();
  };

  const state = ended ? "ended" : !started ? "idle" : playing ? "playing" : "paused";
  const showUi = ui || !playing || menu || drag;
  const silent = muted || volume === 0;
  const VolIcon = silent ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      ref={rootRef}
      className={`vp ${className}`}
      data-state={state}
      data-ui={showUi ? "show" : "hide"}
      data-failed={failed ? "" : undefined}
      role="group"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerMove={poke}
      onPointerDown={poke}
      onPointerLeave={() => {
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setUi(false), 700);
      }}
      onFocus={poke}
    >
      {/* .vp-media: لایهٔ تصویر (ویدیو + پوستر) که هنگام هاور پیش از پخش زوم می‌شود؛ زوم روی این لفاف است، نه روی خود <video> (علت لرزش، پایین css) */}
      <div className="vp-media">
        <video
          ref={videoRef}
          className="vp-video"
          src={src}
          preload={poster ? "none" : "metadata"}
          playsInline
          autoPlay={autoPlay}
          aria-label={label}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
            sync();
          }}
          onLoadedData={() => {
            if (!poster && !started) capture();
          }}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={sync}
          onProgress={sync}
          onSeeked={sync}
          onPlay={() => {
            setPlaying(true);
            setStarted(true);
            setEnded(false);
            poke();
          }}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setEnded(true);
            setPlaying(false);
            sync();
          }}
          onWaiting={() => setWaiting(true)}
          onPlaying={() => {
            setWaiting(false);
            setFramed(true);
          }}
          onCanPlay={() => setWaiting(false)}
          onVolumeChange={(e) => {
            setVolume(e.currentTarget.volume);
            setMuted(e.currentTarget.muted);
          }}
          onRateChange={(e) => setRate(e.currentTarget.playbackRate)}
          onError={() => setFailed(true)}
        />
        {/* پوستر (تصویر اصلی محصول در صفحهٔ مشتری): تا ویدیو فریم اول را بدهد (framed) دیده می‌شود تا هیچ بایتی از خود ویدیو پیش از پخش دانلود نشود (preload="none") و بعد از آن محو می‌شود */}
        {poster ? (
          <AppImage src={poster} alt="" fill sizes={posterSizes} className="vp-poster" data-framed={framed ? "" : undefined} />
        ) : (
          <canvas ref={frameRef} className="vp-frame" data-framed={framed ? "" : undefined} aria-hidden="true" />
        )}
      </div>

      {/* لایهٔ کلیک: روی تصویر کلیک = پخش/توقف، دوبار کلیک = تمام‌صفحه */}
      <div className="vp-stage" onClick={() => toggle(state !== "idle")} onDoubleClick={toggleFullscreen} />

      <div className="vp-idle" aria-hidden={state !== "idle" || undefined}>
        <button
          type="button"
          className="vp-big"
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          aria-label={`پخش ${label}`}
          tabIndex={state === "idle" ? 0 : -1}
        >
          <span className="vp-big-core">
            <Play fill="currentColor" aria-hidden="true" />
          </span>
        </button>
        {(duration > 0 || poster) && (
          <span className="vp-chip" dir="rtl">
            <Clapperboard aria-hidden="true" />
            {duration > 0 ? clock(duration) : "پخش ویدیو"}
          </span>
        )}
      </div>

      {pop && (
        <span key={pop.id} className="vp-pop" aria-hidden="true" onAnimationEnd={() => setPop(null)}>
          {pop.kind === "play" ? <Play fill="currentColor" /> : <Pause fill="currentColor" />}
        </span>
      )}
      {waiting && playing && !ended && (
        <span className="vp-wait" role="status" aria-label="در حال بارگذاری">
          <Loader2 aria-hidden="true" />
        </span>
      )}

      {ended && !failed && (
        <div className="vp-end">
          <button type="button" className="vp-replay" onClick={() => toggle()} aria-label="پخش دوباره" {...tip("پخش دوباره", "top")}>
            <RotateCcw aria-hidden="true" />
          </button>
          <span dir="rtl">پخش دوباره</span>
        </div>
      )}
      {failed && (
        <div className="vp-err" role="alert">
          <VideoOff aria-hidden="true" />
          <b dir="rtl">پخش ویدیو ممکن نشد</b>
          <span dir="rtl">فایل در دسترس نیست یا قالب آن پشتیبانی نمی‌شود</span>
        </div>
      )}

      <div className="vp-bar">
        <div
          ref={seekRef}
          className="vp-seek"
          role="slider"
          tabIndex={0}
          aria-label="موقعیت ویدیو"
          aria-valuemin={0}
          aria-valuemax={Math.floor(duration) || 0}
          aria-valuenow={second}
          aria-valuetext={`${clock(second)} از ${clock(duration)}`}
          data-drag={drag ? "" : undefined}
          onPointerDown={onSeekDown}
          onPointerMove={onSeekMove}
          onPointerUp={onSeekUp}
          onPointerCancel={onSeekUp}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onSeekKey}
        >
          <span className="vp-track">
            <i className="vp-buf" />
            <i className="vp-fill" />
          </span>
          <i className="vp-thumb" />
          {hover && (
            <span className="vp-seek-tip" style={{ left: `clamp(1.75rem, ${hover.pct * 100}%, calc(100% - 1.75rem))` }}>
              {clock(hover.t)}
            </span>
          )}
        </div>

        <div className="vp-row">
          <button type="button" className="vp-btn" onClick={() => toggle()} aria-label={playing ? "توقف" : "پخش"} {...tip(playing ? "توقف" : "پخش", "top")}>
            <span className="vp-swap" data-on={playing ? "b" : "a"}>
              <Play fill="currentColor" aria-hidden="true" />
              <Pause fill="currentColor" aria-hidden="true" />
            </span>
          </button>
          <span className="vp-time" aria-hidden="true">
            {clock(second)} <i>/</i> {clock(duration)}
          </span>

          <span className="vp-grow" />

          <div className="vp-vol">
            <button type="button" className="vp-btn" onClick={toggleMute} aria-label={silent ? "وصل صدا" : "قطع صدا"} {...tip(silent ? "وصل صدا" : "قطع صدا", "top")}>
              <VolIcon aria-hidden="true" />
            </button>
            <input
              type="range"
              className="vp-range"
              min="0"
              max="1"
              step="0.02"
              value={silent ? 0 : volume}
              aria-label="میزان صدا"
              style={{ "--v": `${(silent ? 0 : volume) * 100}%` }}
              onChange={(e) => setVol(Number(e.target.value))}
            />
          </div>

          <div className="vp-rate-wrap" ref={menuRef}>
            <button
              type="button"
              className="vp-btn vp-rate"
              onClick={() => setMenu((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menu}
              aria-label={`سرعت پخش، ${rateLabel(rate)}`}
              {...(menu ? {} : tip("سرعت پخش", "top"))}
            >
              {rateLabel(rate)}
            </button>
            {menu && (
              <div className="vp-menu" role="menu" aria-label="سرعت پخش">
                {RATES.map((r) => (
                  <button key={r} type="button" role="menuitemradio" aria-checked={r === rate} className="vp-menu-item" onClick={() => changeRate(r)}>
                    <span>{rateLabel(r)}</span>
                    {r === rate && <Check aria-hidden="true" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="vp-btn"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "خروج از تمام‌صفحه" : "تمام‌صفحه"}
            {...tip(fullscreen ? "خروج از تمام‌صفحه" : "تمام‌صفحه", "top")}
          >
            {fullscreen ? <Minimize aria-hidden="true" /> : <Maximize aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  );
}
