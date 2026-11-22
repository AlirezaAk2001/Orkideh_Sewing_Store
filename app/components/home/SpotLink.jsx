"use client";

import Link from "next/link";

// لینکی که مختصات مکان‌نما را (نسبت به گوشهٔ خودش) در --mx و --my می‌گذارد تا CSS نوری که دنبال موس می‌آید بکشد (کارت دسته‌بندی، home.css).
// فقط یک متغیر CSS عوض می‌شود، نه state ری‌اکت، پس هر حرکت موس رندر دوباره نمی‌سازد.
export default function SpotLink({ onPointerMove, ...props }) {
  return (
    <Link
      {...props}
      onPointerMove={(e) => {
        const box = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - box.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - box.top}px`);
        onPointerMove?.(e);
      }}
    />
  );
}
