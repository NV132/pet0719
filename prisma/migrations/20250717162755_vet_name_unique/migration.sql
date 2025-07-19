/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Veterinarian` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Veterinarian_name_key" ON "Veterinarian"("name");
