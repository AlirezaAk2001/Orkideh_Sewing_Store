-- Product gallery: "image" stays the main (cover) picture, "images" holds the other pictures in display order.
-- Only adds a column with an empty default, so existing rows and data are untouched.
-- IF NOT EXISTS makes it safe to run on a database where the column was already added (e.g. by `prisma db push`).

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN IF NOT EXISTS "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
