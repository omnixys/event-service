/*
  Warnings:

  - A unique constraint covering the columns `[guest_id,event_id]` on the table `seat` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "seat_guest_id_event_id_key" ON "seat"("guest_id", "event_id");
