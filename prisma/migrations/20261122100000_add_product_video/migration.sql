-- Product video: one short clip per product, stored as the upload path (/uploads/<name>.mp4 or .webm).
-- Only adds a nullable column, so existing rows and data are untouched.
-- IF NOT EXISTS makes it safe to run on a database where the column was already added (e.g. by `prisma db push`).

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN IF NOT EXISTS "video" TEXT;
