ALTER TABLE "event_timeline"
ADD COLUMN "source_id" TEXT,
ADD COLUMN "reference_id" TEXT;

CREATE UNIQUE INDEX "event_timeline_source_id_key"
ON "event_timeline"("source_id");
