/*
  Warnings:

  - You are about to drop the column `image` on the `Hospital` table. All the data in the column will be lost.
  - You are about to drop the column `specialties` on the `Hospital` table. All the data in the column will be lost.
  - You are about to drop the column `vets` on the `Hospital` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Specialty" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "HospitalSpecialty" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hospitalId" INTEGER NOT NULL,
    "specialtyId" INTEGER NOT NULL,
    CONSTRAINT "HospitalSpecialty_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HospitalSpecialty_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Veterinarian" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "license" TEXT,
    "profileImage" TEXT
);

-- CreateTable
CREATE TABLE "HospitalVeterinarian" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hospitalId" INTEGER NOT NULL,
    "veterinarianId" INTEGER NOT NULL,
    CONSTRAINT "HospitalVeterinarian_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HospitalVeterinarian_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "Veterinarian" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Hospital" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "openHours" TEXT,
    "description" TEXT,
    "imageUrls" TEXT,
    "faq" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Hospital" ("address", "createdAt", "id", "name", "openHours", "phone", "updatedAt") SELECT "address", "createdAt", "id", "name", "openHours", "phone", "updatedAt" FROM "Hospital";
DROP TABLE "Hospital";
ALTER TABLE "new_Hospital" RENAME TO "Hospital";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_name_key" ON "Specialty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalSpecialty_hospitalId_specialtyId_key" ON "HospitalSpecialty"("hospitalId", "specialtyId");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalVeterinarian_hospitalId_veterinarianId_key" ON "HospitalVeterinarian"("hospitalId", "veterinarianId");
