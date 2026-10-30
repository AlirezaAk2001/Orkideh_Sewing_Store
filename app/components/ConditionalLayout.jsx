"use client";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  // لایهٔ ادمین خودش <main> دارد؛ دور آن <main> دوم نمی‌پیچیم تا تودرتو نشود
  if (isAdmin) return <>{children}</>;

  // صفحه‌های ورود، ثبت‌نام، تأیید ایمیل و بازیابی رمز قالب خودشان (AuthShell) را دارند: بدون هدر و فوتر سایت
  const isAuth = pathname === "/auth" || pathname?.startsWith("/auth/") || pathname === "/verify";
  if (isAuth) return <main className="flex-grow">{children}</main>;

  return (
    <>
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  );
}