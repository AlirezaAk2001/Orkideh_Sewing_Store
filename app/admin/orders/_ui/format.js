// کمک‌تابع‌های صفحهٔ سفارش‌های ادمین (سمت مرورگر): رقم فارسی، سن سفارش، عنوان روز، متن قابل جست‌وجو و کپی
import { joinFields } from "@/app/admin/_list/search";
import { formatAddress } from "@/lib/addressFormat";

export const fa = (n) => (n || n === 0 ? Number(n).toLocaleString("fa-IR") : "");

// رقم‌های لاتین یک رشته به فارسی (شماره تماس، کد پستی، آدرس)؛ بدون جداکنندهٔ هزارگان
export const faDigits = (v) => String(v ?? "").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

export const faDate = (date) => new Date(date).toLocaleDateString("fa-IR");
export const faTime = (date) => new Date(date).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });

const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// چند روز تقویمی از آن تاریخ گذشته است (امروز = ۰، دیروز = ۱)، به ساعت مرورگر
export function daysAgo(date, now = new Date()) {
  return Math.max(0, Math.round((dayStart(now) - dayStart(new Date(date))) / 86400000));
}

export const agoText = (days) => (days === 0 ? "امروز" : days === 1 ? "دیروز" : `${fa(days)} روز پیش`);

const weekdayFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { weekday: "long", day: "numeric", month: "long" });
const yearFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric" });
const yearOf = (d) => yearFmt.formatToParts(d).find((p) => p.type === "year")?.value ?? "";

// «سه‌شنبه ۱۹ آبان» (و سال، فقط وقتی سال شمسی‌اش با امسال فرق دارد)
export function dayName(date) {
  const d = new Date(date);
  const year = yearOf(d);
  return year === yearOf(new Date()) ? weekdayFmt.format(d) : `${weekdayFmt.format(d)} ${year}`;
}

// سفارش‌ها (به همان ترتیب ورودی: تازه‌ترین اول) به گروه‌های روز: [{ key, days, name, orders, total }]
export function groupByDay(orders) {
  const groups = [];
  const byKey = new Map();
  for (const order of orders) {
    const d = new Date(order.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    let group = byKey.get(key);
    if (!group) {
      group = { key, days: daysAgo(d), name: dayName(d), orders: [], total: 0 };
      byKey.set(key, group);
      groups.push(group);
    }
    group.orders.push(order);
    group.total += Number(order.totalPrice) || 0;
  }
  return groups;
}

// متن قابل جست‌وجوی یک سفارش: کاربر، شماره تماس، شمارهٔ سفارش و شناسهٔ سیستمی، آدرس و کد پستی، شیوهٔ ارسال و نام کالاها
export function haystack(order) {
  return joinFields([
    order.User?.username,
    order.phoneNumber,
    order.userOrderNumber,
    order.id,
    formatAddress(order.Address),
    order.Address?.postalCode,
    order.shippingMethod,
    ...(order.OrderItems || []).map((item) => item.Product?.name),
  ]);
}

// کپی در حافظه: navigator.clipboard فقط روی https یا localhost هست؛ در بقیه (مثلاً باز کردن پنل با آدرس شبکهٔ داخلی) راه قدیمی با یک textarea پنهان
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}
