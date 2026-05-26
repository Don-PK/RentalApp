ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "createdById" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Property_createdById_fkey'
  ) THEN
    ALTER TABLE "Property"
      ADD CONSTRAINT "Property_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Property_createdById_idx" ON "Property"("createdById");
