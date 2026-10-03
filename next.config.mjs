/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // نام فایل‌های فونت شامل نسخه است (…-v16.woff2)؛ پس یک سال و بدون بازبینی کش می‌شوند
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
