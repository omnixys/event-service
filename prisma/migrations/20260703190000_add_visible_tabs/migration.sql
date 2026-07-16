-- CreateEnum
CREATE TYPE "event_visible_tab" AS ENUM ('TIMELINE', 'DETAILS', 'MAP');

-- AlterTable
ALTER TABLE "settings"
ADD COLUMN "visible_tabs" "event_visible_tab"[] NOT NULL DEFAULT ARRAY['TIMELINE', 'DETAILS', 'MAP']::"event_visible_tab"[];
