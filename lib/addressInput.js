// اعتبارسنجی و پاک‌سازی بدنهٔ افزودن/ویرایش آدرس (فقط سمت سرور؛ POST و PUT /api/user/addresses)
// خروجی: { error } یا { data } با همهٔ فیلدهای آدرس. PUT همیشه کل فرم را می‌فرستد، پس فیلد خالی = پاک شدن مقدار قبلی (مثلاً برداشتن موقعیت نقشه با lat/lng تهی)

export const ADDRESS_LIMITS = { titleMax: 40, addressMin: 5, addressMax: 500, plateMax: 20, unitMax: 20 };

const FA = "۰۱۲۳۴۵۶۷۸۹";
const AR = "٠١٢٣٤٥٦٧٨٩";
const toEn = (v) =>
  String(v ?? "")
    .replace(/[۰-۹]/g, (d) => FA.indexOf(d))
    .replace(/[٠-٩]/g, (d) => AR.indexOf(d));

// هر فاصلهٔ پشت‌سرهم (و خط جدید) یک فاصله می‌شود؛ غیررشته = خالی
const text = (v) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");
const has = (v) => v !== undefined && v !== null && v !== "";

export function parseAddressInput(body) {
  const { titleMax, addressMin, addressMax, plateMax, unitMax } = ADDRESS_LIMITS;

  const address = text(body?.address);
  if (address.length < addressMin) return { error: `آدرس باید دست‌کم ${addressMin} نویسه باشد` };
  if (address.length > addressMax) return { error: `آدرس نباید بیشتر از ${addressMax} نویسه باشد` };

  const postalCode = toEn(body?.postalCode).replace(/\s/g, "");
  if (!/^\d{10}$/.test(postalCode)) return { error: "کد پستی باید ۱۰ رقم باشد" };

  const title = text(body?.title);
  if (title.length > titleMax) return { error: `عنوان آدرس نباید بیشتر از ${titleMax} نویسه باشد` };

  const plate = toEn(text(body?.plate));
  if (plate.length > plateMax) return { error: `پلاک نباید بیشتر از ${plateMax} نویسه باشد` };

  const unit = toEn(text(body?.unit));
  if (unit.length > unitMax) return { error: `واحد نباید بیشتر از ${unitMax} نویسه باشد` };

  let lat = null;
  let lng = null;
  if (has(body?.lat) || has(body?.lng)) {
    if (!has(body?.lat) || !has(body?.lng)) return { error: "موقعیت نقشه ناقص است" };
    lat = Number(body.lat);
    lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return { error: "موقعیت نقشه نامعتبر است" };
    }
    lat = Math.round(lat * 1e6) / 1e6;
    lng = Math.round(lng * 1e6) / 1e6;
  }

  return { data: { title: title || null, address, plate: plate || null, unit: unit || null, postalCode, lat, lng } };
}
