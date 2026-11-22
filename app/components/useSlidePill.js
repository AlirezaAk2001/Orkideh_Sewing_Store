import { useEffect, useLayoutEffect } from "react";

// قرص لغزانی که زیر عنصرِ فعال (aria-current="page") یک ظرف می‌نشیند و با عوض‌شدن عنصر فعال به جای تازه می‌لغزد؛ چیپ‌های دسته و صفحه‌بندیِ فهرست محصولات (ProductListing.jsx).
// box: ref ظرف (باید position: relative و isolation: isolate داشته باشد)، pill: ref خود قرص (عنصر خالی با کلاس lst-pill)، dep: هر مقداری که با عوض‌شدن عنصر فعال عوض می‌شود.
// remember: کلید اختیاری؛ جای آخرین قرص در حافظهٔ ماژول می‌ماند، پس وقتی صفحه عوض می‌شود و ظرف از نو ساخته می‌شود (مثلاً از «همه» به یک دسته)
// قرص از جای قبلی‌اش به جای تازه می‌لغزد، نه این‌که ناگهان آنجا ظاهر شود. تا قرص نشسته، ظرف data-pill ندارد و عنصر فعال خودش پس‌زمینهٔ ثابت دارد (CSS: listing.css).
// موقعیت‌ها offsetLeft/offsetTop هستند (نسبت به ظرف) و قرص با left:0/top:0 و translate می‌نشیند، پس با پیمایش افقی ظرف و در RTL هم درست می‌مانند.
// با «کاهش حرکت» گذار CSS خاموش است و قرص فوراً می‌پرد.
const memory = new Map();
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function useSlidePill(box, pill, dep, remember) {
  useIsoLayoutEffect(() => {
    const root = box.current;
    const el = pill.current;
    if (!root || !el) return undefined;
    const active = () => root.querySelector('[aria-current="page"]');
    const measure = (node) => ({ x: node.offsetLeft, y: node.offsetTop, w: node.offsetWidth, h: node.offsetHeight });
    const place = (r, animate) => {
      el.style.transition = animate ? "" : "none";
      el.style.width = `${r.w}px`;
      el.style.height = `${r.h}px`;
      el.style.transform = `translate(${r.x}px, ${r.y}px)`;
    };
    const node = active();
    if (!node) {
      delete root.dataset.pill;
      return undefined;
    }
    const now = measure(node);
    const before = remember ? memory.get(remember) : null;
    if (before && (before.x !== now.x || before.y !== now.y || before.w !== now.w || before.h !== now.h)) {
      // از جای قبلی شروع می‌کنیم و بعد از یک reflow به جای تازه می‌رویم تا گذار CSS اجرا شود
      place(before, false);
      el.getBoundingClientRect();
      place(now, true);
    } else {
      place(now, false);
    }
    root.dataset.pill = "1";
    if (remember) memory.set(remember, now);

    // اندازهٔ عنصرها با آمدن فونت یا تغییر عرض عوض می‌شود: بدون انیمیشن دوباره می‌نشیند
    // ResizeObserver بلافاصله بعد از observe یک بار صدا زده می‌شود؛ آن بار را رد می‌کنیم وگرنه لغزش تازه‌شروع‌شده را می‌پراند
    let first = true;
    const observer = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      const current = active();
      if (!current) return;
      const r = measure(current);
      place(r, false);
      if (remember) memory.set(remember, r);
    });
    observer.observe(root);
    root.querySelectorAll('[aria-current="page"]').forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [box, pill, dep, remember]);
}
