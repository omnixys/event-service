-- CreateEnum
CREATE TYPE "guest_reminder_preset" AS ENUM ('WEEK_BEFORE', 'THREE_DAYS_BEFORE', 'HOURS_24_BEFORE');

-- AlterTable
ALTER TABLE "settings"
ADD COLUMN "guest_confirmation_reminder_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "guest_confirmation_reminder_presets" "guest_reminder_preset"[] NOT NULL DEFAULT ARRAY['WEEK_BEFORE','THREE_DAYS_BEFORE','HOURS_24_BEFORE']::"guest_reminder_preset"[],
ADD COLUMN "guest_confirmation_max_resends" INTEGER;