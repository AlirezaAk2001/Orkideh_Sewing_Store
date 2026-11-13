"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Ic } from "./icons";
import { MAP_KEY, searchPlaces } from "./mapClient";

// انتخاب موقعیت روی نقشهٔ نشان برای فرم آدرس. سنجاق ثابت وسط نقشه است و کاربر نقشه را زیر آن می‌کشد؛ هر جابه‌جایی که تمام شود، onPick(lat, lng) صدا زده می‌شود
// (آدرس‌یابی و پر کردن کادر آدرس کار فرم است). سه راه رسیدن به مکان: کشیدن/کلیک روی نقشه، جستجو (با دکمه یا Enter؛ نه با هر حرف، تا سهمیهٔ پولی سرویس هدر نرود)، و موقعیت GPS گوشی.
// این فایل با next/dynamic و فقط بعد از اولین بازشدن فرم بار می‌شود (SDK نقشه حدود ۱٫۹ مگابایت است). فرم داخل <form> است، پس اینجا <form> نیست و Enter با onKeyDown گرفته می‌شود.
const STYLE_URL = "https://static.neshan.org/sdk/maplibre/styles/light.json";
const LOCALE = {
  "CooperativeGesturesHandler.WindowsHelpText": "برای بزرگ‌نمایی کلید Ctrl را نگه دارید و اسکرول کنید",
  "CooperativeGesturesHandler.MacHelpText": "برای بزرگ‌نمایی کلید ⌘ را نگه دارید و اسکرول کنید",
  "CooperativeGesturesHandler.MobileHelpText": "برای حرکت روی نقشه از دو انگشت استفاده کنید",
  "NavigationControl.ZoomIn": "بزرگ‌نمایی",
  "NavigationControl.ZoomOut": "کوچک‌نمایی",
};
// view: { lat, lng, zoom, key } جای شروع؛ با عوض شدن key (هر بار که فرم باز می‌شود) نقشه همان‌جا می‌پرد
export default function MapPicker({ view, onPick }) {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const pickRef = useRef(onPick);
  const programmatic = useRef(false); // جابه‌جایی از طرف کد (کلیک، جستجو، GPS) هم «انتخاب» حساب می‌شود، نه فقط کشیدن کاربر
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [lifted, setLifted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null); // null = لیست بسته
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    pickRef.current = onPick;
  });

  useEffect(() => {
    let cancelled = false;
    let map = null;
    (async () => {
      try {
        const [{ default: maplibregl }] = await Promise.all([import("@neshan-maps-platform/maplibre-sdk"), import("@neshan-maps-platform/maplibre-sdk/style.css")]);
        if (cancelled || !boxRef.current) return;
        map = new maplibregl.Map({
          container: boxRef.current,
          style: STYLE_URL,
          center: [view.lng, view.lat],
          zoom: view.zoom,
          minZoom: 4,
          maxZoom: 19,
          apiKey: MAP_KEY,
          cooperativeGestures: true, // اسکرول صفحه روی نقشه گیر نکند
          locale: LOCALE,
        });
        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
        // «آماده» یعنی استایل نقشه نشسته؛ منتظر همهٔ تایل‌ها نمی‌مانیم تا یک تایل خراب نقشه را زیر «در حال بارگذاری» نگه ندارد. فقط خطای خودِ استایل «بارگذاری نشد» است
        map.once("style.load", () => setStatus("ready"));
        map.on("error", () => {
          if (!map.isStyleLoaded() && !cancelled) setStatus((s) => (s === "ready" ? s : "error"));
        });
        map.on("movestart", () => {
          setLifted(true);
          setResults(null);
        });
        map.on("moveend", (e) => {
          setLifted(false);
          const mine = programmatic.current;
          programmatic.current = false;
          if (!e.originalEvent && !mine) return; // جابه‌جایی اولیه یا jumpTo فرم
          const c = map.getCenter();
          pickRef.current(c.lat, c.lng); // فرم خودش انتخاب تکراری (فقط بزرگ‌نمایی، مرکز همان) را کنار می‌گذارد
        });
        map.on("click", (e) => {
          programmatic.current = true;
          map.easeTo({ center: e.lngLat, duration: 350 });
        });
      } catch {
        if (!cancelled) setStatus("error"); // مرورگر بدون WebGL یا شبکهٔ بسته
      }
    })();
    return () => {
      cancelled = true;
      if (map) map.remove();
      mapRef.current = null;
    };
    // نقشه فقط یک بار ساخته می‌شود؛ جای شروع بعدی را effect پایین می‌دهد
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // هر بار که فرم باز می‌شود (key تازه): بپر به جای آدرس در حال ویرایش، یا مرکز پیش‌فرض
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.jumpTo({ center: [view.lng, view.lat], zoom: view.zoom });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.key]);

  const flyTo = (lat, lng, zoom = 17) => {
    const map = mapRef.current;
    if (!map) return;
    programmatic.current = true;
    map.flyTo({ center: [lng, lat], zoom, duration: 900 });
  };

  const search = async () => {
    const term = query.trim();
    const map = mapRef.current;
    if (term.length < 2 || searching || !map) return;
    setSearching(true);
    try {
      const c = map.getCenter();
      setResults(await searchPlaces(term, c.lat, c.lng));
    } catch (err) {
      setResults(null);
      toast.error(err.message);
    }
    setSearching(false);
  };

  const choose = (r) => {
    setResults(null);
    setQuery(r.title);
    flyTo(r.lat, r.lng);
  };

  const locate = () => {
    if (locating) return;
    if (!navigator.geolocation) {
      toast.error("مرورگر شما موقعیت‌یابی را پشتیبانی نمی‌کند.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        flyTo(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === 1
            ? "دسترسی به موقعیت مکانی بسته است؛ از تنظیمات مرورگر اجازه بدهید."
            : "موقعیت شما پیدا نشد؛ جستجو کنید یا نقشه را حرکت دهید.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  };

  const onKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // داخل فرم آدرس است؛ Enter نباید فرم را ثبت کند
      search();
    } else if (e.key === "Escape") {
      setResults(null);
    }
  };

  return (
    <div className="mp" data-status={status}>
      <div className="mp-map" ref={boxRef} />
      <span className={`mp-pin ${lifted ? "lift" : ""}`} aria-hidden="true">
        <Ic n="pin" />
      </span>

      <div className="mp-bar">
        <div className="mp-sbox">
          <Ic n="search" />
          <input
            type="text"
            value={query}
            maxLength={100}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="جستجوی محله یا خیابان…"
            aria-label="جستجوی مکان روی نقشه"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className="mp-x"
              aria-label="پاک کردن جستجو"
              onClick={() => {
                setQuery("");
                setResults(null);
              }}
            >
              <Ic n="x" />
            </button>
          )}
        </div>
        <button type="button" className="mp-go" onClick={search} disabled={searching || query.trim().length < 2}>
          {searching ? <Ic n="loader" className="spin" /> : "جستجو"}
        </button>
        <button type="button" className="mp-gps" onClick={locate} disabled={locating} aria-label="موقعیت فعلی من" title="موقعیت فعلی من (GPS)">
          {locating ? <Ic n="loader" className="spin" /> : <Ic n="locate" />}
        </button>
      </div>

      {results && (
        <ul className="mp-results" role="listbox" aria-label="نتیجه‌های جستجو">
          {results.length === 0 && <li className="mp-none">نتیجه‌ای پیدا نشد؛ عبارت را کوتاه‌تر یا با نام محله بنویسید.</li>}
          {results.map((r, i) => (
            <li key={`${r.lat},${r.lng},${i}`} role="option" aria-selected="false">
              <button type="button" onClick={() => choose(r)}>
                <Ic n="pin" />
                <span>
                  <b>{r.title}</b>
                  {(r.address || r.neighbourhood || r.region) && <small>{r.address || [r.neighbourhood, r.region].filter(Boolean).join("، ")}</small>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {status === "loading" && (
        <div className="mp-state" role="status">
          <Ic n="loader" className="spin" /> در حال بارگذاری نقشه…
        </div>
      )}
      {status === "error" && (
        <div className="mp-state err" role="alert">
          نقشه بارگذاری نشد (ممکن است مرورگر شما از آن پشتیبانی نکند). آدرس را دستی وارد کنید.
        </div>
      )}
    </div>
  );
}
