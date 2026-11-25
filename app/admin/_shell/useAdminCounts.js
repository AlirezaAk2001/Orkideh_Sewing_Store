"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const EVERY_MS = 60000;

// شمارنده‌های نشان‌های سایدبار: سفارش‌های جاری و نظرهای تأییدنشده (processingOrders، pendingComments) و تعداد کل هر بخش (banners، categories، products، shipping،
// comments، orders) یا null تا اولین پاسخ.
// هنگام ورود، با رفتن به صفحهٔ دیگر پنل (pathname)، هر دقیقه و وقتی زبانهٔ مرورگر دوباره دیده شد تازه می‌شود؛ خطا بی‌صدا نادیده گرفته می‌شود (نشان فقط نیامده است).
// enabled: تا ادمین بودن کاربر معلوم نشده درخواستی نمی‌رود
export default function useAdminCounts(pathname, enabled) {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    const load = async () => {
      try {
        const { data } = await axios.get("/api/admin/attention", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
        if (alive) setCounts(data);
      } catch {
        // نشان‌ها اختیاری‌اند
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    load();
    const id = setInterval(onVisible, EVERY_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname, enabled]);

  return counts;
}
