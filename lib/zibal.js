import axios from "axios";

/**
 * ارتباط با درگاه زیبال (فقط سمت سرور).
 * ZIBAL_API_URL و ZIBAL_START_URL فقط برای تست با درگاه ساختگی هستند؛ پیش‌فرض‌ها همان آدرس‌های واقعی‌اند.
 */

const apiUrl = () => (process.env.ZIBAL_API_URL || "https://gateway.zibal.ir/v1").replace(/\/+$/, "");
const startUrl = () => (process.env.ZIBAL_START_URL || "https://gateway.zibal.ir/start").replace(/\/+$/, "");

// در production هیچ‌وقت به مرچنت آزمایشی (zibal) برنمی‌گردیم؛ با آن مرچنت هر پرداختی «موفق» می‌شود
export function getMerchant() {
  if (process.env.ZIBAL_MERCHANT_ID) return process.env.ZIBAL_MERCHANT_ID;
  if (process.env.NODE_ENV === "production") return null;
  console.warn("ZIBAL_MERCHANT_ID تنظیم نشده؛ در حالت توسعه از مرچنت آزمایشی zibal استفاده می‌شود.");
  return "zibal";
}

// آدرس برگشت از درگاه فقط از تنظیمات سرور ساخته می‌شود، نه از ورودی کاربر
export function siteUrl(req) {
  const configured = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return process.env.NODE_ENV === "production" ? null : new URL(req.url).origin;
}

export const payUrl = (trackId) => `${startUrl()}/${trackId}`;

export async function zibalRequest(payload) {
  const { data } = await axios.post(`${apiUrl()}/request`, payload, { timeout: 15000 });
  return data;
}

export async function zibalVerify(payload) {
  const { data } = await axios.post(`${apiUrl()}/verify`, payload, { timeout: 15000 });
  return data;
}
