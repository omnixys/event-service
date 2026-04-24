/*
  Warnings:

  - You are about to drop the `Media` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MediaVariant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MediaVariant" DROP CONSTRAINT "MediaVariant_mediaId_fkey";

-- DropTable
DROP TABLE "Media";

-- DropTable
DROP TABLE "MediaVariant";

-- CreateTable
CREATE TABLE "media" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER,
    "ownerId" UUID,
    "eventId" UUID,
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
CREATE UNIQUE INDEX "media_key_key" ON "media"("key");

-- CreateIndex
CREATE INDEX "media_variant_mediaId_idx" ON "media_variant"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "media_variant_mediaId_width_key" ON "media_variant"("mediaId", "width");

-- AddForeignKey
ALTER TABLE "media_variant" ADD CONSTRAINT "media_variant_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
