-- AlterTable
ALTER TABLE "User" ADD COLUMN "activeGoalId" TEXT;

-- AlterTable
ALTER TABLE "DailyCompletion" ADD COLUMN "dailyWinSatisfied" BOOLEAN NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "DailyWin" ADD COLUMN "goalId" TEXT;

-- CreateTable
CREATE TABLE "Goal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "goalType" TEXT NOT NULL,
  "startDate" DATETIME NOT NULL,
  "targetDate" DATETIME,
  "isActive" BOOLEAN NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GoalArtifact" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "goalId" TEXT NOT NULL,
  "blockId" TEXT,
  "date" DATETIME NOT NULL,
  "type" TEXT NOT NULL,
  "content" TEXT,
  "fileUrl" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("blockId") REFERENCES "ScheduleBlock" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Data migration: map legacy categories
UPDATE "ScheduleBlock" SET "category" = 'CoreWork' WHERE "category" = 'Income';
UPDATE "ScheduleBlock" SET "category" = 'Practice' WHERE "category" = 'Creation';
UPDATE "ScheduleBlock" SET "category" = 'Recovery' WHERE "category" = 'Rest';

UPDATE "Task" SET "category" = 'CoreWork' WHERE "category" = 'Income';
UPDATE "Task" SET "category" = 'Practice' WHERE "category" = 'Creation';
UPDATE "Task" SET "category" = 'Recovery' WHERE "category" = 'Rest';

-- CreateIndex
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");
CREATE INDEX "Goal_userId_isActive_idx" ON "Goal"("userId", "isActive");
CREATE INDEX "GoalArtifact_userId_date_idx" ON "GoalArtifact"("userId", "date");
CREATE INDEX "GoalArtifact_goalId_date_idx" ON "GoalArtifact"("goalId", "date");
