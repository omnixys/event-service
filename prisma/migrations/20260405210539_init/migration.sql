/*
  Warnings:

  - You are about to drop the column `isRoot` on the `event` table. All the data in the column will be lost.
  - Made the column `path` on table `event` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "event" DROP COLUMN "isRoot",
ALTER COLUMN "path" SET NOT NULL,
ALTER COLUMN "path" SET DEFAULT '';
