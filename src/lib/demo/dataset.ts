/**
 * Deterministic, database-free demo dataset.
 *
 * The public `/demo` route renders this snapshot so the deployed site is explorable
 * even before a Postgres instance is attached. It mirrors the shape and tone of the
 * seeded dataset without touching Prisma.
 */

export type DemoRole = "USER" | "L1" | "L2" | "L3" | "ADMIN";
export type DemoStatus = "OPEN" | "WIP" | "HOLD" | "CLOSED" | "REJECTED";
export type DemoLevel = "L1" | "L2" | "L3";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: DemoRole;
  department: string;
};

export type DemoPerson = { id: string; name: string; role: string };

export type DemoRemark = {
  id: string;
  author: DemoPerson;
  body: string;
  internal: boolean;
  createdAt: Date;
};

export type DemoEvent = {
  id: string;
  type: "CREATED" | "STATUS" | "ASSIGN" | "ESCALATION" | "FEEDBACK";
  actor: DemoPerson | null;
  from: string | null;
  to: string | null;
  note: string;
  automated: boolean;
  createdAt: Date;
};

export type DemoAttachment = { id: string; filename: string; size: number; mimeType: string };

export type DemoComplaint = {
  id: string;
  reference: string;
  title: string;
  description: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: DemoStatus;
  level: DemoLevel;
  raisedBy: DemoPerson;
  assignee: DemoPerson | null;
  createdAt: Date;
  dueAt: Date;
  closedAt: Date | null;
  resolvedInMin: number | null;
  escalatedAt: Date | null;
  escalationCount: number;
  slaBreached: boolean;
  rating: number | null;
  feedback: string | null;
  remarks: DemoRemark[];
  events: DemoEvent[];
  attachments: DemoAttachment[];
};

const HOUR = 3_600_000;

export const DEMO_USERS: DemoUser[] = [
  { id: "u-admin", name: "Aarav Mehta", email: "admin@demo.test", role: "ADMIN", department: "IT Service Management" },
  { id: "u-l1a", name: "Priya Nair", email: "l1@demo.test", role: "L1", department: "Service Desk" },
  { id: "u-l1b", name: "Rahul Verma", email: "l1b@demo.test", role: "L1", department: "Service Desk" },
  { id: "u-l2a", name: "Sneha Iyer", email: "l2@demo.test", role: "L2", department: "End-User Computing" },
  { id: "u-l2b", name: "Vikram Rao", email: "l2b@demo.test", role: "L2", department: "Network Operations" },
  { id: "u-l3", name: "Ananya Bose", email: "l3@demo.test", role: "L3", department: "Platform Engineering" },
  { id: "u-user", name: "Isha Kapoor", email: "user@demo.test", role: "USER", department: "Finance" },
  { id: "u-user2", name: "Karan Malhotra", email: "user2@demo.test", role: "USER", department: "Manufacturing" },
  { id: "u-user3", name: "Neha Gupta", email: "user3@demo.test", role: "USER", department: "Human Resources" },
];

type Spec = [title: string, category: string, priority: DemoComplaint["priority"]];

const SPECS: Spec[] = [
  ["Laptop will not boot after the October Windows update", "HARDWARE", "CRITICAL"],
  ["VPN disconnects every few minutes from the home network", "NETWORK", "HIGH"],
  ["SAP access revoked without a request", "ACCESS", "HIGH"],
  ["External monitor flickers at 144 Hz", "HARDWARE", "MEDIUM"],
  ["October payroll deduction does not match the payslip", "HR", "CRITICAL"],
  ["Projector in meeting room 3B shows no signal", "FACILITIES", "MEDIUM"],
  ["Mailbox quota exceeded — cannot receive mail", "SOFTWARE", "HIGH"],
  ["Print spooler crashes for the whole third floor", "HARDWARE", "HIGH"],
  ["Docker Desktop fails to start after the WSL update", "SOFTWARE", "MEDIUM"],
  ["Lost MFA device — locked out of every system", "ACCESS", "CRITICAL"],
  ["Very slow internet in the east wing", "NETWORK", "HIGH"],
  ["New joiner laptop not provisioned on day one", "HARDWARE", "HIGH"],
  ["Expense portal returns a 500 error on submit", "SOFTWARE", "HIGH"],
  ["Jira board never finishes loading", "SOFTWARE", "MEDIUM"],
  ["Excel add-in missing after the Office upgrade", "SOFTWARE", "MEDIUM"],
  ["Badge access to the test lab denied", "ACCESS", "MEDIUM"],
  ["Teams calls have crackling audio", "SOFTWARE", "LOW"],
  ["System drive is full on the development VM", "HARDWARE", "MEDIUM"],
  ["Password reset sends me in a loop", "ACCESS", "HIGH"],
  ["Tableau licence expired for the analytics team", "SOFTWARE", "MEDIUM"],
  ["Badge photo printing fails at the security desk", "FACILITIES", "LOW"],
  ["Weekly sales export times out", "SOFTWARE", "HIGH"],
  ["Laptop battery is swelling and the trackpad lifts", "HARDWARE", "CRITICAL"],
  ["Guest Wi-Fi captive portal rejects vendor codes", "NETWORK", "MEDIUM"],
  ["Leave balance in the HR portal is wrong", "HR", "MEDIUM"],
  ["Slack notifications arrive ten minutes late", "SOFTWARE", "LOW"],
  ["Shared backup drive is not mounted after reboot", "NETWORK", "HIGH"],
  ["Second monitor is not detected through the dock", "HARDWARE", "LOW"],
  ["Build server rejects our code-signing certificate", "SOFTWARE", "HIGH"],
  ["Chrome signs out of every internal app each morning", "ACCESS", "MEDIUM"],
];

