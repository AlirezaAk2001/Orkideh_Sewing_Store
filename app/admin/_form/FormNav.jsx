"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import useSlidePill from "@/app/components/useSlidePill";
import { scrollBehavior } from "@/lib/motion";
import "./form.css";

const fa = (n) => Number(n).toLocaleString("fa-IR");

// نوار بخش‌های فرم‌های افزودن و ویرایش پنل (استایل در form.css): بالای فرم می‌چسبد، حلقهٔ پیشرفت «موارد الزامی» را نشان می‌دهد و هر بخش را با یک کلیک می‌رساند.
// بخشِ در حال دیدن (scroll-spy با IntersectionObserver روی یک نوار باریک نزدیک بالای پنجره) با قرص لغزان مشخص است؛ نقطهٔ هر بخش وقتی پر شد سبز می‌شود.
// items: [{ id, label, done, optional }] که id شناسهٔ <FormSection id> همان بخش است. فقط مواردِ غیراختیاری در حلقه حساب می‌شوند.
// دکمه‌ها کلاس tab-3d دارند: همان بلندشدن سه‌بعدی تب‌های دیگر ادمین (globals.css و ButtonDepth.jsx) با هاور؛ «اختیاری» کنار عنوان در چیپ کوچک است (.afm-opt)
export default function FormNav({ items }) {
  const [active, setActive] = useState(items[0]?.id);
  const box = useRef(null);
  const pill = useRef(null);
  const ids = items.map((item) => item.id).join(",");
  useSlidePill(box, pill, active, undefined, '[aria-current="location"]');

  useEffect(() => {
    const sections = ids.split(",").map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return undefined;
    const visible = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // اولین بخشِ (از بالا) که در نوار دیده می‌شود، فعال است
        const first = sections.find((section) => visible.has(section.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-12% 0px -62% 0px" }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ids]);

  // روی صفحهٔ باریک اگر بخش فعال از ردیف بیرون زد، فقط خود ردیف می‌لغزد (نه صفحه)
  useEffect(() => {
    const row = box.current;
    const button = row?.querySelector('[aria-current="location"]');
    if (!row || !button) return;
    const area = row.getBoundingClientRect();
    const rect = button.getBoundingClientRect();
    if (rect.left < area.left) row.scrollBy({ left: rect.left - area.left - 8, behavior: scrollBehavior() });
    else if (rect.right > area.right) row.scrollBy({ left: rect.right - area.right + 8, behavior: scrollBehavior() });
  }, [active]);

  const required = items.filter((item) => !item.optional);
  const doneCount = required.filter((item) => item.done).length;
  const full = required.length > 0 && doneCount === required.length;
  const percent = required.length ? Math.round((doneCount / required.length) * 100) : 100;

  const jump = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    setActive(id);
    target.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  };

  return (
    <nav aria-label="بخش‌های فرم" className="afm-nav">
      <span className="afm-ring" data-full={full ? "" : undefined} role="img" aria-label={`${fa(doneCount)} از ${fa(required.length)} مورد الزامی کامل است`}>
        <svg viewBox="0 0 36 36" aria-hidden="true">
          <circle className="afm-ring-bg" cx="18" cy="18" r="15" pathLength="100" />
          <circle className="afm-ring-fg" cx="18" cy="18" r="15" pathLength="100" strokeDasharray={`${percent} 100`} />
        </svg>
        <b aria-hidden="true">{fa(doneCount)}</b>
      </span>
      <span className="afm-ring-text hidden sm:block" aria-hidden="true">
        {full ? "موارد الزامی کامل است" : `${fa(doneCount)} از ${fa(required.length)} مورد الزامی`}
      </span>

      <div ref={box} className="afm-pills">
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => jump(item.id)} aria-current={active === item.id ? "location" : undefined} className="afm-btn tab-3d">
            <span className="afm-dot" data-done={item.done ? "" : undefined} aria-hidden="true">
              <Check strokeWidth={3} />
            </span>
            {item.label}
            {item.optional && !item.done && <small className="afm-opt">اختیاری</small>}
            <span className="sr-only">{item.done ? "(تکمیل‌شده)" : item.optional ? "(اختیاری)" : "(الزامی، هنوز کامل نیست)"}</span>
          </button>
        ))}
        <i ref={pill} className="afm-slide" aria-hidden="true" />
      </div>
    </nav>
  );
}
