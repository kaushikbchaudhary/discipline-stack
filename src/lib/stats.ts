import { startOfDay, addDays } from "@/lib/time";

export const calculateStreak = (completedDates: Date[]) => {
  const completedSet = new Set(completedDates.map((date) => startOfDay(date).getTime()));
  let streak = 0;
  let cursor = startOfDay(new Date());

  while (completedSet.has(cursor.getTime())) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
};

export const completionRate = (completedDates: Date[], days = 7) => {
  const completedSet = new Set(completedDates.map((date) => startOfDay(date).getTime()));
  let completed = 0;
  const today = startOfDay(new Date());

  for (let i = 0; i < days; i += 1) {
    const date = addDays(today, -i);
    if (completedSet.has(date.getTime())) {
      completed += 1;
    }
  }

  return Math.round((completed / days) * 100);
};
