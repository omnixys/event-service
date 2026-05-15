-- CreateEnum
CREATE TYPE "user_role_type" AS ENUM ('ADMIN', 'SECURITY', 'GUEST');

-- CreateEnum
CREATE TYPE "event_category" AS ENUM ('GENERAL', 'KONFERENZ', 'MUSIK', 'WORKSHOP', 'SOCIAL', 'SPORTS');

-- CreateEnum
CREATE TYPE "media_type" AS ENUM ('COVER', 'LOGO', 'GALLERY');

-- CreateEnum
CREATE TYPE "invitation_approval_mode" AS ENUM ('MANUAL', 'AUTO', 'AUTO_PUBLIC_ONLY', 'AUTO_INVITE_ONLY');

-- CreateTable
CREATE TABLE "event" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
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
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "dress_code" TEXT,
    "description" TEXT,
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
CREATE TABLE "event_timeline" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
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

-- CreateIndex
CREATE INDEX "event_parent_id_idx" ON "event"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_event_id_key" ON "settings"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_analytics_event_id_key" ON "event_analytics"("event_id");

-- CreateIndex
CREATE INDEX "event_timeline_event_id_idx" ON "event_timeline"("event_id");

-- CreateIndex
CREATE INDEX "user_event_role_event_id_idx" ON "user_event_role"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_event_role_user_id_event_id_key" ON "user_event_role"("user_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_key_key" ON "media"("key");

-- CreateIndex
CREATE INDEX "media_eventId_idx" ON "media"("eventId");

-- CreateIndex
CREATE INDEX "media_variant_mediaId_idx" ON "media_variant"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "media_variant_mediaId_width_format_key" ON "media_variant"("mediaId", "width", "format");

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_logo_media_id_fkey" FOREIGN KEY ("logo_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_analytics" ADD CONSTRAINT "event_analytics_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_timeline" ADD CONSTRAINT "event_timeline_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_event_role" ADD CONSTRAINT "user_event_role_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_variant" ADD CONSTRAINT "media_variant_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
