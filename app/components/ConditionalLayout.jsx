"use client";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  // لایهٔ ادمین خودش <main> دارد؛ دور آن <main> دوم نمی‌پیچیم تا تودرتو نشود
  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  );
}