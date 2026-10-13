import { cache } from "react";
import prisma from "@/lib/prisma";

// بنرهای صفحهٔ اصلی، جدیدترین اول؛ همان شکلی که BannerSlider از GET /api/admin/banners می‌ساخت
export const listBanners = cache(async () => {
  const banners = await prisma.banner.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, desc: true, img: true, link: true },
  });
  return banners.map((banner) => ({
    id: banner.id,
    img: banner.img,
    title: banner.title,
    desc: banner.desc,
    link: banner.link || "/products",
  }));
});
