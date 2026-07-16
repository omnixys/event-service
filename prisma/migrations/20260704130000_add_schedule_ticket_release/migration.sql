ALTER TABLE "settings"
ADD COLUMN "schedule_ticket_release" BOOLEAN NOT NULL DEFAULT false;

UPDATE "settings"
SET "schedule_ticket_release" = true
WHERE "ticket_release_at" IS NOT NULL;
