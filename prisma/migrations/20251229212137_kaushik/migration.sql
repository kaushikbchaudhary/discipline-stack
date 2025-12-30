-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Plan" ("createdAt", "durationDays", "id", "name", "startDate", "updatedAt", "userId") SELECT "createdAt", "durationDays", "id", "name", "startDate", "updatedAt", "userId" FROM "Plan";
DROP TABLE "Plan";
ALTER TABLE "new_Plan" RENAME TO "Plan";
CREATE INDEX "Plan_userId_idx" ON "Plan"("userId");
CREATE TABLE "new_ScheduleBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "lockedVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScheduleBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ScheduleBlock" ("category", "createdAt", "endTime", "id", "lockedVersion", "mandatory", "name", "startTime", "updatedAt", "userId") SELECT "category", "createdAt", "endTime", "id", "lockedVersion", "mandatory", "name", "startTime", "updatedAt", "userId" FROM "ScheduleBlock";
DROP TABLE "ScheduleBlock";
ALTER TABLE "new_ScheduleBlock" RENAME TO "ScheduleBlock";
CREATE INDEX "ScheduleBlock_userId_idx" ON "ScheduleBlock"("userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "passwordHash" TEXT,
    "scheduleLocked" BOOLEAN NOT NULL DEFAULT false,
    "scheduleLockVersion" INTEGER NOT NULL DEFAULT 1,
    "pastEditUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "name", "passwordHash", "pastEditUnlocked", "scheduleLockVersion", "scheduleLocked", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "name", "passwordHash", "pastEditUnlocked", "scheduleLockVersion", "scheduleLocked", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
