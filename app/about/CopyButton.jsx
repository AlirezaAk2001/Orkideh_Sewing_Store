"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Check, Copy } from "lucide-react";

// دکمهٔ «کپی» صفحهٔ درباره فروشگاه (نشانی و ایمیل). با کلیک متن را در کلیپ‌بورد می‌گذارد، آیکون و نوشته‌اش لحظه‌ای «کپی شد» می‌شود و پیام کوتاهی هم می‌آید.
// navigator.clipboard فقط روی https (و localhost) هست؛ اگر نبود یا مرورگر رد کرد، پیام خطا می‌آید و کاربر می‌تواند متن را دستی انتخاب کند.
export default function CopyButton({ text, label = "کپی", doneLabel = "کپی شد", message = "کپی شد." }) {
  const [done, setDone] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      toast.error("کپی انجام نشد؛ متن را دستی انتخاب کنید.");
      return;
    }
    setDone(true);
    toast.success(message);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDone(false), 1800);
  };

  return (
    <button type="button" className="ab-btn ab-btn--soft" onClick={copy}>
      {done ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {done ? doneLabel : label}
    </button>
  );
}
