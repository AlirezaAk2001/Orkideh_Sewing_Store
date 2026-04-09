import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding banners...");

  // چند رکورد تستی
  await prisma.banner.createMany({
    data: [
      {
        img: "/image/banner1.jpg",
        title: "جدیدترین چرخ‌خیاطی‌های ژانومه",
        desc: "!تخفیف ویژه فقط تا پایان هفته",
      },
      {
        img: "/image/banner2.png",
        title: "چرخ‌خیاطی دیجیتال نیولایف",
        desc: "ارسال رایگان به سراسر کشور",
      },
      {
        img: "/image/banner3.png",
        title: "Youshita ۷۵۵ سردوز",
        desc: "!هم‌اکنون با قیمت استثنایی",
      },
    ],
    skipDuplicates: true, // جلوگیری از تکراری شدن رکوردها
  });

  console.log("✅ Banner data seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());