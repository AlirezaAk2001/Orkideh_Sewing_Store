import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // لاگ همهٔ queryها فقط در حالت توسعه؛ در production فقط خطاها
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error'],
  });

console.log('Prisma initialized:', prisma ? 'Success' : 'Failed'); // لاگ برای اشکال‌زدایی

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma; // اضافه کردن export default