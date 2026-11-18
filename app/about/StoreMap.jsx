"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, MapPinOff, Store } from "lucide-react";
import { MAP_KEY, MAP_LOCALE, MAP_STYLE_URL } from "@/app/profile/_ui/mapClient";

// نقشهٔ فروشگاه در صفحهٔ «درباره فروشگاه» با نقشهٔ وب «نشان» (همان SDK و کلید فرم آدرس: NEXT_PUBLIC_NESHAN_MAP_KEY).
// SDK حدود ۱٫۹ مگابایت است و هر بار باز شدن نقشه هزینهٔ تایل دارد؛ پس فقط وقتی کادر نقشه نزدیک دید آمد بار می‌شود (IntersectionObserver)،
// نه با باز شدن صفحه. cooperativeGestures هم اسکرول صفحه را روی نقشه گیر نمی‌اندازد. بدون کلید، بدون WebGL یا با خطای شبکه، به‌جای نقشه فقط پیام می‌آید
// و نشانی کنار آن در صفحه هست. سنجاق (عنصر DOM) و انیمیشن پالسش (همان سنجاق کاشی آدرس داشبورد) در about.css است؛ نوکش دقیقاً روی مختصات می‌نشیند (anchor: bottom).
const PIN =
  '<div class="ab-pin-in"><svg viewBox="5 2 14 20" aria-hidden="true" focusable="false"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.6"/></svg></div>';

export default function StoreMap({ lat, lng, name }) {
  const frameRef = useRef(null);
  const boxRef = useRef(null);
  const [status, setStatus] = useState(MAP_KEY ? "loading" : "off"); // loading | ready | error | off

  useEffect(() => {
    if (!MAP_KEY) return undefined;
    let cancelled = false;
    let map = null;
    let observer = null;

    const start = async () => {
      try {
        const [{ default: maplibregl }] = await Promise.all([import("@neshan-maps-platform/maplibre-sdk"), import("@neshan-maps-platform/maplibre-sdk/style.css")]);
        if (cancelled || !boxRef.current) return;
        map = new maplibregl.Map({
          container: boxRef.current,
          style: MAP_STYLE_URL,
          center: [lng, lat],
          zoom: 16,
          minZoom: 5,
          maxZoom: 19,
          apiKey: MAP_KEY,
          cooperativeGestures: true,
          locale: MAP_LOCALE,
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
        const pin = document.createElement("div");
        pin.className = "ab-pin";
        pin.innerHTML = PIN;
        new maplibregl.Marker({ element: pin, anchor: "bottom" }).setLngLat([lng, lat]).addTo(map);
        // «آماده» یعنی استایل نقشه نشسته؛ منتظر همهٔ تایل‌ها نمی‌مانیم. فقط خطای خودِ استایل «بارگذاری نشد» است
        map.once("style.load", () => setStatus("ready"));
        map.on("error", () => {
          if (!map.isStyleLoaded() && !cancelled) setStatus((s) => (s === "ready" ? s : "error"));
        });
      } catch {
        if (!cancelled) setStatus("error"); // مرورگر بدون WebGL یا شبکهٔ بسته
      }
    };

    if (typeof IntersectionObserver === "undefined") {
      start();
    } else {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          start();
        },
        { rootMargin: "240px 0px" }
      );
      observer.observe(frameRef.current);
    }

    return () => {
      cancelled = true;
      if (observer) observer.disconnect();
      if (map) map.remove();
    };
  }, [lat, lng]);

  return (
    <div className="ab-mapframe">
      <div className="ab-map" ref={frameRef}>
        <div className="ab-map-box" ref={boxRef} />
        {status === "ready" && (
          <span className="ab-map-chip">
            <Store aria-hidden="true" />
            {name}
          </span>
        )}
        {status === "loading" && (
          <div className="ab-map-state" role="status">
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            در حال بارگذاری نقشه…
          </div>
        )}
        {(status === "error" || status === "off") && (
          <div className="ab-map-state" role="alert">
            <MapPinOff aria-hidden="true" />
            نقشه فعلاً نمایش داده نمی‌شود؛ نشانی فروشگاه را از کادر کناری ببینید.
          </div>
        )}
      </div>
    </div>
  );
}
