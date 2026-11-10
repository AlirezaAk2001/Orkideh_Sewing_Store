import prisma from "@/lib/prisma";
import { SHIPPING_SETTING_KEY, readMethods } from "@/lib/shipping";

// خواندن و ذخیرهٔ تنظیمات ارسال از جدول Setting (فقط سرور). منطق خالص در lib/shipping.js است
export async function getShippingMethods() {
  const row = await prisma.setting.findUnique({ where: { key: SHIPPING_SETTING_KEY } });
  return readMethods(row?.value);
}

export async function saveShippingMethods(methods) {
  const value = JSON.stringify(methods);
  await prisma.setting.upsert({
    where: { key: SHIPPING_SETTING_KEY },
    update: { value, updated_at: new Date() },
    create: { key: SHIPPING_SETTING_KEY, value, updated_at: new Date() },
  });
  return methods;
}
