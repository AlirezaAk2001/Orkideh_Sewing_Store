"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import ConfirmDialog from "@/app/admin/_shell/ConfirmDialog";

// نگهبان تغییرات ذخیره‌نشده در فرم‌های پنل: تا when درست است، رفتن به صفحهٔ دیگر از راه هر لینک داخلی (سایدبار، «انصراف»، لینک فروشگاه در همین تب) با پنجرهٔ تأیید
// متوقف می‌شود و بستن یا بازخوانی تب مرورگر هشدار خود مرورگر را می‌دهد. رفتن با router.push (بعد از ذخیره) و دکمهٔ «برگشت» مرورگر را نمی‌گیرد.
// کلیک با Ctrl/Cmd/Shift، لینک تب جدید، لینک بیرونی و لینکی که فقط # عوض می‌کند دست‌نخورده می‌ماند.
export default function UnsavedGuard({ when }) {
  const router = useRouter();
  const [pending, setPending] = useState(null);

  useEffect(() => {
    if (!when) return undefined;
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      // پیش از کنترل‌کنندهٔ Link نکست (فاز capture)، پس نکست رفتن را شروع نمی‌کند
      event.preventDefault();
      event.stopPropagation();
      setPending(`${url.pathname}${url.search}${url.hash}`);
    };
    const onUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [when]);

  return (
    <ConfirmDialog
      open={pending !== null}
      onClose={() => setPending(null)}
      onConfirm={() => {
        const href = pending;
        setPending(null);
        router.push(href);
      }}
      title="تغییرات ذخیره‌نشده"
      confirmLabel="خروج بدون ذخیره"
      cancelLabel="ماندن در فرم"
      icon={LogOut}
    >
      در این فرم تغییراتی دارید که هنوز ذخیره نشده است. اگر الان بروید، آن‌ها از بین می‌روند.
    </ConfirmDialog>
  );
}
