ALTER TABLE "settings"
ADD COLUMN "invited_by_options" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
