-- AlterTable
ALTER TABLE "User" ADD COLUMN "dailyWinType" TEXT;
ALTER TABLE "User" ADD COLUMN "dailyWinBlockId" TEXT;

-- CreateTable
CREATE TABLE "DailyWin" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "satisfiedBy" TEXT NOT NULL,
  "satisfiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlockResistance" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "blockId" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("blockId") REFERENCES "ScheduleBlock" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NextAction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "blockId" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("blockId") REFERENCES "ScheduleBlock" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuietWeek" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "weekStartDate" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyWin_userId_date_key" ON "DailyWin"("userId", "date");
CREATE INDEX "DailyWin_userId_date_idx" ON "DailyWin"("userId", "date");

CREATE UNIQUE INDEX "BlockResistance_userId_blockId_date_key" ON "BlockResistance"("userId", "blockId", "date");
CREATE INDEX "BlockResistance_userId_date_idx" ON "BlockResistance"("userId", "date");

CREATE UNIQUE INDEX "NextAction_userId_blockId_date_key" ON "NextAction"("userId", "blockId", "date");
CREATE INDEX "NextAction_userId_date_idx" ON "NextAction"("userId", "date");

CREATE UNIQUE INDEX "QuietWeek_userId_weekStartDate_key" ON "QuietWeek"("userId", "weekStartDate");
CREATE INDEX "QuietWeek_userId_weekStartDate_idx" ON "QuietWeek"("userId", "weekStartDate");
