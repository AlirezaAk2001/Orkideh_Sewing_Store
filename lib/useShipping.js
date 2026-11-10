"use client";

import { useCallback, useEffect, useState } from "react";

// روش‌های ارسالِ فعال برای سبد خرید (هر دو صفحهٔ سبد: /cart و بخش سبد پروفایل) و روشِ انتخاب‌شده. اولین روش از ابتدا انتخاب است.
// loading = هنوز نیامده؛ error = دریافت شکست خورد (پرداخت تا دریافت موفق بسته می‌ماند، چون بدون روش ارسال سرور سفارش را نمی‌پذیرد).
// فهرست خالی یعنی مدیر هیچ روشی را فعال نکرده و ارسال و هزینه‌ای در کار نیست. cost = هزینهٔ روش انتخاب‌شده (تومان)؛ فقط برای نمایش،
// مبلغ نهایی را سرور از تنظیمات خودش می‌سازد
export function useShipping() {
  const [state, setState] = useState({ methods: null, error: false });
  const [selected, setSelected] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch("/api/shipping", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => {
        if (!alive) return;
        const methods = Array.isArray(data?.methods) ? data.methods : [];
        setState({ methods, error: false });
        // انتخاب قبلی اگر هنوز فعال است می‌ماند، وگرنه اولین روش
        setSelected((prev) => (methods.some((m) => m.id === prev) ? prev : methods[0]?.id ?? null));
      })
      .catch(() => alive && setState({ methods: [], error: true }));
    return () => {
      alive = false;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setState({ methods: null, error: false });
    setAttempt((n) => n + 1);
  }, []);

  const { methods, error } = state;
  const method = methods?.find((m) => m.id === selected) ?? null;
  return { methods, loading: methods === null, error, selected, setSelected, method, cost: method?.cost ?? 0, reload };
}
