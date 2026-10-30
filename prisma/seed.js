const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.setting.upsert({
    where: { key: "logo_url" },
    update: { value: "/image/orkideh-logo.svg" },
    create: { key: "logo_url", value: "/image/orkideh-logo.svg" },
    background_image: "/image/orkideh-logo.svg"
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());