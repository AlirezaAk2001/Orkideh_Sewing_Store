-- User avatar: "profileImageUrl" keeps the avatar the user picked, "googleImageUrl" keeps the photo of their Google account
-- so they can switch back to it after choosing something else. Only adds a nullable column; existing rows and data are untouched
-- (old Google users who still have the picture URL in "profileImageUrl" are recognised by the code, see lib/avatar.js).
-- IF NOT EXISTS makes it safe to run on a database where the column was already added (e.g. by `prisma db push`).

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "googleImageUrl" TEXT;
