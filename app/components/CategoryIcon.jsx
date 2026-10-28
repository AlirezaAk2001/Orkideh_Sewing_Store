import { Plug, Spool, Tag } from "lucide-react";

// چرخ خیاطی (lucide آیکون چرخ خیاطی ندارد): با همان سبک خطی lucide، پس کنار آیکون‌های دیگر ناجور نیست
export function SewingMachineIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 21h20" />
      <path d="M5 8h13a2 2 0 0 1 2 2v11" />
      <path d="M5 8a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h1v8" />
      <path d="M6 13h6" />
      <path d="M9 8V5h4v3" />
      <circle cx="17" cy="14" r="2" />
    </svg>
  );
}

// دسته‌ها را ادمین می‌سازد، پس آیکون از slug و نام حدس زده می‌شود و دستهٔ ناشناس آیکون برچسب می‌گیرد
export default function CategoryIcon({ slug = "", name = "", className }) {
  const key = `${slug} ${name}`.toLowerCase();
  if (/sewing|machine|چرخ/.test(key)) return <SewingMachineIcon className={className} />;
  if (/electric|برق/.test(key)) return <Plug className={className} aria-hidden="true" />;
  if (/accessor|لوازم/.test(key)) return <Spool className={className} aria-hidden="true" />;
  return <Tag className={className} aria-hidden="true" />;
}
