import { preload } from "react-dom";
import "./globals.css";
import { AuthProvider, FavoritesProvider, CartProvider } from "../lib/context";
import { Toaster } from "react-hot-toast";
import ConditionalLayout from "./components/ConditionalLayout";

export const metadata = {
  title: "فروشگاه چرخ خیاطی ارکیده",
  description: "فروشگاه آنلاین چرخ خیاطی",
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