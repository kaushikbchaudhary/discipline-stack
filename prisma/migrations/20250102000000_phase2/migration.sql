-- AlterTable
ALTER TABLE "Plan" ADD COLUMN "locked" BOOLEAN NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "WeeklyReview" ADD COLUMN "stopDoing" TEXT NOT NULL DEFAULT "";
ALTER TABLE "WeeklyReview" ADD COLUMN "resistanceBlock" TEXT NOT NULL DEFAULT "";

-- CreateTable
CREATE TABLE "ExecutionDebt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "missedDate" DATETIME NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" DATETIME,
  "resolutionType" TEXT,
  "resolutionNote" TEXT,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FailureDay" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "note" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanChangeLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "changeAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "changeType" TEXT NOT NULL,
  "details" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeeklyInsights" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "weekStartDate" DATETIME NOT NULL,
  "missedByCategory" TEXT NOT NULL,
  "mostSkippedHour" INTEGER NOT NULL,
  "trend" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ExecutionDebt_userId_missedDate_idx" ON "ExecutionDebt"("userId", "missedDate");

-- CreateIndex
CREATE INDEX "ExecutionDebt_userId_resolvedAt_idx" ON "ExecutionDebt"("userId", "resolvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FailureDay_userId_date_key" ON "FailureDay"("userId", "date");

-- CreateIndex
CREATE INDEX "FailureDay_userId_date_idx" ON "FailureDay"("userId", "date");

-- CreateIndex
CREATE INDEX "PlanChangeLog_userId_changeAt_idx" ON "PlanChangeLog"("userId", "changeAt");

-- CreateIndex
CREATE INDEX "PlanChangeLog_planId_changeAt_idx" ON "PlanChangeLog"("planId", "changeAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyInsights_userId_weekStartDate_key" ON "WeeklyInsights"("userId", "weekStartDate");

-- CreateIndex
CREATE INDEX "WeeklyInsights_userId_weekStartDate_idx" ON "WeeklyInsights"("userId", "weekStartDate");
