-- AnalyticsOutbox.actorId references a UserId (U), align column type.
-- Values are only produced after the UUIDv7 migration, legacy rows are
-- re-seeded from scratch, so a plain cast is safe.
ALTER TABLE "analytics_outbox"
    ALTER COLUMN "actor_id" TYPE UUID USING "actor_id"::uuid;