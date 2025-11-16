/*
  Warnings:

  - The `number` column on the `seat` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "seat" DROP COLUMN "number",
ADD COLUMN     "number" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "seat_event_id_section_table_number_key" ON "seat"("event_id", "section", "table", "number");
