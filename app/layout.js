import { preload } from "react-dom";
import "./globals.css";
import { AuthProvider, FavoritesProvider, CartProvider } from "../lib/context";
import { Toaster } from "react-hot-toast";
import ConditionalLayout from "./components/ConditionalLayout";
import { SITE_NAME, SITE_DESCRIPTION, getSiteUrl, previewImage } from "../lib/seo";

export const metadata = {
  // آدرس‌های نسبی (تصویر پیش‌نمایش، canonical) نسبت به آدرس واقعی سایت کامل می‌شوند؛ NEXT_PUBLIC_BASE_URL را در production تنظیم کنید
  metadataBase: new URL(getSiteUrl()),
  title: { default: SITE_NAME, template: "%s | فروشگاه ارکیده" },
  description: SITE_DESCRIPTION,
  // «./» یعنی آدرس خود همان صفحه (بدون ?پارامتر)؛ صفحه‌هایی که متادیتای خودشان را دارند آن را عوض می‌کنند
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: SITE_NAME,
    url: "./",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: previewImage(), alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [previewImage()],
  },
  icons: {
    icon: "/iamge/logo2.ico",
    shortcut: "/image/logo2.ico",
    apple: "/iamge/logo2.ico",
  },
};

export default function RootLayout({ children }) {
  // فونت Vazirmatn (تعریف در globals.css): حروف فارسی و حروف/اعداد لاتین از همان ابتدا گرفته می‌شوند
  preload("/fonts/Vazirmatn-arabic-v16.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  preload("/fonts/Vazirmatn-latin-v16.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });

  return (
    <html lang="fa" dir="rtl">
      <body className="bg-gray-100 text-gray-900 antialiased flex flex-col min-h-screen">
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              <Toaster position="top-right" />
              <ConditionalLayout>{children}</ConditionalLayout>
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}