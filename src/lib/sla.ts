import type { Priority } from "./constants";
import { PRIORITY_META } from "./constants";

const HOUR = 60 * 60 * 1000;

export type SlaPolicy = Record<Priority, number>;

export const DEFAULT_SLA_POLICY: SlaPolicy = {
  LOW: PRIORITY_META.LOW.slaHours,
  MEDIUM: PRIORITY_META.MEDIUM.slaHours,
  HIGH: PRIORITY_META.HIGH.slaHours,
  CRITICAL: PRIORITY_META.CRITICAL.slaHours,
};

export function hoursFromNow(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * HOUR);
}

export function dueAt(createdAt: Date, priority: Priority, policy: SlaPolicy = DEFAULT_SLA_POLICY): Date {
  return hoursFromNow(createdAt, policy[priority] ?? policy.MEDIUM);
}

export function minutesBetween(from: Date, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 60000));
}

/** Hours of the SLA window that have already elapsed. */
export function slaElapsedHours(createdAt: Date, now: Date = new Date()): number {
  return Math.max(0, (now.getTime() - createdAt.getTime()) / HOUR);
}

/** Percentage of the SLA window consumed, clamped to 0..100. */
export function slaConsumed(createdAt: Date, due: Date, now: Date = new Date()): number {
  const total = due.getTime() - createdAt.getTime();
  if (total <= 0) return 100;
  const used = now.getTime() - createdAt.getTime();
  return Math.min(100, Math.max(0, Math.round((used / total) * 100)));
}

export function isOverdue(due: Date, status: string, now: Date = new Date()): boolean {
  if (status === "CLOSED" || status === "REJECTED") return false;
  return now.getTime() > due.getTime();
}

/** Human duration from minutes, e.g. "2d 4h", "3h 12m", "48m". */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return "—";
  const total = Math.max(0, Math.round(minutes));
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const mins = total % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
