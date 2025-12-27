-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SECURITY', 'GUEST');

-- CreateTable
CREATE TABLE "event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "allow_re_entry" BOOLEAN NOT NULL DEFAULT true,
    "rotate_seconds" INTEGER NOT NULL DEFAULT 300,
    "max_seats" INTEGER NOT NULL DEFAULT 50,
    "owner" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "dress_code" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_address" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "label" TEXT,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "event_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_settings" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "event_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_theme" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "colors" JSONB,
    "layout" JSONB,
    "typography" JSONB,

    CONSTRAINT "event_theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_analytics" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "total_invites" INTEGER NOT NULL DEFAULT 0,
    "accepted" INTEGER NOT NULL DEFAULT 0,
    "declined" INTEGER NOT NULL DEFAULT 0,
    "checked_in" INTEGER NOT NULL DEFAULT 0,
    "inside" INTEGER NOT NULL DEFAULT 0,
    "outside" INTEGER NOT NULL DEFAULT 0,
    "last_update" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_media" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "event_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_description_block" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "props" JSONB NOT NULL,

    CONSTRAINT "event_description_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_faq" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "event_faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_team_member" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "image_url" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "event_team_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_audit_log" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_timeline" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "label" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "event_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_event_role" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,

    CONSTRAINT "user_event_role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_address_event_id_key" ON "event_address"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_settings_event_id_key" ON "event_settings"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_theme_event_id_key" ON "event_theme"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_analytics_event_id_key" ON "event_analytics"("event_id");

-- CreateIndex
CREATE INDEX "event_media_event_id_idx" ON "event_media"("event_id");

-- CreateIndex
CREATE INDEX "event_description_block_event_id_idx" ON "event_description_block"("event_id");

-- CreateIndex
CREATE INDEX "event_faq_event_id_idx" ON "event_faq"("event_id");

-- CreateIndex
CREATE INDEX "event_audit_log_event_id_idx" ON "event_audit_log"("event_id");

-- CreateIndex
CREATE INDEX "event_timeline_event_id_idx" ON "event_timeline"("event_id");

-- CreateIndex
CREATE INDEX "user_event_role_event_id_idx" ON "user_event_role"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_event_role_user_id_event_id_key" ON "user_event_role"("user_id", "event_id");

-- AddForeignKey
ALTER TABLE "event_address" ADD CONSTRAINT "event_address_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_settings" ADD CONSTRAINT "event_settings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_theme" ADD CONSTRAINT "event_theme_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_analytics" ADD CONSTRAINT "event_analytics_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_media" ADD CONSTRAINT "event_media_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_description_block" ADD CONSTRAINT "event_description_block_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_faq" ADD CONSTRAINT "event_faq_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_team_member" ADD CONSTRAINT "event_team_member_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_audit_log" ADD CONSTRAINT "event_audit_log_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_timeline" ADD CONSTRAINT "event_timeline_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_event_role" ADD CONSTRAINT "user_event_role_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
