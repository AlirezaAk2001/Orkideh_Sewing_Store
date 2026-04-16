import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { AuthProvider, FavoritesProvider, CartProvider } from "../lib/context";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
  return (
    <html lang="fa" dir="rtl">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-gray-100 text-gray-900 antialiased flex flex-col min-h-screen`}>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              <Header />
              <main className="flex-grow">{children}</main>
              <Toaster position="top-right" />
              <Footer />
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}