-- AlterTable
ALTER TABLE "User" ADD COLUMN "dailyWinBlockId" TEXT;
ALTER TABLE "User" ADD COLUMN "dailyWinType" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NextAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NextAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NextAction_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "ScheduleBlock" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_NextAction" ("blockId", "createdAt", "date", "id", "text", "updatedAt", "userId") SELECT "blockId", "createdAt", "date", "id", "text", "updatedAt", "userId" FROM "NextAction";
DROP TABLE "NextAction";
ALTER TABLE "new_NextAction" RENAME TO "NextAction";
CREATE INDEX "NextAction_userId_date_idx" ON "NextAction"("userId", "date");
CREATE UNIQUE INDEX "NextAction_userId_blockId_date_key" ON "NextAction"("userId", "blockId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
