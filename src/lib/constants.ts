export const ROLES = ["USER", "L1", "L2", "L3", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const LEVELS = ["L1", "L2", "L3"] as const;
export type Level = (typeof LEVELS)[number];

export const STATUSES = ["OPEN", "WIP", "HOLD", "CLOSED", "REJECTED"] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const CATEGORIES = [
  "HARDWARE",
  "SOFTWARE",
  "NETWORK",
  "ACCESS",
  "HR",
  "FACILITIES",
  "OTHER",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  HARDWARE: "Hardware",
  SOFTWARE: "Software",
  NETWORK: "Network",
  ACCESS: "Access & Accounts",
  HR: "HR & Payroll",
  FACILITIES: "Facilities",
  OTHER: "Other",
};

export const STATUS_META: Record<
  Status,
  { label: string; description: string; tone: string; dot: string }
> = {
  OPEN: {
    label: "Open",
    description: "Waiting for a support engineer to pick it up",
    tone: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
  },
  WIP: {
    label: "In progress",
    description: "Actively being worked on",
    tone: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    dot: "bg-indigo-500",
  },
  HOLD: {
    label: "On hold",
    description: "Blocked, waiting on the requester or a dependency",
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  CLOSED: {
    label: "Closed",
    description: "Resolved and confirmed",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rejected",
    description: "Closed without action, with a reason recorded",
    tone: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
  },
};

export const PRIORITY_META: Record<
  Priority,
  { label: string; tone: string; ring: string; bar: string; slaHours: number }
> = {
  LOW: { label: "Low", tone: "text-slate-600 bg-slate-50", ring: "ring-slate-200", bar: "bg-slate-400", slaHours: 120 },
  MEDIUM: { label: "Medium", tone: "text-sky-700 bg-sky-50", ring: "ring-sky-200", bar: "bg-sky-500", slaHours: 72 },
  HIGH: { label: "High", tone: "text-amber-700 bg-amber-50", ring: "ring-amber-200", bar: "bg-amber-500", slaHours: 24 },
  CRITICAL: { label: "Critical", tone: "text-rose-700 bg-rose-50", ring: "ring-rose-200", bar: "bg-rose-500", slaHours: 4 },
};

export const LEVEL_META: Record<Level, { label: string; description: string; tone: string }> = {
  L1: { label: "L1 · Service desk", description: "First line — triage and common fixes", tone: "bg-sky-50 text-sky-700 ring-sky-200" },
  L2: { label: "L2 · Engineering", description: "Second line — deeper diagnosis", tone: "bg-violet-50 text-violet-700 ring-violet-200" },
  L3: { label: "L3 · Specialist", description: "Third line — platform and vendor escalations", tone: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200" },
};

export const ROLE_META: Record<Role, { label: string; blurb: string; tone: string }> = {
  USER: { label: "Requester", blurb: "Raises complaints and tracks progress", tone: "bg-slate-100 text-slate-700 ring-slate-200" },
  L1: { label: "L1 agent", blurb: "First-line triage and resolution", tone: "bg-sky-50 text-sky-700 ring-sky-200" },
  L2: { label: "L2 agent", blurb: "Second-line engineering", tone: "bg-violet-50 text-violet-700 ring-violet-200" },
  L3: { label: "L3 agent", blurb: "Third-line specialist", tone: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200" },
  ADMIN: { label: "Administrator", blurb: "Full control, policy and user management", tone: "bg-amber-50 text-amber-700 ring-amber-200" },
};

/** Statuses that still consume an agent's attention. */
export const ACTIVE_STATUSES: Status[] = ["OPEN", "WIP", "HOLD"];

/** Legal status transitions for staff-driven changes. */
export const TRANSITIONS: Record<Status, Status[]> = {
  OPEN: ["WIP", "HOLD", "REJECTED"],
  WIP: ["HOLD", "CLOSED", "REJECTED"],
  HOLD: ["WIP", "CLOSED", "REJECTED"],
  CLOSED: [],
  REJECTED: [],
};

export const SETTING_KEYS = {
  sla: {
    LOW: "sla_low_hours",
    MEDIUM: "sla_medium_hours",
    HIGH: "sla_high_hours",
    CRITICAL: "sla_critical_hours",
  },
  escalationL1: "escalation_l1_hours",
  escalationL2: "escalation_l2_hours",
} as const;

export const DEFAULT_SETTINGS: Record<string, string> = {
  [SETTING_KEYS.sla.LOW]: "120",
  [SETTING_KEYS.sla.MEDIUM]: "72",
  [SETTING_KEYS.sla.HIGH]: "24",
  [SETTING_KEYS.sla.CRITICAL]: "4",
  [SETTING_KEYS.escalationL1]: "24",
  [SETTING_KEYS.escalationL2]: "48",
};

export const PAGE_SIZE = 8;
