-- CreateEnum
CREATE TYPE "user_role_type" AS ENUM ('ADMIN', 'SECURITY', 'GUEST', 'SUPPORT', 'DRIVER', 'USHER');

-- CreateEnum
CREATE TYPE "event_system_role_key" AS ENUM ('ADMIN', 'SECURITY', 'GUEST', 'DRIVER', 'USHER');

-- CreateEnum
CREATE TYPE "event_category" AS ENUM ('GENERAL', 'KONFERENZ', 'MUSIK', 'WORKSHOP', 'SOCIAL', 'SPORTS');

-- CreateEnum
CREATE TYPE "media_type" AS ENUM ('COVER', 'LOGO', 'GALLERY');

-- CreateEnum
CREATE TYPE "seat_color_group_match_type" AS ENUM ('SINGLE', 'CUSTOM', 'ALL', 'NONE');

-- CreateEnum
CREATE TYPE "event_visible_tab" AS ENUM ('TIMELINE', 'DETAILS', 'MAP');

-- CreateEnum
CREATE TYPE "invitation_approval_mode" AS ENUM ('MANUAL', 'AUTO', 'AUTO_PUBLIC_ONLY', 'AUTO_INVITE_ONLY');

-- CreateTable
CREATE TABLE "event" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "owner" UUID NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parent_id" UUID,
    "path" TEXT NOT NULL DEFAULT '',
    "depth" INTEGER NOT NULL DEFAULT 0,
    "cover_image_id" UUID,
    "logo_media_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "allow_re_entry" BOOLEAN NOT NULL DEFAULT true,
    "rotate_seconds" INTEGER NOT NULL DEFAULT 300,
    "max_seats" INTEGER NOT NULL DEFAULT 10,
    "allow_public_rsvp" BOOLEAN NOT NULL DEFAULT true,
    "allow_public_plus_one" BOOLEAN NOT NULL DEFAULT true,
    "allow_public_rsvp_website" BOOLEAN NOT NULL DEFAULT false,
    "allow_plus_one_update" BOOLEAN NOT NULL DEFAULT false,
    "approval_mode" "invitation_approval_mode" NOT NULL DEFAULT 'MANUAL',
    "allow_guest_seat_selection" BOOLEAN NOT NULL DEFAULT false,
    "max_plus_ones" INTEGER NOT NULL DEFAULT 0,
    "require_approval_for_plus_ones" BOOLEAN NOT NULL DEFAULT true,
    "rsvp_deadline" TIMESTAMP(3),
    "allow_seat_overbooking" BOOLEAN NOT NULL DEFAULT false,
    "public_rsvp_website" TEXT,
    "invited_by_options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visible_tabs" "event_visible_tab"[] DEFAULT ARRAY['TIMELINE', 'DETAILS', 'MAP']::"event_visible_tab"[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "dress_code" TEXT,
    "description" TEXT,
    "schedule_ticket_release" BOOLEAN NOT NULL DEFAULT false,
    "ticket_release_at" TIMESTAMP(3),
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "category" "event_category" NOT NULL DEFAULT 'GENERAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_analytics" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
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
CREATE TABLE "analytics_outbox" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "topic" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "correlation_id" TEXT,
    "actor_id" UUID,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_at" TIMESTAMP(3),
    "locked_by" TEXT,
    "published_at" TIMESTAMP(3),
    "dead_lettered_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_timeline" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "source_id" TEXT,
    "reference_id" TEXT,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "event_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_event_role" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "role" "user_role_type" NOT NULL,

    CONSTRAINT "user_event_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_role" (
    "id" UUID NOT NULL,
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
CREATE TABLE "event_role_permission" (
    "role_id" UUID NOT NULL,
    "permission_key" TEXT NOT NULL,

    CONSTRAINT "event_role_permission_pkey" PRIMARY KEY ("role_id","permission_key")
);

-- CreateTable
CREATE TABLE "event_user_role" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "event_user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER,
    "type" "media_type" NOT NULL DEFAULT 'GALLERY',
    "eventId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_variant" (
    "id" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "format" TEXT NOT NULL,

    CONSTRAINT "media_variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat_color_group" (
    "id" UUID NOT NULL,
    "settings_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "style" JSONB NOT NULL,
    "match_type" "seat_color_group_match_type" NOT NULL,
    "invited_by_values" JSONB NOT NULL,
    "priority" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "is_orphaned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "seat_color_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_projection" (
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

-- CreateIndex
CREATE INDEX "event_parent_id_idx" ON "event"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_event_id_key" ON "settings"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_analytics_event_id_key" ON "event_analytics"("event_id");

-- CreateIndex
CREATE INDEX "analytics_outbox_published_at_dead_lettered_at_next_attempt_idx" ON "analytics_outbox"("published_at", "dead_lettered_at", "next_attempt_at");

-- CreateIndex
CREATE UNIQUE INDEX "event_timeline_source_id_key" ON "event_timeline"("source_id");

-- CreateIndex
CREATE INDEX "event_timeline_event_id_idx" ON "event_timeline"("event_id");

-- CreateIndex
CREATE INDEX "user_event_role_event_id_idx" ON "user_event_role"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_event_role_user_id_event_id_key" ON "user_event_role"("user_id", "event_id");

-- CreateIndex
CREATE INDEX "event_role_event_id_idx" ON "event_role"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_role_event_id_key_key" ON "event_role"("event_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "event_role_event_id_system_key_key" ON "event_role"("event_id", "system_key");

-- CreateIndex
CREATE INDEX "event_role_permission_permission_key_idx" ON "event_role_permission"("permission_key");

-- CreateIndex
CREATE INDEX "event_user_role_event_id_user_id_idx" ON "event_user_role"("event_id", "user_id");

-- CreateIndex
CREATE INDEX "event_user_role_role_id_idx" ON "event_user_role"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_user_role_event_id_user_id_role_id_key" ON "event_user_role"("event_id", "user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_key_key" ON "media"("key");

-- CreateIndex
CREATE INDEX "media_eventId_idx" ON "media"("eventId");

-- CreateIndex
CREATE INDEX "media_variant_mediaId_idx" ON "media_variant"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "media_variant_mediaId_width_format_key" ON "media_variant"("mediaId", "width", "format");

-- CreateIndex
CREATE INDEX "seat_color_group_settings_id_idx" ON "seat_color_group"("settings_id");

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_logo_media_id_fkey" FOREIGN KEY ("logo_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_owner_fkey" FOREIGN KEY ("owner") REFERENCES "user_projection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_analytics" ADD CONSTRAINT "event_analytics_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_timeline" ADD CONSTRAINT "event_timeline_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_event_role" ADD CONSTRAINT "user_event_role_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_event_role" ADD CONSTRAINT "user_event_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_projection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "event_user_role" ADD CONSTRAINT "event_user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_projection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_user_role" ADD CONSTRAINT "event_user_role_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "user_projection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_variant" ADD CONSTRAINT "media_variant_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_color_group" ADD CONSTRAINT "seat_color_group_settings_id_fkey" FOREIGN KEY ("settings_id") REFERENCES "settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
