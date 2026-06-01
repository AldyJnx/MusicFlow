export const STATS_QUEUE = "stats";

export const STATS_JOBS = {
  AGGREGATE_DAILY: "aggregate-daily",
  AGGREGATE_WEEKLY: "aggregate-weekly",
  AGGREGATE_MONTHLY: "aggregate-monthly",
} as const;

export type StatsJobName = (typeof STATS_JOBS)[keyof typeof STATS_JOBS];
