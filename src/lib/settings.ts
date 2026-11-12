import type { Priority } from "./constants";
import { DEFAULT_SETTINGS, SETTING_KEYS } from "./constants";
import type { EscalationPolicy } from "./escalation";
import { DEFAULT_ESCALATION_POLICY } from "./escalation";
import { prisma } from "./db";
import type { SlaPolicy } from "./sla";
import { DEFAULT_SLA_POLICY } from "./sla";

export type AppSettings = {
  sla: SlaPolicy;
  escalation: EscalationPolicy;
  raw: Record<string, string>;
};

function toNumber(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Reads the policy rows, falling back to the compiled-in defaults. */
export async function getSettings(): Promise<AppSettings> {
  let rows: { key: string; value: string }[] = [];
  try {
    rows = await prisma.setting.findMany({ select: { key: true, value: true } });
  } catch {
    rows = [];
  }
  const raw = { ...DEFAULT_SETTINGS };
  for (const row of rows) raw[row.key] = row.value;

  const sla: SlaPolicy = {
    LOW: toNumber(raw[SETTING_KEYS.sla.LOW], DEFAULT_SLA_POLICY.LOW),
    MEDIUM: toNumber(raw[SETTING_KEYS.sla.MEDIUM], DEFAULT_SLA_POLICY.MEDIUM),
    HIGH: toNumber(raw[SETTING_KEYS.sla.HIGH], DEFAULT_SLA_POLICY.HIGH),
    CRITICAL: toNumber(raw[SETTING_KEYS.sla.CRITICAL], DEFAULT_SLA_POLICY.CRITICAL),
  };

  const escalation: EscalationPolicy = {
    l1Hours: toNumber(raw[SETTING_KEYS.escalationL1], DEFAULT_ESCALATION_POLICY.l1Hours),
    l2Hours: toNumber(raw[SETTING_KEYS.escalationL2], DEFAULT_ESCALATION_POLICY.l2Hours),
  };

  return { sla, escalation, raw };
}

export async function saveSettings(updates: Record<string, string>): Promise<void> {
  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      }),
    ),
  );
}

export function slaHoursFor(priority: Priority, settings: AppSettings): number {
  return settings.sla[priority];
}
