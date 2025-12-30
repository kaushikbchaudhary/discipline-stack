/*
  Warnings:

  - You are about to drop the column `category` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `mandatory` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `planDayId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `Task` table. All the data in the column will be lost.
  - Added the required column `date` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyWin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "satisfiedBy" TEXT NOT NULL,
    "satisfiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "goalId" TEXT,
    CONSTRAINT "DailyWin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DailyWin_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DailyWin" ("date", "goalId", "id", "satisfiedAt", "satisfiedBy", "userId") SELECT "date", "goalId", "id", "satisfiedAt", "satisfiedBy", "userId" FROM "DailyWin";
DROP TABLE "DailyWin";
ALTER TABLE "new_DailyWin" RENAME TO "DailyWin";
CREATE INDEX "DailyWin_userId_date_idx" ON "DailyWin"("userId", "date");
CREATE UNIQUE INDEX "DailyWin_userId_date_key" ON "DailyWin"("userId", "date");
CREATE TABLE "new_Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "goalType" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "targetDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Goal" ("createdAt", "description", "goalType", "id", "isActive", "startDate", "targetDate", "title", "updatedAt", "userId") SELECT "createdAt", "description", "goalType", "id", "isActive", "startDate", "targetDate", "title", "updatedAt", "userId" FROM "Goal";
DROP TABLE "Goal";
ALTER TABLE "new_Goal" RENAME TO "Goal";
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");
CREATE INDEX "Goal_userId_isActive_idx" ON "Goal"("userId", "isActive");
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "date" DATETIME NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "durationMinutes" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "incompleteReason" TEXT,
    "planId" TEXT NOT NULL,
    CONSTRAINT "Task_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("id", "title") SELECT "id", "title" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_planId_idx" ON "Task"("planId");
CREATE INDEX "Task_planId_date_idx" ON "Task"("planId", "date");
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
    "dailyWinType" TEXT,
    "dailyWinBlockId" TEXT,
    "activeGoalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_activeGoalId_fkey" FOREIGN KEY ("activeGoalId") REFERENCES "Goal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "dailyWinBlockId", "dailyWinType", "email", "emailVerified", "id", "image", "name", "passwordHash", "pastEditUnlocked", "scheduleLockVersion", "scheduleLocked", "updatedAt") SELECT "createdAt", "dailyWinBlockId", "dailyWinType", "email", "emailVerified", "id", "image", "name", "passwordHash", "pastEditUnlocked", "scheduleLockVersion", "scheduleLocked", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
