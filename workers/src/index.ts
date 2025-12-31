import { Router } from "itty-router";
import { z } from "zod";

type Env = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

type AuthedRequest = Request & { userId?: string; token?: string };

const router = Router();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

router.options("*", () => new Response(null, { status: 204, headers: corsHeaders }));

const getUserFromToken = async (env: Env, token: string) => {
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: env.SUPABASE_ANON_KEY,
    },
  });
  if (!response.ok) {
    return null;
  }
  return response.json() as Promise<{ id: string }>;
};

const withAuth = async (request: AuthedRequest, env: Env) => {
  const header = request.headers.get("authorization") || "";
  const token = header.replace("Bearer ", "").trim();
  if (!token) {
    return null;
  }
  const user = await getUserFromToken(env, token);
  if (!user) {
    return null;
  }
  request.userId = user.id;
  request.token = token;
  return user;
};

const restRequest = async (
  env: Env,
  path: string,
  options: RequestInit & { token?: string; useServiceRole?: boolean } = {},
) => {
  const url = `${env.SUPABASE_URL}/rest/v1/${path}`;
  const headers = new Headers(options.headers || {});
  const apiKey = options.useServiceRole ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY;
  headers.set("apikey", apiKey);
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  } else {
    headers.set("Authorization", `Bearer ${apiKey}`);
  }
  headers.set("Content-Type", "application/json");
  return fetch(url, { ...options, headers });
};

router.get("/health", () => json({ ok: true }));

router.post("/user/ensure", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }
  const response = await restRequest(env, "users", {
    method: "POST",
    token: request.token,
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      id: user.id,
      email: (user as { email?: string }).email ?? null,
      name: (user as { user_metadata?: { name?: string } }).user_metadata?.name ?? null,
    }),
  });
  if (!response.ok) {
    return json({ error: "User sync failed" }, 500);
  }
  return json({ ok: true });
});

const onboardingSchema = z.object({
  goalTitle: z.string().min(1),
  goalDescription: z.string().optional().nullable(),
  goalType: z.enum([
    "EXAM_PREP",
    "CAREER_GROWTH",
    "BUSINESS",
    "SKILL_BUILDING",
    "HEALTH",
    "PERSONAL_SYSTEM",
    "CUSTOM",
  ]),
  startDate: z.string(),
});

router.post("/onboarding", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid payload" }, 400);
  }

  const response = await restRequest(env, "goals", {
    method: "POST",
    token: request.token,
    body: JSON.stringify({
      user_id: user.id,
      title: parsed.data.goalTitle,
      description: parsed.data.goalDescription ?? null,
      goal_type: parsed.data.goalType,
      start_date: parsed.data.startDate,
      is_active: true,
    }),
  });
  if (!response.ok) {
    return json({ error: "Goal create failed" }, 500);
  }

  return json({ ok: true });
});

router.get("/today", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }

  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  if (!date) {
    return json({ error: "Missing date" }, 400);
  }

  const tasksRes = await restRequest(env, `tasks?user_id=eq.${user.id}&date=eq.${date}`, {
    token: request.token,
  });
  const tasks = await tasksRes.json();

  const completionRes = await restRequest(
    env,
    `daily_completions?user_id=eq.${user.id}&date=eq.${date}`,
    { token: request.token },
  );
  const completions = await completionRes.json();

  return json({ tasks, completion: completions[0] ?? null });
});

router.get("/plan", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }

  const url = new URL(request.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  if (!start || !end) {
    return json({ error: "Missing date range" }, 400);
  }

  const [tasksRes, daysRes] = await Promise.all([
    restRequest(
      env,
      `tasks?user_id=eq.${user.id}&date=gte.${start}&date=lte.${end}&order=date.asc`,
      { token: request.token },
    ),
    restRequest(
      env,
      `plan_days?user_id=eq.${user.id}&date=gte.${start}&date=lte.${end}&order=date.asc`,
      { token: request.token },
    ),
  ]);
  const tasks = await tasksRes.json();
  const days = await daysRes.json();
  return json({ tasks, days });
});

const taskCreateSchema = z.object({
  planDayId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  durationMinutes: z.number().int(),
});

router.post("/tasks", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  const parsed = taskCreateSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid payload" }, 400);
  }

  const response = await restRequest(env, "tasks", {
    method: "POST",
    token: request.token,
    body: JSON.stringify({
      user_id: user.id,
      plan_day_id: parsed.data.planDayId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      date: parsed.data.date,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
      duration_minutes: parsed.data.durationMinutes,
      completed: false,
      incomplete_reason: null,
    }),
  });

  if (!response.ok) {
    return json({ error: "Create failed" }, 500);
  }
  return json({ ok: true });
});

