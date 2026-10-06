import { brasiliaDay, moveDay } from "./appointments";

export function assistantMonthPeriod(now: Date, requested?: string) {
  const today = brasiliaDay(now), current = today.slice(0, 7);
  const month = requested ?? current;
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month) || month > current) return null;
  const start = month + "-01";
  const next = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 1)).toISOString().slice(0, 10);
  const end = month === current ? today : moveDay(next, -1);
  return { month, start, end, until: moveDay(end, 1) };
}
