ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "createdByAdminId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_createdByAdminId_fkey') THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_createdByAdminId_fkey"
      FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "User_createdByAdminId_idx" ON "User"("createdByAdminId");

ALTER TABLE "Lease"
  ADD COLUMN IF NOT EXISTS "checkInWallPaintStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "checkInToiletLocksCondition" TEXT,
  ADD COLUMN IF NOT EXISTS "checkInDoorsCondition" TEXT,
  ADD COLUMN IF NOT EXISTS "checkInSinkCondition" TEXT,
  ADD COLUMN IF NOT EXISTS "checkInSocketsCondition" TEXT,
  ADD COLUMN IF NOT EXISTS "checkInLightingCondition" TEXT,
  ADD COLUMN IF NOT EXISTS "checkInTokenStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "initialWaterReading" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "checkoutWallPaintStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "checkoutToiletLocksCondition" TEXT,
  ADD COLUMN IF NOT EXISTS "checkoutDoorsCondition" TEXT,
  ADD COLUMN IF NOT EXISTS "checkoutSinkCondition" TEXT,
  ADD COLUMN IF NOT EXISTS "checkoutSocketsCondition" TEXT,
  ADD COLUMN IF NOT EXISTS "checkoutLightingCondition" TEXT,
  ADD COLUMN IF NOT EXISTS "checkoutTokenStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "checkoutWaterReading" DOUBLE PRECISION;
