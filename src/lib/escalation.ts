import type { Level } from "./constants";

export type EscalationPolicy = {
  /** Hours an L1 complaint may stay untouched before it moves to L2. */
  l1Hours: number;
  /** Hours an L2 complaint may stay untouched before it moves to L3. */
  l2Hours: number;
};

export const DEFAULT_ESCALATION_POLICY: EscalationPolicy = { l1Hours: 24, l2Hours: 48 };

const NEXT_LEVEL: Record<Level, Level | null> = { L1: "L2", L2: "L3", L3: null };

export function nextLevel(level: string): Level | null {
  return NEXT_LEVEL[level as Level] ?? null;
}

export type EscalationInput = {
  status: string;
  level: string;
  /** When the complaint entered its current level (or was last touched by staff). */
  levelChangedAt: Date;
  now: Date;
  policy: EscalationPolicy;
};

/** Hours a complaint has sat at its current level. */
export function hoursAtLevel(input: Omit<EscalationInput, "policy">): number {
  return Math.max(0, (input.now.getTime() - input.levelChangedAt.getTime()) / 3_600_000);
}

/**
 * Pure escalation decision, shared by the cron job and the unit tests.
 * Complaints in a terminal state never escalate; L3 is the top of the ladder.
 */
export function shouldEscalate(input: EscalationInput): boolean {
  const { status, level, policy } = input;
  if (status === "CLOSED" || status === "REJECTED") return false;
  if (!nextLevel(level)) return false;
  const threshold = level === "L1" ? policy.l1Hours : policy.l2Hours;
  return hoursAtLevel(input) >= threshold;
}

export function escalationNote(from: Level, to: Level, hours: number): string {
  return `Automatically escalated from ${from} to ${to} after ${Math.round(hours)}h without resolution.`;
}
