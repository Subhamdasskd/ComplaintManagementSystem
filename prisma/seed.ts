/**
 * Seeds the Complaint Management System with a realistic demo dataset.
 *
 *   npm run db:seed
 *
 * Idempotent: every table is cleared first. Demo accounts all share the password
 * in SEED_DEMO_PASSWORD (default Demo@12345).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || "Demo@12345";
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

// Deterministic PRNG so every seed produces the same screenshots.
let seedState = 0x2f6e2b1;
function random() {
  seedState |= 0;
  seedState = (seedState + 0x6d2b79f5) | 0;
  let t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function pick<T>(items: T[]): T {
  return items[Math.floor(random() * items.length)];
}
function between(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

const users = [
  { email: "admin@demo.test", name: "Aarav Mehta", role: "ADMIN", department: "IT Service Management" },
  { email: "l1@demo.test", name: "Priya Nair", role: "L1", department: "Service Desk" },
  { email: "l1b@demo.test", name: "Rahul Verma", role: "L1", department: "Service Desk" },
  { email: "l2@demo.test", name: "Sneha Iyer", role: "L2", department: "End-User Computing" },
  { email: "l2b@demo.test", name: "Vikram Rao", role: "L2", department: "Network Operations" },
  { email: "l3@demo.test", name: "Ananya Bose", role: "L3", department: "Platform Engineering" },
  { email: "user@demo.test", name: "Isha Kapoor", role: "USER", department: "Finance" },
  { email: "user2@demo.test", name: "Karan Malhotra", role: "USER", department: "Manufacturing" },
  { email: "user3@demo.test", name: "Neha Gupta", role: "USER", department: "Human Resources" },
];

type Spec = { title: string; description: string; category: string; priority: string };

const specs: Spec[] = [
  {
    title: "Laptop will not boot after the October Windows update",
    description:
      "After installing the October cumulative update my ThinkPad restarts into a black screen with a blinking cursor. Safe mode also fails. I have a client review tomorrow morning and the deck is on this machine.",
    category: "HARDWARE",
    priority: "CRITICAL",
  },
  {
    title: "VPN disconnects every few minutes from home network",
    description:
      "The corporate VPN drops roughly every 8 to 12 minutes on my home fibre connection. Reconnecting works but wipes the session, so long uploads fail. Office Wi-Fi is fine, so it looks like the client or the gateway.",
    category: "NETWORK",
    priority: "HIGH",
  },
  {
    title: "SAP access revoked without a request",
    description:
      "My SAP FICO role disappeared overnight. I can log in but every transaction returns authorisation error 403. My manager confirms no access change was raised for me.",
    category: "ACCESS",
    priority: "HIGH",
  },
  {
    title: "External monitor flickers at 144 Hz",
    description:
      "The Dell monitor flickers badly when set to 144 Hz over DisplayPort. Dropping to 60 Hz fixes it, but that is unusable for the UI work I do. Cable and monitor were replaced last month.",
    category: "HARDWARE",
    priority: "MEDIUM",
  },
  {
    title: "October payroll deduction does not match the payslip",
    description:
      "The net pay credited is about 4,800 short of the payslip total. The payslip shows the correct provident fund but the bank credit does not. I need this reconciled before the salary cutoff.",
    category: "HR",
    priority: "CRITICAL",
  },
  {
    title: "Projector in meeting room 3B shows no signal",
    description:
      "The projector in 3B detects the source but shows a blue no-signal screen. HDMI and USB-C both fail. Two client demos are scheduled there this week.",
    category: "FACILITIES",
    priority: "MEDIUM",
  },
  {
    title: "Mailbox quota exceeded — cannot receive mail",
    description:
      "Outlook says the mailbox is full and bounced five vendor mails this morning. I archived 6 GB already but the quota has not updated.",
    category: "SOFTWARE",
    priority: "HIGH",
  },
  {
    title: "Print spooler crashes for the whole third floor",
    description:
      "Printing to any third-floor queue fails with a spooler error. Restarting the service helps for ten minutes, then it crashes again. About forty people are affected.",
    category: "HARDWARE",
    priority: "HIGH",
  },
  {
    title: "Docker Desktop fails to start after the WSL update",
    description:
      "Docker Desktop hangs on 'starting the Docker Engine' since the WSL kernel update. wsl --update is already applied and virtualization is enabled in BIOS.",
    category: "SOFTWARE",
    priority: "MEDIUM",
  },
  {
    title: "Lost MFA device — locked out of every system",
    description:
      "My phone was stolen. I cannot complete MFA for email, VPN or the admin console. I have my manager available for identity verification and my employee ID.",
    category: "ACCESS",
    priority: "CRITICAL",
  },
  {
    title: "Very slow internet in the east wing",
    description:
      "Speed tests in the east wing return under 3 Mbps while the rest of the building is normal. Video calls drop constantly. It started after the weekend switch maintenance.",
    category: "NETWORK",
    priority: "HIGH",
  },
  {
    title: "New joiner laptop not provisioned on day one",
    description:
      "The new analyst joining Monday has no laptop, no account and no badge yet. The request was raised two weeks ago with the requisition number attached.",
    category: "HARDWARE",
    priority: "HIGH",
  },
  {
    title: "Expense portal returns a 500 error on submit",
    description:
      "Submitting any expense claim returns a server error after the confirmation screen. Drafts save fine, so the data loss is only on submit. Five claims are stuck.",
    category: "SOFTWARE",
    priority: "HIGH",
  },
  {
    title: "Jira board never finishes loading",
    description:
      "The sprint board spins forever for my team. Other boards load. Browser cache, incognito and a second machine all reproduce it.",
    category: "SOFTWARE",
    priority: "MEDIUM",
  },
  {
    title: "Excel add-in missing after the Office upgrade",
    description:
      "Our planning workbook depends on the internal Excel add-in. It disappeared from the ribbon after the Office 365 upgrade and re-adding it from the catalogue fails silently.",
    category: "SOFTWARE",
    priority: "MEDIUM",
  },
  {
    title: "Badge access to the test lab denied",
    description:
      "My badge stopped opening the second-floor test lab on Monday. It still works for the main entrance and the parking gate. A colleague with the same role can get in.",
    category: "ACCESS",
    priority: "MEDIUM",
  },
  {
    title: "Teams calls have crackling audio",
    description:
      "Audio on Teams calls breaks up and crackles for anyone on a headset, including the certified Jabra units. Recording from the same machine is clean, so the microphone is fine.",
    category: "SOFTWARE",
    priority: "LOW",
  },
  {
    title: "System drive is full on the development VM",
    description:
      "The dev VM is at 98 percent on C:. Builds fail with no space left on device. I cleared temporary files but the Docker images are eating most of it.",
    category: "HARDWARE",
    priority: "MEDIUM",
  },
  {
    title: "Password reset sends me in a loop",
    description:
      "The self-service reset accepts the new password, then rejects it at sign-in and forces another reset. Account is not locked yet but I have tried four times.",
    category: "ACCESS",
    priority: "HIGH",
  },
  {
    title: "Tableau licence expired for the analytics team",
    description:
      "Six analysts see the licence error and cannot publish workbooks. The renewal purchase order was approved last week.",
    category: "SOFTWARE",
    priority: "MEDIUM",
  },
  {
    title: "Badge photo printing fails at the security desk",
    description:
      "The badge printer at reception jams on every second card. Contractors are waiting up to an hour for a temporary badge.",
    category: "FACILITIES",
    priority: "LOW",
  },
  {
    title: "Weekly sales export times out",
    description:
      "The scheduled export to the finance share has timed out three weeks running. The query runs for 40 minutes and then returns a gateway timeout.",
    category: "SOFTWARE",
    priority: "HIGH",
  },
  {
    title: "Laptop battery is swelling and the trackpad lifts",
    description:
      "The battery is visibly bulging and the trackpad has started to lift at the corner. The machine is still under warranty and gets very hot while docked.",
    category: "HARDWARE",
    priority: "CRITICAL",
  },
  {
    title: "Guest Wi-Fi captive portal rejects vendor codes",
    description:
      "Vendors receive the SMS code but the portal says it has expired immediately. Three separate vendors hit this today.",
    category: "NETWORK",
    priority: "MEDIUM",
  },
  {
    title: "Leave balance in the HR portal is wrong",
    description:
      "The portal shows 4 days of casual leave but my approvals add up to 11. Two approved days from August are missing entirely.",
    category: "HR",
    priority: "MEDIUM",
  },
  {
    title: "Slack notifications arrive 10 minutes late",
    description:
      "Messages arrive on time but push notifications are consistently delayed by about ten minutes on both desktop and mobile. This causes missed incident pings.",
    category: "SOFTWARE",
    priority: "LOW",
  },
  {
    title: "Shared backup drive is not mounted after reboot",
    description:
      "The Z: drive mapping disappears every time the workstation restarts. Re-mapping works until the next reboot. The nightly backup script depends on this path.",
    category: "NETWORK",
    priority: "HIGH",
  },
  {
    title: "Second monitor is not detected through the dock",
    description:
      "Only one of two monitors is detected when connected through the USB-C dock. Both work when plugged directly into the laptop ports.",
    category: "HARDWARE",
    priority: "LOW",
  },
  {
    title: "Build server rejects our code-signing certificate",
    description:
      "CI fails at the signing step with a certificate expired error. The certificate was supposed to auto-renew but the thumbprint in the pipeline has not changed.",
    category: "SOFTWARE",
    priority: "HIGH",
  },
  {
    title: "Chrome signs out of every internal app each morning",
    description:
      "Every morning Chrome has cleared the session for all internal web apps. This started when the new proxy policy was rolled out to my machine.",
    category: "ACCESS",
    priority: "MEDIUM",
  },
];

const resolutionNotes = [
  "Root cause confirmed and fixed. Verified with the requester before closing.",
  "Applied the vendor patch, cleared the stale cache and re-tested end to end.",
  "Configuration corrected on the management console; monitoring for 24h showed no recurrence.",
  "Hardware swapped under warranty and the user confirmed everything works.",
  "Access re-provisioned with the correct role and approved by the line manager.",
];

const remarkBodies = [
  "Thanks for reporting this. I have picked it up and will update you within the hour.",
  "Could you confirm the asset tag of the machine so I can check the warranty?",
  "I reproduced this on a test account — escalating to the next level for a deeper fix.",
  "The vendor has been engaged and a patch is scheduled for tonight's maintenance window.",
  "This is resolved from our side. Please confirm and I will close the complaint.",
  "Confirmed resolved, thanks for the quick turnaround.",
  "Internal: the root cause is the stale group membership in the identity provider.",
  "Internal: raised a change request CH-4471 for the firewall rule change.",
];

function hoursFor(priority: string): number {
  switch (priority) {
    case "CRITICAL":
      return 4;
    case "HIGH":
      return 24;
    case "MEDIUM":
      return 72;
    default:
      return 120;
  }
}

async function main() {
  console.log("Clearing existing data…");
  await prisma.statusEvent.deleteMany();
  await prisma.remark.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const created: Record<string, string> = {};
  for (const u of users) {
    const row = await prisma.user.create({
      data: { ...u, passwordHash, active: true },
      select: { id: true, email: true },
    });
    created[u.email] = row.id;
  }
  console.log(`Created ${users.length} demo users (password: ${DEMO_PASSWORD})`);

  const l1 = [created["l1@demo.test"], created["l1b@demo.test"]];
  const l2 = [created["l2@demo.test"], created["l2b@demo.test"]];
  const l3 = [created["l3@demo.test"]];
  const requesters = [created["user@demo.test"], created["user2@demo.test"], created["user3@demo.test"]];
  const adminId = created["admin@demo.test"];

  await prisma.setting.createMany({
    data: [
      { key: "sla_low_hours", value: "120" },
      { key: "sla_medium_hours", value: "72" },
      { key: "sla_high_hours", value: "24" },
      { key: "sla_critical_hours", value: "4" },
      { key: "escalation_l1_hours", value: "24" },
      { key: "escalation_l2_hours", value: "48" },
    ],
  });

  const now = new Date();
  const year = now.getFullYear();
  let seq = 0;

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    seq += 1;
    const reference = `CMS-${year}-${String(seq).padStart(4, "0")}`;

    const roll = random();
    const slaHours = hoursFor(spec.priority);
    let status: string;
    let level: string;
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

    const assigneePool = level === "L1" ? l1 : level === "L2" ? l2 : l3;
    const assigneeId = pick(assigneePool);
    const raisedById = pick(requesters);
    // Closed complaints get a month of history; active ones stay recent so the desk
    // looks alive instead of permanently on fire. Every 13th active complaint is
    // deliberately pushed past its SLA to demo the breach state.
    const isActive = status === "OPEN" || status === "WIP" || status === "HOLD";
    const levelCap = level === "L2" ? 40 : 20;
    const ageHours = !isActive
      ? between(8, 34 * 24)
      : i % 13 === 0
        ? slaHours + between(3, 18)
        : between(1, Math.max(3, Math.min(Math.floor(slaHours * 0.55), levelCap)));

    const createdAt = new Date(now.getTime() - ageHours * HOUR);
    const closedAt = !isActive ? new Date(createdAt.getTime() + between(2, 60) * HOUR) : null;
    const resolvedInMin = status === "CLOSED" && closedAt ? Math.max(30, Math.round((closedAt.getTime() - createdAt.getTime()) / 60000)) : null;
    const dueAt = new Date(createdAt.getTime() + slaHours * HOUR);
    const breached = closedAt ? closedAt > dueAt : now > dueAt;
    // Keep active complaints inside their current escalation window so the demo is
    // stable until a sweep is actually triggered (or the window is lowered in policy).
    const levelChangedAt = isActive
      ? new Date(now.getTime() - Math.min(ageHours, levelCap * 0.8) * HOUR)
      : new Date(createdAt.getTime() + between(1, 20) * HOUR);

    const complaint = await prisma.complaint.create({
      data: {
        reference,
        title: spec.title,
        description: spec.description,
        category: spec.category,
        priority: spec.priority,
        status,
        level,
        raisedById,
        assigneeId,
        createdAt,
        updatedAt: closedAt ?? new Date(createdAt.getTime() + between(1, 20) * HOUR),
        dueAt,
        levelChangedAt,
        closedAt,
        resolvedInMin,
        slaBreached: breached,
        escalatedAt: level === "L1" ? null : levelChangedAt,        escalationCount: level === "L1" ? 0 : level === "L2" ? 1 : 2,
        rating: status === "CLOSED" ? (breached ? between(2, 4) : between(4, 5)) : null,
        feedback:
          status === "CLOSED" && random() < 0.45
            ? pick([
                "Quick turnaround once it reached L2, thank you.",
                "Took a while but the fix has held for a week.",
                "Clear communication throughout.",
                "Resolved, though the first response took most of a day.",
              ])
            : null,
      },
      select: { id: true },
    });

    await prisma.statusEvent.create({
      data: {
        complaintId: complaint.id,
        actorId: raisedById,
        type: "CREATED",
        toValue: "OPEN",
        note: `Raised as ${spec.category} with ${spec.priority.toLowerCase()} priority and a ${slaHours}h SLA.`,
        createdAt,
      },
    });

    await prisma.statusEvent.create({
      data: {
        complaintId: complaint.id,
        actorId: null,
        type: "ASSIGN",
        toValue: assigneeId,
        automated: true,
        note: "Auto-assigned to the least-loaded L1 agent.",
        createdAt: new Date(createdAt.getTime() + 2 * 60 * 1000),
      },
    });

    if (level !== "L1") {
      await prisma.statusEvent.create({
        data: {
          complaintId: complaint.id,
          actorId: null,
          type: "ESCALATION",
          fromValue: "L1",
          toValue: level,
          automated: true,
          note: `Escalated from L1 to ${level} automatically by the SLA watchdog.`,
          createdAt: levelChangedAt,
        },
      });
    }

    if (status !== "OPEN") {
      await prisma.statusEvent.create({
        data: {
          complaintId: complaint.id,
          actorId: assigneeId,
          type: "STATUS",
          fromValue: "OPEN",
          toValue: status === "CLOSED" ? "WIP" : status,
          note: status === "HOLD" ? "Waiting on the requester for more detail." : "Investigation started.",
          createdAt: new Date(createdAt.getTime() + between(1, 8) * HOUR),
        },
      });
    }

    if (closedAt) {
      await prisma.statusEvent.create({
        data: {
          complaintId: complaint.id,
          actorId: assigneeId,
          type: "STATUS",
          fromValue: "WIP",
          toValue: status,
          note: status === "CLOSED" ? pick(resolutionNotes) : "Duplicate of an existing complaint; closed with a reference.",
          createdAt: closedAt,
        },
      });
    }

    const remarkCount = between(0, 3);
    for (let r = 0; r < remarkCount; r++) {
      const fromStaff = random() < 0.6;
      const internal = fromStaff && random() < 0.3;
      const at = new Date(createdAt.getTime() + between(1, 30) * HOUR);
      await prisma.remark.create({
        data: {
          complaintId: complaint.id,
          authorId: fromStaff ? assigneeId : raisedById,
          body: internal ? pick(remarkBodies.slice(6)) : pick(remarkBodies.slice(0, 6)),
          internal,
          createdAt: at,
        },
      });
      await prisma.statusEvent.create({
        data: {
          complaintId: complaint.id,
          actorId: fromStaff ? assigneeId : raisedById,
          type: "REMARK",
          toValue: internal ? "INTERNAL_NOTE" : "PUBLIC_REPLY",
          note: "Comment added to the timeline.",
          createdAt: at,
        },
      });
    }

    // A small text attachment on every fifth complaint.
    if (i % 5 === 0) {
      const body = `Attachment for ${reference}\n\n${spec.title}\n\nCaptured by the requester on ${createdAt.toISOString().slice(0, 10)}.\n`;
      await prisma.attachment.create({
        data: {
          complaintId: complaint.id,
          filename: `${reference.toLowerCase()}-evidence.txt`,
          mimeType: "text/plain",
          size: Buffer.byteLength(body),
          data: new Uint8Array(Buffer.from(body)),
          uploadedById: raisedById,
          createdAt,
        },
      });
    }
  }

  await prisma.setting.upsert({
    where: { key: `complaint_seq_${year}` },
    create: { key: `complaint_seq_${year}`, value: String(seq) },
    update: { value: String(seq) },
  });

  // Notifications for the primary requester and the service desk.
  const unread = [
    { userId: created["user@demo.test"], title: "Support replied to your complaint", body: "Please confirm whether the fix is holding before we close it.", href: "/complaints" },
    { userId: created["user@demo.test"], title: "Your complaint was escalated to L2", body: "The SLA watchdog moved your complaint up a level to speed things up.", href: "/complaints" },
    { userId: created["l1@demo.test"], title: "New high priority complaint", body: "A high priority complaint has landed in the queue.", href: "/complaints" },
    { userId: adminId, title: "Weekly SLA report is ready", body: "Three complaints breached their SLA window this week.", href: "/analytics" },
  ];
  await prisma.notification.createMany({ data: unread });

  const counts = await prisma.complaint.groupBy({ by: ["status"], _count: { _all: true } });
  console.log("Complaints seeded:", counts.map((c) => `${c.status}=${c._count._all}`).join(", "));
  console.log("Demo accounts:");
  for (const u of users) console.log(`  ${u.role.padEnd(5)} ${u.email.padEnd(18)} ${u.name}`);
  console.log(`Password for all demo accounts: ${DEMO_PASSWORD}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
