-- Order shipping: "shippingMethod" keeps the name of the delivery method the customer picked (a snapshot, so later changes to the
-- shipping settings never rewrite old orders) and "shippingCost" its price in toman. "totalPrice" from now on is goods + shipping,
-- which is exactly what the payment gateway is asked for and what the verification compares against.
-- Only adds columns: existing orders keep a NULL method and a 0 cost (their totalPrice already was the goods total, so nothing changes for them).
-- IF NOT EXISTS makes it safe to run on a database where the columns were already added (e.g. by `prisma db push`).

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN IF NOT EXISTS "shippingMethod" TEXT;
ALTER TABLE "public"."Order" ADD COLUMN IF NOT EXISTS "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0;
