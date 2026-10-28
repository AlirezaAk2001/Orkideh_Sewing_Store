export function getImagePath(img) {
  if (!img) return "/image/default-banner.jpg";
  // مسیر کامل، فایل آپلودشده (/uploads/…) و آدرس بیرونی همان‌طور که هستند؛ فقط نام فایل خالی زیر /image/ می‌رود
  if (img.startsWith("/image/") || img.startsWith("/uploads/") || /^https?:\/\//.test(img)) return img;
  return `/image/${img}`;
}