router.get("/blocks", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }
  const response = await restRequest(env, `execution_blocks?user_id=eq.${user.id}&order=start_time.asc`, {
    token: request.token,
  });
  const blocks = await response.json();
  return json({ blocks });
});

const blockSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  category: z.enum([
    "CoreWork",
    "SupportWork",
    "Learning",
    "Practice",
    "Health",
    "Reflection",
    "Recovery",
  ]),
  startTime: z.string(),
  endTime: z.string(),
  durationMinutes: z.number().int(),
  mandatory: z.boolean(),
});

router.post("/blocks", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  const parsed = blockSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid payload" }, 400);
  }
  const response = await restRequest(env, "execution_blocks", {
    method: "POST",
    token: request.token,
    body: JSON.stringify({
      user_id: user.id,
      name: parsed.data.name,
      category: parsed.data.category,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
      duration_minutes: parsed.data.durationMinutes,
      mandatory: parsed.data.mandatory,
    }),
  });
  if (!response.ok) {
    return json({ error: "Create failed" }, 500);
  }
  return json({ ok: true });
});

router.patch("/blocks", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  const parsed = blockSchema.safeParse(body);
  if (!parsed.success || !parsed.data.id) {
    return json({ error: "Invalid payload" }, 400);
  }
  const response = await restRequest(
    env,
    `execution_blocks?id=eq.${parsed.data.id}&user_id=eq.${user.id}`,
    {
      method: "PATCH",
      token: request.token,
      body: JSON.stringify({
        name: parsed.data.name,
        category: parsed.data.category,
        start_time: parsed.data.startTime,
        end_time: parsed.data.endTime,
        duration_minutes: parsed.data.durationMinutes,
        mandatory: parsed.data.mandatory,
      }),
    },
  );
  if (!response.ok) {
    return json({ error: "Update failed" }, 500);
  }
  return json({ ok: true });
});

router.delete("/blocks", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  const parsed = z.object({ id: z.string().uuid() }).safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid payload" }, 400);
  }
  const response = await restRequest(env, `execution_blocks?id=eq.${parsed.data.id}&user_id=eq.${user.id}`, {
    method: "DELETE",
    token: request.token,
  });
  if (!response.ok) {
    return json({ error: "Delete failed" }, 500);
  }
  return json({ ok: true });
});

const taskUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  durationMinutes: z.number().int(),
  incompleteReason: z.string().optional().nullable(),
});

router.patch("/tasks", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  const parsed = taskUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid payload" }, 400);
  }

  const response = await restRequest(env, `tasks?id=eq.${parsed.data.id}&user_id=eq.${user.id}`, {
    method: "PATCH",
    token: request.token,
    body: JSON.stringify({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
      duration_minutes: parsed.data.durationMinutes,
      incomplete_reason: parsed.data.incompleteReason ?? null,
    }),
  });

  if (!response.ok) {
    return json({ error: "Update failed" }, 500);
  }
  return json({ ok: true });
});

const taskDeleteSchema = z.object({ id: z.string().uuid() });

router.delete("/tasks", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  const parsed = taskDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid payload" }, 400);
  }
  const response = await restRequest(env, `tasks?id=eq.${parsed.data.id}&user_id=eq.${user.id}`, {
    method: "DELETE",
    token: request.token,
  });
  if (!response.ok) {
    return json({ error: "Delete failed" }, 500);
  }
  return json({ ok: true });
});

const toggleSchema = z.object({ taskId: z.string().uuid() });

router.post("/tasks/toggle", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid payload" }, 400);
  }

  const taskRes = await restRequest(env, `tasks?id=eq.${parsed.data.taskId}&user_id=eq.${user.id}`, {
    token: request.token,
  });
  const tasks = await taskRes.json();
  const task = tasks[0];
  if (!task) {
    return json({ error: "Task not found" }, 404);
  }

  const updateRes = await restRequest(env, `tasks?id=eq.${task.id}`, {
    method: "PATCH",
    token: request.token,
    body: JSON.stringify({ completed: !task.completed }),
  });

  if (!updateRes.ok) {
    return json({ error: "Update failed" }, 500);
  }

  return json({ ok: true, completed: !task.completed });
});

const outputSchema = z.object({
  date: z.string(),
  outputType: z.enum(["TEXT", "URL"]),
  outputContent: z.string().min(3),
});

