-- Address details: a title ("خانه", "محل کار", or free text), the plate and unit as separate fields, and the picked map position (lat/lng, both or none).
-- "deletedAt" makes deleting an address a soft delete: orders keep pointing at the row (Order.addressId), so the destination of an order that was
-- already placed (even one not shipped yet) is never lost; rows with a deletedAt are simply left out of every address list and of new orders.
-- Only adds nullable columns: existing addresses keep working unchanged (no title = the panel shows "آدرس N", no position = the fake map art).
-- IF NOT EXISTS makes it safe to run on a database where the columns were already added (e.g. by `prisma db push`).

-- AlterTable
ALTER TABLE "public"."Address" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "public"."Address" ADD COLUMN IF NOT EXISTS "plate" TEXT;
ALTER TABLE "public"."Address" ADD COLUMN IF NOT EXISTS "unit" TEXT;
ALTER TABLE "public"."Address" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION;
ALTER TABLE "public"."Address" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;
ALTER TABLE "public"."Address" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
