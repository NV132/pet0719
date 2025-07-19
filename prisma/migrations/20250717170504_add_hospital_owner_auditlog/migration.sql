-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "targetId" INTEGER,
    "targetType" TEXT,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "updatedAt" DATETIME NOT NULL,
    "ownerId" INTEGER,
    CONSTRAINT "Hospital_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Hospital" ("address", "createdAt", "description", "faq", "id", "imageUrls", "name", "openHours", "phone", "updatedAt") SELECT "address", "createdAt", "description", "faq", "id", "imageUrls", "name", "openHours", "phone", "updatedAt" FROM "Hospital";
DROP TABLE "Hospital";
ALTER TABLE "new_Hospital" RENAME TO "Hospital";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
