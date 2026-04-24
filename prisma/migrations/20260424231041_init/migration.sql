-- CreateEnum
CREATE TYPE "UserRoleType" AS ENUM ('ADMIN', 'SECURITY', 'GUEST');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('GENERAL', 'KONFERENZ', 'MUSIK', 'WORKSHOP', 'SOCIAL', 'SPORTS');

-- CreateTable
CREATE TABLE "event" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "parentId" UUID,
    "path" TEXT NOT NULL DEFAULT '',
    "depth" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "allow_re_entry" BOOLEAN NOT NULL DEFAULT true,
    "rotate_seconds" INTEGER NOT NULL DEFAULT 300,
    "max_seats" INTEGER NOT NULL DEFAULT 10,
    "allow_public_rsvp" BOOLEAN NOT NULL DEFAULT true,
    "allow_public_plus_one" BOOLEAN NOT NULL DEFAULT true,
    "allow_public_rsvp_website" BOOLEAN NOT NULL DEFAULT false,
    "public_rsvp_website" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "cover_image_url" TEXT,
    "logo_url" TEXT,
    "dress_code" TEXT,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "category" "EventCategory" NOT NULL DEFAULT 'GENERAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

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
    "role" "UserRoleType" NOT NULL,

    CONSTRAINT "user_event_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER,
    "ownerId" UUID,
    "eventId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaVariant" (
    "id" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "format" TEXT NOT NULL,

    CONSTRAINT "MediaVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_parentId_idx" ON "event"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_eventId_key" ON "settings"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "event_analytics_event_id_key" ON "event_analytics"("event_id");

-- CreateIndex
CREATE INDEX "event_timeline_event_id_idx" ON "event_timeline"("event_id");

-- CreateIndex
CREATE INDEX "user_event_role_event_id_idx" ON "user_event_role"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_event_role_user_id_event_id_key" ON "user_event_role"("user_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "Media_key_key" ON "Media"("key");

-- CreateIndex
CREATE INDEX "MediaVariant_mediaId_idx" ON "MediaVariant"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaVariant_mediaId_width_key" ON "MediaVariant"("mediaId", "width");

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_analytics" ADD CONSTRAINT "event_analytics_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_timeline" ADD CONSTRAINT "event_timeline_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_event_role" ADD CONSTRAINT "user_event_role_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaVariant" ADD CONSTRAINT "MediaVariant_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