const DESCRIPTIONS = [
  "It started two days ago and reproduces every time. I have tried restarting, clearing caches and using a second machine, and the behaviour is identical.",
  "This is blocking my work today. The workaround is manual and slow, and at least three other people on the floor are affected by the same thing.",
  "The screenshots attached were taken this morning. Nothing changed on my side before it broke, so it looks like something on the shared side.",
  "One of the vendor engineers could reproduce it as well. They asked for logs from our environment, which I have attached.",
  "It is intermittent — roughly every second attempt — which makes it hard to pin down. Happy to jump on a call to demonstrate it.",
];

const RESOLUTIONS = [
  "Root cause confirmed and fixed. Verified with the requester before closing.",
  "Applied the vendor patch, cleared the stale cache and re-tested end to end.",
  "Configuration corrected on the management console; monitoring for 24h showed no recurrence.",
  "Hardware swapped under warranty and the user confirmed everything works.",
  "Access re-provisioned with the correct role and approved by the line manager.",
];

const REMARKS = [
  "Thanks for reporting this. I have picked it up and will update you within the hour.",
  "Could you confirm the asset tag of the machine so I can check the warranty?",
  "I reproduced this on a test account — escalating to the next level for a deeper fix.",
  "The vendor has been engaged and a patch is scheduled for tonight's maintenance window.",
  "This is resolved from our side. Please confirm and I will close the complaint.",
  "A replacement unit is ready at the service desk whenever you can collect it.",
];

const REQUESTER_REMARKS = [
  "Any update on this? It is still blocking my work today.",
  "Happy to jump on a call and demonstrate it whenever suits.",
  "Attached the log from this morning — same error at 09:14.",
  "Thanks, that fixed it. Closing this off from my side.",
  "This is affecting two other people on my floor as well.",
];

const INTERNAL_NOTES = [
  "Internal: the root cause is the stale group membership in the identity provider.",
  "Internal: raised a change request CH-4471 for the firewall rule change.",
  "Internal: known bad driver version 4.2 — roll back before anything else.",
];

