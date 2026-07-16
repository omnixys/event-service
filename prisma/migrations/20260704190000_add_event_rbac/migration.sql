-- CreateEnum
CREATE TYPE "event_system_role_key" AS ENUM ('ADMIN', 'SECURITY', 'GUEST');

-- CreateTable
CREATE TABLE "event_permission" (
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "premium_feature_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "event_permission_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "event_role" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "system_key" "event_system_role_key",
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "event_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_role_permission" (
    "role_id" UUID NOT NULL,
    "permission_key" TEXT NOT NULL,

    CONSTRAINT "event_role_permission_pkey" PRIMARY KEY ("role_id","permission_key")
);

-- CreateTable
CREATE TABLE "event_user_role" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "event_user_role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_role_event_id_key_key" ON "event_role"("event_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "event_role_event_id_system_key_key" ON "event_role"("event_id", "system_key");

-- CreateIndex
CREATE INDEX "event_role_event_id_idx" ON "event_role"("event_id");

-- CreateIndex
CREATE INDEX "event_role_permission_permission_key_idx" ON "event_role_permission"("permission_key");

-- CreateIndex
CREATE UNIQUE INDEX "event_user_role_event_id_user_id_role_id_key" ON "event_user_role"("event_id", "user_id", "role_id");

-- CreateIndex
CREATE INDEX "event_user_role_event_id_user_id_idx" ON "event_user_role"("event_id", "user_id");

-- CreateIndex
CREATE INDEX "event_user_role_role_id_idx" ON "event_user_role"("role_id");

-- AddForeignKey
ALTER TABLE "event_role" ADD CONSTRAINT "event_role_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_role_permission" ADD CONSTRAINT "event_role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "event_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_role_permission" ADD CONSTRAINT "event_role_permission_permission_key_fkey" FOREIGN KEY ("permission_key") REFERENCES "event_permission"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_user_role" ADD CONSTRAINT "event_user_role_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_user_role" ADD CONSTRAINT "event_user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "event_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
