/**
 * اعتبارسنجی سمت سرور؛ کلاینت‌ها هم همین قوانین را دارند ولی سرور نباید به آن‌ها تکیه کند.
 */

// موبایل ایران: ۰۹ و ۹ رقم دیگر
export const isValidPhone = (value) => /^09\d{9}$/.test(String(value ?? ""));

// حداقل ۸ کاراکتر؛ bcrypt بیشتر از ۷۲ بایت را نادیده می‌گیرد، پس سقف هم می‌گذاریم
export const isAcceptablePassword = (value) =>
  typeof value === "string" && value.length >= 8 && Buffer.byteLength(value, "utf8") <= 72;

export const PASSWORD_RULE_MESSAGE = "رمز عبور باید حداقل ۸ کاراکتر باشد";