function createRandom(seed: number) {
  let state = seed;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function slaHoursFor(priority: DemoComplaint["priority"]): number {
  return { CRITICAL: 4, HIGH: 24, MEDIUM: 72, LOW: 120 }[priority];
}

export function buildDemoDataset(now: Date = new Date()): DemoComplaint[] {
  const random = createRandom(0x2f6e2b1);
  const pick = <T,>(items: T[]): T => items[Math.floor(random() * items.length)];
  const between = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min;

  const people: Record<string, DemoPerson> = {};
  for (const user of DEMO_USERS) people[user.id] = { id: user.id, name: user.name, role: user.role };

  const l1 = [people["u-l1a"], people["u-l1b"]];
  const l2 = [people["u-l2a"], people["u-l2b"]];
  const l3 = [people["u-l3"]];
  const requesters = [people["u-user"], people["u-user2"], people["u-user3"]];
  const year = now.getFullYear();

  return SPECS.map(([title, category, priority], index) => {
    const reference = `CMS-${year}-${String(index + 1).padStart(4, "0")}`;
    const roll = random();

    let status: DemoStatus;
    let level: DemoLevel;
    if (roll < 0.2) {
      status = "OPEN";
      level = "L1";
    } else if (roll < 0.45) {
      status = "WIP";
      level = random() < 0.55 ? "L1" : "L2";
    } else if (roll < 0.55) {
      status = "HOLD";
      level = random() < 0.5 ? "L2" : "L1";
    } else if (roll < 0.9) {
      status = "CLOSED";
      level = random() < 0.6 ? "L1" : random() < 0.8 ? "L2" : "L3";
    } else {
      status = "REJECTED";
      level = "L1";
    }

    const assignee = pick(level === "L1" ? l1 : level === "L2" ? l2 : l3);
    const raisedBy = pick(requesters);
    const slaHours = slaHoursFor(priority);
    const isActive = status === "OPEN" || status === "WIP" || status === "HOLD";
    const levelCap = level === "L2" ? 40 : 20;

    const ageHours = !isActive
      ? between(8, 34 * 24)
      : index % 13 === 0
        ? slaHours + between(3, 18)
        : between(1, Math.max(3, Math.min(Math.floor(slaHours * 0.55), levelCap)));

    const createdAt = new Date(now.getTime() - ageHours * HOUR);
    const dueAt = new Date(createdAt.getTime() + slaHours * HOUR);
    const closedAt = !isActive ? new Date(createdAt.getTime() + between(2, 60) * HOUR) : null;
    const resolvedInMin =
      status === "CLOSED" && closedAt ? Math.max(30, Math.round((closedAt.getTime() - createdAt.getTime()) / 60_000)) : null;
    const slaBreached = closedAt ? closedAt > dueAt : now > dueAt;
    const levelChangedAt = isActive
      ? new Date(now.getTime() - Math.min(ageHours, levelCap * 0.8) * HOUR)
      : new Date(createdAt.getTime() + between(1, 20) * HOUR);

    const events: DemoEvent[] = [
      {
        id: `${reference}-e1`,
        type: "CREATED",
        actor: raisedBy,
        from: null,
        to: "OPEN",
        note: `Raised as ${category} with ${priority.toLowerCase()} priority and a ${slaHours}h SLA.`,
        automated: false,
        createdAt,
      },
      {
        id: `${reference}-e2`,
        type: "ASSIGN",
        actor: null,
        from: null,
        to: assignee.name,
        note: "Auto-assigned to the least-loaded L1 agent.",
        automated: true,
        createdAt: new Date(createdAt.getTime() + 2 * 60 * 1000),
      },
    ];

    if (level !== "L1") {
      events.push({
        id: `${reference}-e3`,
        type: "ESCALATION",
        actor: null,
        from: "L1",
        to: level,
        note: `Escalated from L1 to ${level} automatically by the SLA watchdog.`,
        automated: true,
        createdAt: levelChangedAt,
      });
    }

    if (closedAt) {
      events.push({
        id: `${reference}-e4`,
        type: "STATUS",
        actor: assignee,
        from: "WIP",
        to: status,
        note: status === "CLOSED" ? pick(RESOLUTIONS) : "Duplicate of an existing complaint; closed with a reference.",
        automated: false,
        createdAt: closedAt,
      });
    } else if (status !== "OPEN") {
      events.push({
        id: `${reference}-e5`,
        type: "STATUS",
        actor: assignee,
        from: "OPEN",
        to: status,
        note: status === "HOLD" ? "Waiting on the requester for more detail." : "Investigation started.",
        automated: false,
        createdAt: new Date(createdAt.getTime() + between(1, 6) * HOUR),
      });
    }

    const remarks: DemoRemark[] = [];
    const remarkCount = between(0, 3);
    for (let r = 0; r < remarkCount; r += 1) {
      const fromStaff = random() < 0.6;
      const internal = fromStaff && random() < 0.3;
      remarks.push({
        id: `${reference}-r${r}`,
        author: fromStaff ? assignee : raisedBy,
        body: internal ? pick(INTERNAL_NOTES) : fromStaff ? pick(REMARKS) : pick(REQUESTER_REMARKS),
        internal,
        createdAt: new Date(createdAt.getTime() + between(1, 26) * HOUR),
      });
    }

    const attachments: DemoAttachment[] =
      index % 5 === 0
        ? [
            {
              id: `${reference}-a1`,
              filename: `${reference.toLowerCase()}-evidence.txt`,
              size: between(1200, 48_000),
              mimeType: "text/plain",
            },
          ]
        : [];

    return {
      id: reference.toLowerCase(),
      reference,
      title,
      description: `${DESCRIPTIONS[index % DESCRIPTIONS.length]}`,
      category,
      priority,
      status,
      level,
      raisedBy,
      assignee,
      createdAt,
      dueAt,
      closedAt,
      resolvedInMin,
      escalatedAt: level === "L1" ? null : levelChangedAt,
      escalationCount: level === "L1" ? 0 : level === "L2" ? 1 : 2,
      slaBreached,
      rating: status === "CLOSED" ? (slaBreached ? between(2, 4) : between(4, 5)) : null,
      feedback: status === "CLOSED" && random() < 0.4 ? "Quick turnaround once it reached L2, thank you." : null,
      remarks: remarks.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      events: events.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      attachments,
    };
  });
}

export type DemoMetrics = {
  total: number;
  byStatus: Record<DemoStatus, number>;
  byCategory: { name: string; value: number }[];
  byPriority: Record<DemoComplaint["priority"], number>;
  active: number;
  breached: number;
  closed: number;
  avgResolutionMinutes: number;
  slaCompliance: number;
  avgRating: number;
  ratingCount: number;
  trend: { day: string; raised: number; closed: number }[];
  workload: { name: string; role: string; open: number; resolved: number }[];
  resolutionByPriority: { name: string; hours: number }[];
};

export function computeDemoMetrics(complaints: DemoComplaint[], days = 14, now: Date = new Date()): DemoMetrics {
  const byStatus: Record<DemoStatus, number> = { OPEN: 0, WIP: 0, HOLD: 0, CLOSED: 0, REJECTED: 0 };
  const byPriority: Record<DemoComplaint["priority"], number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  const categoryCounts = new Map<string, number>();

  for (const complaint of complaints) {
    byStatus[complaint.status] += 1;
    byPriority[complaint.priority] += 1;
    categoryCounts.set(complaint.category, (categoryCounts.get(complaint.category) ?? 0) + 1);
  }

  const active = byStatus.OPEN + byStatus.WIP + byStatus.HOLD;
  const closedOnes = complaints.filter((c) => c.status === "CLOSED");
  const breached = complaints.filter((c) => c.slaBreached && c.status !== "CLOSED" && c.status !== "REJECTED").length;
  const withinSla = closedOnes.filter((c) => c.closedAt && c.closedAt <= c.dueAt).length;
  const avgResolutionMinutes = closedOnes.length
    ? Math.round(closedOnes.reduce((sum, c) => sum + (c.resolvedInMin ?? 0), 0) / closedOnes.length)
    : 0;

  const rated = closedOnes.filter((c) => c.rating != null);
  const avgRating = rated.length ? rated.reduce((sum, c) => sum + (c.rating ?? 0), 0) / rated.length : 0;

  const start = new Date(now.getTime() - (days - 1) * 24 * HOUR);
  start.setHours(0, 0, 0, 0);
  const trend: { day: string; raised: number; closed: number }[] = [];
  for (let index = 0; index < days; index += 1) {
    const day = new Date(start.getTime() + index * 24 * HOUR);
    const key = day.toISOString().slice(0, 10);
    trend.push({
      day: day.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      raised: complaints.filter((c) => c.createdAt.toISOString().slice(0, 10) === key).length,
      closed: complaints.filter((c) => c.closedAt?.toISOString().slice(0, 10) === key).length,
    });
  }

  const workload = DEMO_USERS.filter((u) => u.role === "L1" || u.role === "L2" || u.role === "L3").map((user) => ({
    name: user.name,
    role: user.role,
    open: complaints.filter((c) => c.assignee?.id === user.id && ["OPEN", "WIP", "HOLD"].includes(c.status)).length,
    resolved: complaints.filter((c) => c.assignee?.id === user.id && c.status === "CLOSED").length,
  }));

  const resolutionByPriority = (["LOW", "MEDIUM", "HIGH", "CRITICAL"] as DemoComplaint["priority"][])
    .map((priority) => {
      const rows = closedOnes.filter((c) => c.priority === priority && c.resolvedInMin != null);
      const hours = rows.length ? rows.reduce((sum, c) => sum + (c.resolvedInMin ?? 0), 0) / rows.length / 60 : 0;
      return { name: priority.charAt(0) + priority.slice(1).toLowerCase(), hours: Math.round(hours * 10) / 10 };
    })
    .filter((row) => row.hours > 0);

  return {
    total: complaints.length,
    byStatus,
    byCategory: [...categoryCounts.entries()]
      .map(([name, value]) => ({ name: name.charAt(0) + name.slice(1).toLowerCase(), value }))
      .sort((a, b) => b.value - a.value),
    byPriority,
    active,
    breached,
    closed: byStatus.CLOSED,
    avgResolutionMinutes,
    slaCompliance: closedOnes.length ? Math.round((withinSla / closedOnes.length) * 100) : 100,
    avgRating,
    ratingCount: rated.length,
    trend,
    workload,
    resolutionByPriority,
  };
}