router.post("/artifacts/text", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  const parsed = outputSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid payload" }, 400);
  }

  const completionRes = await restRequest(env, "daily_completions", {
    method: "POST",
    token: request.token,
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      user_id: user.id,
      date: parsed.data.date,
      output_type: parsed.data.outputType,
      output_content: parsed.data.outputContent,
    }),
  });

  if (!completionRes.ok) {
    return json({ error: "Completion update failed" }, 500);
  }

  const goalRes = await restRequest(
    env,
    `goals?user_id=eq.${user.id}&is_active=eq.true&limit=1`,
    { token: request.token },
  );
  const goals = await goalRes.json();
  const goalId = goals[0]?.id ?? null;

  await restRequest(env, "artifacts", {
    method: "POST",
    token: request.token,
    body: JSON.stringify({
      user_id: user.id,
      goal_id: goalId,
      task_id: null,
      block_id: null,
      date: parsed.data.date,
      type: parsed.data.outputType,
      content: parsed.data.outputContent,
    }),
  });

  return json({ ok: true });
});

const planImportSchema = z.object({
  name: z.string().min(1),
  startDate: z.string(),
  durationDays: z.number().int().min(1),
  days: z.array(
    z.object({
      dayIndex: z.number().int(),
      date: z.string(),
      tasks: z.array(
        z.object({
          title: z.string(),
          description: z.string().optional().nullable(),
          date: z.string(),
          startTime: z.string(),
          endTime: z.string(),
          durationMinutes: z.number().int(),
        }),
      ),
    }),
  ),
});

router.post("/plan/import", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  const parsed = planImportSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid plan" }, 400);
  }

  const startDate = parsed.data.startDate;
  const endDate = parsed.data.days[parsed.data.days.length - 1]?.date ?? parsed.data.startDate;

  await restRequest(env, `tasks?user_id=eq.${user.id}&date=gte.${startDate}&date=lte.${endDate}`, {
    method: "DELETE",
    token: request.token,
  });
  await restRequest(
    env,
    `plan_days?user_id=eq.${user.id}&date=gte.${startDate}&date=lte.${endDate}`,
    {
      method: "DELETE",
      token: request.token,
    },
  );

  const planRes = await restRequest(env, "plans", {
    method: "POST",
    token: request.token,
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: user.id,
      name: parsed.data.name,
      start_date: parsed.data.startDate,
      duration_days: parsed.data.durationDays,
    }),
  });
  if (!planRes.ok) {
    return json({ error: "Plan create failed" }, 500);
  }
  const plan = await planRes.json();
  const planId = plan[0]?.id;
  if (!planId) {
    return json({ error: "Plan create failed" }, 500);
  }

  const planDaysPayload = parsed.data.days.map((day) => ({
    user_id: user.id,
    plan_id: planId,
    day_index: day.dayIndex,
    date: day.date,
  }));

  const planDaysRes = await restRequest(env, "plan_days", {
    method: "POST",
    token: request.token,
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(planDaysPayload),
  });
  if (!planDaysRes.ok) {
    return json({ error: "Plan days create failed" }, 500);
  }
  const planDays = await planDaysRes.json();
  const dayMap = new Map<number, string>();
  planDays.forEach((day: { day_index: number; id: string }) => {
    dayMap.set(day.day_index, day.id);
  });

  const taskPayload = parsed.data.days.flatMap((day) =>
    day.tasks.map((task) => ({
      user_id: user.id,
      plan_day_id: dayMap.get(day.dayIndex),
      title: task.title,
      description: task.description ?? null,
      date: task.date,
      start_time: task.startTime,
      end_time: task.endTime,
      duration_minutes: task.durationMinutes,
      completed: false,
      incomplete_reason: null,
    })),
  );

  const tasksRes = await restRequest(env, "tasks", {
    method: "POST",
    token: request.token,
    body: JSON.stringify(taskPayload),
  });
  if (!tasksRes.ok) {
    return json({ error: "Task create failed" }, 500);
  }

  const totalTasks = taskPayload.length;
  const totalMinutes = taskPayload.reduce((sum, task) => sum + (task.duration_minutes || 0), 0);
  const totalHours = Math.round(totalMinutes / 60);

  return json({
    ok: true,
    summary: {
      days: parsed.data.durationDays,
      tasks: totalTasks,
      hours: totalHours,
    },
  });
});

router.post("/plan/validate", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  const parsed = z.object({ plan: planImportSchema }).safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid plan" }, 400);
  }
  return json({ ok: true });
});

