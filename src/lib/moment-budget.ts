import { todayKey } from "./daily";

export const DAILY_LIMIT = 7;
const BUDGET_KEY = "kairos-moment-budget";
const DAILY_PLAYED_KEY = "kairos-daily-played";

export type MomentBudget = {
  date: string;
  used: number;
  left: number;
};

export function readBudget(): MomentBudget {
  const date = todayKey();
  if (typeof window === "undefined") {
    return { date, used: 0, left: DAILY_LIMIT };
  }
  try {
    const raw = localStorage.getItem(BUDGET_KEY);
    const parsed = raw ? (JSON.parse(raw) as { date: string; used: number }) : null;
    if (!parsed || parsed.date !== date) return { date, used: 0, left: DAILY_LIMIT };
    const used = Math.max(0, Number(parsed.used) || 0);
    return { date, used, left: Math.max(0, DAILY_LIMIT - used) };
  } catch {
    return { date, used: 0, left: DAILY_LIMIT };
  }
}

export function consumeMoment(): MomentBudget {
  const cur = readBudget();
  if (cur.left <= 0) return cur;
  const next: MomentBudget = { date: cur.date, used: cur.used + 1, left: cur.left - 1 };
  localStorage.setItem(BUDGET_KEY, JSON.stringify({ date: next.date, used: next.used }));
  return next;
}

export function hasPlayedDaily(dateKey: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DAILY_PLAYED_KEY) === dateKey;
}

export function markDailyPlayed(dateKey: string) {
  localStorage.setItem(DAILY_PLAYED_KEY, dateKey);
}
