import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error'],
  });

console.log('Prisma initialized:', prisma ? 'Success' : 'Failed'); // لاگ برای اشکال‌زدایی

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma; // اضافه کردن export default