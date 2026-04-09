const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.setting.upsert({
    where: { key: "logo_url" },
    update: { value: "/image/logo.png" },
    create: { key: "logo_url", value: "/image/logo.png" },
    background_image: "/image/logo.png"
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());