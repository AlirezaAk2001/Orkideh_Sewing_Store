// صفحه‌های خصوصی (حساب کاربری، سبد خرید، پرداخت، ورود، ادمین) نباید در نتایج جست‌وجو بیایند
const NOINDEX_PATHS = [
  "/admin",
  "/cart",
  "/profile",
  "/orders",
  "/favorites",
  "/addresses",
  "/settings",
  "/payment-result",
  "/auth",
  "/verify",
  "/maintenance",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // عنوان و تگ‌های پیش‌نمایش صفحهٔ محصول و دسته از دیتابیس ساخته می‌شوند. نکست آن‌ها را فقط برای فهرستی از ربات‌ها (تلگرام، واتس‌اپ، فیسبوک، بینگ، ...)
  // داخل <head> می‌گذارد و برای بقیه بعد از <head> می‌فرستد. پیام‌رسان‌های ایرانی در آن فهرست نیستند و بعضی ربات‌ها فقط <head> را می‌خوانند؛
  // پس برای همهٔ درخواست‌ها داخل <head> می‌آید (هزینه‌اش یک کوئری سبک پیش از ارسال صفحه است).
  htmlLimitedBots: /.*/,
  async headers() {
    return [
      ...NOINDEX_PATHS.map((path) => ({
        source: `${path}/:path*`,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
      {
        // نام فایل‌های فونت شامل نسخه است (…-v16.woff2)؛ پس یک سال و بدون بازبینی کش می‌شوند
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
