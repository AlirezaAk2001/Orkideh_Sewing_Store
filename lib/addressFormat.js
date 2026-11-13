// نمایش یک آدرس همراه با پلاک و واحد (هم سمت سرور و هم کلاینت؛ بدون وابستگی)
// پلاک و واحد در دیتابیس جدا از متن آدرس نگه‌داری می‌شوند، ولی هر جا آدرس یک‌تکه نمایش داده می‌شود (جزئیات سفارش، پنل ادمین، کاشی نمای کلی) به آخر آن می‌چسبند
const clean = (v) => String(v ?? "").trim();

export function formatAddress(a) {
  if (!a) return "";
  const parts = [clean(a.address)];
  if (clean(a.plate)) parts.push(`پلاک ${clean(a.plate)}`);
  if (clean(a.unit)) parts.push(`واحد ${clean(a.unit)}`);
  return parts.filter(Boolean).join("، ");
}
