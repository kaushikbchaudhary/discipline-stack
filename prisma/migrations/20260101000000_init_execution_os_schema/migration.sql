CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "GoalType" AS ENUM (
  'EXAM_PREP',
  'CAREER_GROWTH',
  'BUSINESS',
  'SKILL_BUILDING',
  'HEALTH',
  'PERSONAL_SYSTEM',
  'CUSTOM'
);

CREATE TYPE "BlockCategory" AS ENUM (
  'CoreWork',
  'SupportWork',
  'Learning',
  'Practice',
  'Health',
  'Reflection',
  'Recovery'
);

CREATE TYPE "ArtifactType" AS ENUM ('TEXT', 'URL', 'FILE');

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY,
  "email" TEXT UNIQUE,
  "name" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "goals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "goal_type" "GoalType" NOT NULL,
  "start_date" TIMESTAMPTZ NOT NULL,
  "target_date" TIMESTAMPTZ,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "goals_user_id_idx" ON "goals" ("user_id");
CREATE INDEX "goals_user_id_is_active_idx" ON "goals" ("user_id", "is_active");

CREATE TABLE "execution_blocks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "category" "BlockCategory" NOT NULL,
  "start_time" TEXT NOT NULL,
  "end_time" TEXT NOT NULL,
  "duration_minutes" INTEGER NOT NULL,
  "mandatory" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "execution_blocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "execution_blocks_user_id_idx" ON "execution_blocks" ("user_id");

CREATE TABLE "plans" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "start_date" TIMESTAMPTZ NOT NULL,
  "duration_days" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "plans_user_id_idx" ON "plans" ("user_id");
CREATE INDEX "plans_user_id_start_date_idx" ON "plans" ("user_id", "start_date");

CREATE TABLE "plan_days" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "plan_id" UUID NOT NULL,
  "day_index" INTEGER NOT NULL,
  "date" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "plan_days_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "plan_days_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "plan_days_plan_id_day_index_key" ON "plan_days" ("plan_id", "day_index");
CREATE INDEX "plan_days_user_id_date_idx" ON "plan_days" ("user_id", "date");
CREATE INDEX "plan_days_plan_id_date_idx" ON "plan_days" ("plan_id", "date");

CREATE TABLE "tasks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "plan_day_id" UUID NOT NULL,
  "block_id" UUID,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" TIMESTAMPTZ NOT NULL,
  "start_time" TEXT NOT NULL,
  "end_time" TEXT NOT NULL,
  "duration_minutes" INTEGER NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT FALSE,
  "incomplete_reason" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "tasks_plan_day_id_fkey" FOREIGN KEY ("plan_day_id") REFERENCES "plan_days"("id") ON DELETE CASCADE,
  CONSTRAINT "tasks_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "execution_blocks"("id") ON DELETE SET NULL
);

CREATE INDEX "tasks_user_id_date_idx" ON "tasks" ("user_id", "date");
CREATE INDEX "tasks_plan_day_id_idx" ON "tasks" ("plan_day_id");
CREATE INDEX "tasks_block_id_idx" ON "tasks" ("block_id");

CREATE TABLE "daily_completions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "date" TIMESTAMPTZ NOT NULL,
  "completed_at" TIMESTAMPTZ,
  "output_type" "ArtifactType",
  "output_content" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "daily_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "daily_completions_user_id_date_key" ON "daily_completions" ("user_id", "date");
CREATE INDEX "daily_completions_user_id_date_idx" ON "daily_completions" ("user_id", "date");

CREATE TABLE "artifacts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "goal_id" UUID,
  "task_id" UUID,
  "block_id" UUID,
  "date" TIMESTAMPTZ NOT NULL,
  "type" "ArtifactType" NOT NULL,
  "content" TEXT,
  "url" TEXT,
  "file_url" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "artifacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "artifacts_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE SET NULL,
  CONSTRAINT "artifacts_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL,
  CONSTRAINT "artifacts_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "execution_blocks"("id") ON DELETE SET NULL
);

CREATE INDEX "artifacts_user_id_date_idx" ON "artifacts" ("user_id", "date");
CREATE INDEX "artifacts_goal_id_date_idx" ON "artifacts" ("goal_id", "date");

CREATE TABLE "weekly_reviews" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "week_start_date" TIMESTAMPTZ NOT NULL,
  "q1" TEXT NOT NULL,
  "q2" TEXT NOT NULL,
  "q3" TEXT NOT NULL,
  "q4" TEXT NOT NULL,
  "stop_doing" TEXT,
  "resistance_block" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "weekly_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "weekly_reviews_user_id_week_start_date_key" ON "weekly_reviews" ("user_id", "week_start_date");
CREATE INDEX "weekly_reviews_user_id_week_start_date_idx" ON "weekly_reviews" ("user_id", "week_start_date");

CREATE TABLE "push_subscriptions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions" ("endpoint");
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions" ("user_id");
