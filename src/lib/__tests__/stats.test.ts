import { calculateStreak, completionRate } from "@/lib/stats";
import { startOfDay, addDays } from "@/lib/time";

describe("stats helpers", () => {
  it("calculates streaks", () => {
    const today = startOfDay(new Date());
    const dates = [today, addDays(today, -1), addDays(today, -2)];
    expect(calculateStreak(dates)).toBe(3);
  });

  it("calculates completion rate", () => {
    const today = startOfDay(new Date());
    const dates = [today, addDays(today, -2), addDays(today, -4)];
    expect(completionRate(dates, 7)).toBe(43);
  });
});
