import { ORDER_STATUS, statusTint } from "./orderStatus";

// چیپ وضعیت سفارش با رنگ و آیکون وضعیت در داشبورد؛ هم‌اندازهٔ Chip کیت لیست. رنگ همیشه همراه آیکون و برچسب است، پس معنی فقط با رنگ منتقل نمی‌شود
export default function StatusChip({ status, className = "" }) {
  const s = ORDER_STATUS[status];
  if (!s) {
    return <span className={`inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold leading-none text-gray-600 ${className}`}>نامشخص</span>;
  }
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold leading-none ${className}`} style={statusTint(s)}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {s.label}
    </span>
  );
}