router.get("/dashboard", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 29);
  const startIso = start.toISOString().slice(0, 10);
  const endIso = now.toISOString().slice(0, 10);

  const [tasksRes, completionsRes, artifactsRes, reviewsRes] = await Promise.all([
    restRequest(
      env,
      `tasks?user_id=eq.${user.id}&date=gte.${startIso}&date=lte.${endIso}`,
      { token: request.token },
    ),
    restRequest(
      env,
      `daily_completions?user_id=eq.${user.id}&date=gte.${startIso}&date=lte.${endIso}`,
      { token: request.token },
    ),
    restRequest(
      env,
      `artifacts?user_id=eq.${user.id}&date=gte.${startIso}&date=lte.${endIso}&order=date.desc`,
      { token: request.token },
    ),
    restRequest(env, `weekly_reviews?user_id=eq.${user.id}&order=week_start_date.desc`, {
      token: request.token,
    }),
  ]);

  const tasks = await tasksRes.json();
  const completions = await completionsRes.json();
  const artifacts = await artifactsRes.json();
  const reviews = await reviewsRes.json();

  const completionMap = new Map(
    completions.map((item: { date: string; output_content: string | null }) => [
      item.date.slice(0, 10),
      item,
    ]),
  );

  const taskMap = new Map<string, { total: number; completed: number }>();
  tasks.forEach((task: { date: string; completed: boolean }) => {
    const key = task.date.slice(0, 10);
    const existing = taskMap.get(key) ?? { total: 0, completed: 0 };
    existing.total += 1;
    if (task.completed) {
      existing.completed += 1;
    }
    taskMap.set(key, existing);
  });

  const dailyStats = Array.from({ length: 30 }).map((_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const key = day.toISOString().slice(0, 10);
    const stats = taskMap.get(key) ?? { total: 0, completed: 0 };
    const completion = completionMap.get(key);
    const outputSummary = completion?.output_content ? "Proof added" : "No proof";
    const status =
      stats.total > 0 && stats.completed === stats.total && completion?.output_content
        ? "complete"
        : "incomplete";
    return {
      key,
      date: key,
      status,
      mandatoryCompletedCount: stats.completed,
      mandatoryTotalCount: stats.total,
      outputSummary,
    };
  });

  let currentStreak = 0;
  let longestStreak = 0;
  dailyStats.forEach((item) => {
    if (item.status === "complete") {
      currentStreak += 1;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  const outputStats = {
    timeline: artifacts.map((artifact: { date: string; type: string; content: string | null; url: string | null }) => ({
      date: artifact.date,
      outputType: artifact.type,
      outputContent: artifact.content ?? artifact.url ?? "",
    })),
  };

  const weeklySummaries = reviews.map(
    (review: { week_start_date: string; q1: string | null; q2: string | null; q3: string | null; q4: string | null }) => {
      const weekStart = review.week_start_date.slice(0, 10);
      const weekDates = dailyStats.filter((item) => {
        const d = new Date(item.date);
        const startDate = new Date(weekStart);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        return d >= startDate && d <= endDate;
      });
      const completedDays = weekDates.filter((item) => item.status === "complete").length;
      const completionRate = weekDates.length
        ? Math.round((completedDays / weekDates.length) * 100)
        : 0;
      return {
        weekStart,
        completionRate,
        mostProductiveDay: weekDates.find((item) => item.status === "complete")?.date ?? "",
        quote: review.q1 || review.q2 || review.q3 || review.q4 || "",
      };
    },
  );

  return json({
    dailyStats,
    streaks: { current: currentStreak, longest: longestStreak },
    outputStats,
    weeklySummaries,
  });
});

router.get("/timeline", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 29);
  const startIso = start.toISOString().slice(0, 10);
  const endIso = now.toISOString().slice(0, 10);

  const [tasksRes, artifactsRes, completionsRes] = await Promise.all([
    restRequest(
      env,
      `tasks?user_id=eq.${user.id}&date=gte.${startIso}&date=lte.${endIso}`,
      { token: request.token },
    ),
    restRequest(
      env,
      `artifacts?user_id=eq.${user.id}&date=gte.${startIso}&date=lte.${endIso}&order=date.desc`,
      { token: request.token },
    ),
    restRequest(
      env,
      `daily_completions?user_id=eq.${user.id}&date=gte.${startIso}&date=lte.${endIso}`,
      { token: request.token },
    ),
  ]);

  const tasks = await tasksRes.json();
  const artifacts = await artifactsRes.json();
  const completions = await completionsRes.json();

  return json({ tasks, artifacts, completions });
});

