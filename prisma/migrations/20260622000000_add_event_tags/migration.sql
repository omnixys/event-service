ALTER TABLE "event"
ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "event_tags_idx" ON "event" USING GIN ("tags");
