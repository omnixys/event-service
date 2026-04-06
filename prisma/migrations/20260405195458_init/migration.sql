-- AlterTable
ALTER TABLE "event" ADD COLUMN     "depth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isRoot" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "path" TEXT;

-- CreateIndex
CREATE INDEX "event_parentId_idx" ON "event"("parentId");