router.get("/review", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }
  const url = new URL(request.url);
  const weekStart = url.searchParams.get("weekStart");
  if (!weekStart) {
    return json({ error: "Missing weekStart" }, 400);
  }
  const response = await restRequest(
    env,
    `weekly_reviews?user_id=eq.${user.id}&week_start_date=eq.${weekStart}`,
    { token: request.token },
  );
  const reviews = await response.json();
  return json({ review: reviews[0] ?? null });
});

const reviewSchema = z.object({
  weekStartDate: z.string(),
  q1: z.string().min(1),
  q2: z.string().min(1),
  q3: z.string().min(1),
  q4: z.string().min(1),
  stopDoing: z.string().optional().nullable(),
  resistanceBlock: z.string().optional().nullable(),
});

router.post("/review", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid review" }, 400);
  }

  const existing = await restRequest(
    env,
    `weekly_reviews?user_id=eq.${user.id}&week_start_date=eq.${parsed.data.weekStartDate}`,
    { token: request.token },
  );
  const existingRows = await existing.json();
  if (existingRows.length > 0) {
    return json({ error: "Review already exists" }, 400);
  }

  const response = await restRequest(env, "weekly_reviews", {
    method: "POST",
    token: request.token,
    body: JSON.stringify({
      user_id: user.id,
      week_start_date: parsed.data.weekStartDate,
      q1: parsed.data.q1,
      q2: parsed.data.q2,
      q3: parsed.data.q3,
      q4: parsed.data.q4,
      stop_doing: parsed.data.stopDoing ?? null,
      resistance_block: parsed.data.resistanceBlock ?? null,
    }),
  });

  if (!response.ok) {
    return json({ error: "Review save failed" }, 500);
  }

  return json({ ok: true });
});

const pushSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

router.post("/push/subscribe", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  const parsed = pushSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid payload" }, 400);
  }

  const response = await restRequest(env, "push_subscriptions", {
    method: "POST",
    token: request.token,
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      user_id: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    }),
  });

  if (!response.ok) {
    return json({ error: "Subscription failed" }, 500);
  }

  return json({ ok: true });
});

router.post("/push/dispatch", () => {
  return json({ error: "Push dispatch not implemented in worker yet." }, 501);
});

router.get("/export/json", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }

  const [goals, plans, planDays, tasks, completions, artifacts, reviews] = await Promise.all([
    restRequest(env, `goals?user_id=eq.${user.id}`, { token: request.token }).then((res) => res.json()),
    restRequest(env, `plans?user_id=eq.${user.id}`, { token: request.token }).then((res) => res.json()),
    restRequest(env, `plan_days?user_id=eq.${user.id}`, { token: request.token }).then((res) => res.json()),
    restRequest(env, `tasks?user_id=eq.${user.id}`, { token: request.token }).then((res) => res.json()),
    restRequest(env, `daily_completions?user_id=eq.${user.id}`, { token: request.token }).then((res) =>
      res.json(),
    ),
    restRequest(env, `artifacts?user_id=eq.${user.id}`, { token: request.token }).then((res) => res.json()),
    restRequest(env, `weekly_reviews?user_id=eq.${user.id}`, { token: request.token }).then((res) =>
      res.json(),
    ),
  ]);

  return json({
    goals,
    plans,
    planDays,
    tasks,
    completions,
    artifacts,
    reviews,
  });
});

router.get("/export/markdown", async (request: AuthedRequest, env: Env) => {
  const user = await withAuth(request, env);
  if (!user || !request.token) {
    return json({ error: "Unauthorized" }, 401);
  }
  const url = new URL(request.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  if (!start || !end) {
    return json({ error: "Missing date range" }, 400);
  }

  const artifactsRes = await restRequest(
    env,
    `artifacts?user_id=eq.${user.id}&date=gte.${start}&date=lte.${end}&order=date.asc`,
    { token: request.token },
  );
  const artifacts = await artifactsRes.json();
  const lines = ["# Goal Artifacts", ""];
  artifacts.forEach((artifact: { date: string; content: string | null; url: string | null; type: string }) => {
    lines.push(`## ${artifact.date.slice(0, 10)}`);
    lines.push(`- Type: ${artifact.type}`);
    lines.push(`- Artifact: ${artifact.content ?? artifact.url ?? ""}`);
    lines.push("");
  });
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown", ...corsHeaders },
  });
});

router.all("*", () => json({ error: "Not found" }, 404));

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => router.handle(request, env, ctx),
};
