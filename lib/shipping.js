// شیوه‌ها و هزینهٔ ارسال: منطق خالص و مشترک بین سرور و مرورگر (بدون prisma).
// فهرست روش‌ها در جدول Setting با کلید SHIPPING_SETTING_KEY به‌صورت JSON نگه‌داری می‌شود و مدیر آن را از پنل مدیریت (ارسال) تنظیم می‌کند؛ تا وقتی ذخیره نشده
// DEFAULT_SHIPPING (نمونه) خوانده می‌شود. هر روش: { id, label, description, cost (تومان)، active }. هزینهٔ ۰ یعنی ارسال رایگان.
// سفارش فقط نام روش و هزینهٔ آن لحظه را نگه می‌دارد (Order.shippingMethod / shippingCost)، پس تغییر بعدی تنظیمات سفارش‌های قدیمی را عوض نمی‌کند.

export const SHIPPING_SETTING_KEY = "shipping_methods";

export const MAX_METHODS = 8;
export const MAX_COST = 100_000_000; // تومان؛ سقف احتیاطی برای جلوگیری از اشتباه تایپی

// نمونهٔ اولیه؛ مبلغ‌ها فقط جای‌نگه‌دار هستند و باید در پنل مدیریت (ارسال) به مبلغ واقعی فروشگاه عوض شوند
export const DEFAULT_SHIPPING = [
  { id: "post", label: "پست پیشتاز", description: "تحویل در ۳ تا ۷ روز کاری", cost: 80000, active: true },
  { id: "courier", label: "پیک / تیپاکس", description: "تحویل در ۱ تا ۳ روز کاری", cost: 150000, active: true },
];

const text = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

// شناسهٔ روش: همان id قبلی، وگرنه از نام ساخته می‌شود (همیشه یکتا)
function uniqueId(raw, used) {
  const base = text(raw, 40).replace(/[^a-zA-Z0-9_-]/g, "") || "method";
  let id = base;
  for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
  used.add(id);
  return id;
}

// تمیزکردن یک فهرست خام؛ برای ذخیره در پنل مدیریت سخت‌گیر است (error می‌دهد) و برای خواندن از دیتابیس نرم (موارد بد را رد می‌کند)
export function parseMethods(raw, { strict = false } = {}) {
  if (!Array.isArray(raw)) return { ok: false, error: "فهرست روش‌های ارسال نامعتبر است", methods: [] };
  if (raw.length > MAX_METHODS) return { ok: false, error: `حداکثر ${MAX_METHODS} روش ارسال می‌توان تعریف کرد`, methods: [] };

  const used = new Set();
  const methods = [];
  for (const item of raw) {
    const label = text(item?.label, 40);
    const cost = Number(item?.cost);
    if (!label || !Number.isFinite(cost) || cost < 0 || cost > MAX_COST) {
      if (strict) {
        return {
          ok: false,
          error: !label ? "نام هر روش ارسال الزامی است" : `هزینهٔ «${label}» باید عددی بین ۰ و ${MAX_COST.toLocaleString("fa-IR")} تومان باشد`,
          methods: [],
        };
      }
      continue;
    }
    methods.push({
      id: uniqueId(item?.id, used),
      label,
      description: text(item?.description, 90),
      cost: Math.round(cost),
      active: item?.active !== false,
    });
  }
  return { ok: true, methods };
}

// مقدار ذخیره‌شدهٔ Setting (رشتهٔ JSON) به فهرست روش‌ها؛ نبود یا خرابی = نمونهٔ پیش‌فرض. فهرست خالیِ ذخیره‌شده (مدیر همه را حذف کرده) یعنی ارسالی تعریف نشده
export function readMethods(stored) {
  if (stored === undefined || stored === null || stored === "") return DEFAULT_SHIPPING.map((m) => ({ ...m }));
  try {
    const parsed = parseMethods(JSON.parse(stored));
    return parsed.ok ? parsed.methods : DEFAULT_SHIPPING.map((m) => ({ ...m }));
  } catch {
    return DEFAULT_SHIPPING.map((m) => ({ ...m }));
  }
}

export const activeMethods = (methods) => methods.filter((m) => m.active);

// روشی که کاربر انتخاب کرده؛ با یک روشِ فعال و بدون انتخاب، همان یک روش
export function chooseMethod(methods, id) {
  const active = activeMethods(methods);
  if (!active.length) return null;
  if (id === undefined || id === null || id === "") return active.length === 1 ? active[0] : undefined;
  return active.find((m) => m.id === String(id));
}

// هزینهٔ ارسال را به‌صورت متن می‌نویسد: ۰ = رایگان
export const costLabel = (cost, fa) => (cost > 0 ? `${fa(cost)} تومان` : "رایگان");
