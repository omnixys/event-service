-- Event.owner references a UserId (U), align column type with user_projection.id
ALTER TABLE "event"
    ALTER COLUMN "owner" TYPE UUID USING "owner"::uuid;

-- Align legacy manual FK name (added in 20260723003000_add_user_projection_fk)
-- with the Prisma-generated default so future diffs stay clean.
ALTER TABLE "user_event_role"
    RENAME CONSTRAINT "user_event_role_user_id_fkey" TO "event_user_role_user_id_fkey";

-- Enforce event owner integrity against the local user projection
ALTER TABLE "event"
    ADD CONSTRAINT "event_owner_fkey"
    FOREIGN KEY ("owner") REFERENCES "user_projection"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enforce assignee + assigner integrity against the local user projection
ALTER TABLE "event_user_role"
    ADD CONSTRAINT "event_user_role_assigned_by_fkey"
    FOREIGN KEY ("assigned_by") REFERENCES "user_projection"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;