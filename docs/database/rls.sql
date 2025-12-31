-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users: each user can access their own profile row
CREATE POLICY "users_self_select" ON public.users
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_self_insert" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "users_self_update" ON public.users
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Goals
CREATE POLICY "goals_owner_select" ON public.goals
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "goals_owner_insert" ON public.goals
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "goals_owner_update" ON public.goals
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "goals_owner_delete" ON public.goals
  FOR DELETE USING (user_id = auth.uid());

-- Execution blocks
CREATE POLICY "blocks_owner_select" ON public.execution_blocks
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "blocks_owner_insert" ON public.execution_blocks
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "blocks_owner_update" ON public.execution_blocks
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "blocks_owner_delete" ON public.execution_blocks
  FOR DELETE USING (user_id = auth.uid());

-- Plans
CREATE POLICY "plans_owner_select" ON public.plans
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "plans_owner_insert" ON public.plans
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "plans_owner_update" ON public.plans
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "plans_owner_delete" ON public.plans
  FOR DELETE USING (user_id = auth.uid());

-- Plan days
CREATE POLICY "plan_days_owner_select" ON public.plan_days
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "plan_days_owner_insert" ON public.plan_days
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "plan_days_owner_update" ON public.plan_days
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "plan_days_owner_delete" ON public.plan_days
  FOR DELETE USING (user_id = auth.uid());

-- Tasks
CREATE POLICY "tasks_owner_select" ON public.tasks
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "tasks_owner_insert" ON public.tasks
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "tasks_owner_update" ON public.tasks
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "tasks_owner_delete" ON public.tasks
  FOR DELETE USING (user_id = auth.uid());

-- Daily completions
CREATE POLICY "daily_completions_owner_select" ON public.daily_completions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "daily_completions_owner_insert" ON public.daily_completions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "daily_completions_owner_update" ON public.daily_completions
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "daily_completions_owner_delete" ON public.daily_completions
  FOR DELETE USING (user_id = auth.uid());

-- Artifacts
CREATE POLICY "artifacts_owner_select" ON public.artifacts
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "artifacts_owner_insert" ON public.artifacts
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "artifacts_owner_update" ON public.artifacts
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "artifacts_owner_delete" ON public.artifacts
  FOR DELETE USING (user_id = auth.uid());

-- Weekly reviews
CREATE POLICY "weekly_reviews_owner_select" ON public.weekly_reviews
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "weekly_reviews_owner_insert" ON public.weekly_reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "weekly_reviews_owner_update" ON public.weekly_reviews
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "weekly_reviews_owner_delete" ON public.weekly_reviews
  FOR DELETE USING (user_id = auth.uid());

-- Push subscriptions
CREATE POLICY "push_subscriptions_owner_select" ON public.push_subscriptions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "push_subscriptions_owner_insert" ON public.push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "push_subscriptions_owner_update" ON public.push_subscriptions
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "push_subscriptions_owner_delete" ON public.push_subscriptions
  FOR DELETE USING (user_id = auth.uid());
