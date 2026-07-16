-- CreateEnum
CREATE TYPE "seat_color_group_match_type" AS ENUM ('SINGLE', 'CUSTOM', 'ALL', 'NONE');

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

-- CreateIndex
CREATE INDEX "seat_color_group_settings_id_idx" ON "seat_color_group"("settings_id");

-- AddForeignKey
ALTER TABLE "seat_color_group" ADD CONSTRAINT "seat_color_group_settings_id_fkey" FOREIGN KEY ("settings_id") REFERENCES "settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
