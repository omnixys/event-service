CREATE TABLE IF NOT EXISTS "user_projection" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "display_name" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "primary_phone" TEXT,
    "avatar_url" TEXT,
    "locale" TEXT,
    "last_synced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_projection_pkey" PRIMARY KEY ("id")
);

INSERT INTO "user_projection" ("id", "username")
SELECT DISTINCT "user_id", "user_id"::text
FROM "user_event_role"
ON CONFLICT ("id") DO NOTHING;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'user_event_role_user_id_fkey'
    ) THEN
        ALTER TABLE "user_event_role"
        ADD CONSTRAINT "user_event_role_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "user_projection"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
