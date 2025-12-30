export type TimeBlock = {
  startTime: number;
  endTime: number;
};

export const minutesToTimeString = (value: number) => {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const timeStringToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }
  return hours * 60 + minutes;
};

export const isOverlapping = (candidate: TimeBlock, existing: TimeBlock) => {
  return candidate.startTime < existing.endTime && candidate.endTime > existing.startTime;
};

export const startOfDay = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
};

export const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const isPastDay = (date: Date) => {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  return target.getTime() < today.getTime();
};

export const getWeekStart = (date: Date) => {
  const start = startOfDay(date);
  const day = start.getDay();
  const diff = start.getDate() - day;
  return startOfDay(new Date(start.setDate(diff)));
};
