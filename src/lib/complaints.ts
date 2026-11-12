import { prisma } from "./db";
import type { Category, Level, Priority, Status } from "./constants";
import { ACTIVE_STATUSES, CATEGORY_LABELS, PRIORITY_META } from "./constants";
import { pickAssignee } from "./assign";
import { nextLevel, shouldEscalate } from "./escalation";
import { HttpError } from "./http";
import { notifyLevel, notifyUser } from "./notify";
import { nextReference } from "./reference";
import type { Viewer } from "./rbac";
import { canAssign, canChangeStatus, canEscalate, canView, levelRank } from "./rbac";
import { getSettings } from "./settings";
import { dueAt, minutesBetween } from "./sla";

export type UploadInput = {
  filename: string;
  mimeType: string;
  size: number;
  data: Buffer;
};

export type CreateComplaintInput = {
  title: string;
  description: string;
  category: Category;
  priority: Priority;
};

/** Raises a complaint, auto-assigns it to the least loaded L1 agent and records the audit trail. */
export async function createComplaint(
  viewer: Viewer,
  input: CreateComplaintInput,
  files: UploadInput[] = [],
) {
  const settings = await getSettings();
  const now = new Date();
  const assigneeId = await pickAssignee("L1");

  const complaint = await prisma.$transaction(async (tx) => {
    const reference = await nextReference(tx);
    return tx.complaint.create({
      data: {
        reference,
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        status: "OPEN",
        level: "L1",
        raisedById: viewer.id,
        assigneeId,
        createdAt: now,
        updatedAt: now,
        levelChangedAt: now,
        dueAt: dueAt(now, input.priority, settings.sla),
        ...(files.length > 0
          ? {
              attachments: {
                create: files.map((file) => ({
                  filename: file.filename,
                  mimeType: file.mimeType,
                  size: file.size,
                  data: new Uint8Array(file.data),
                  uploadedById: viewer.id,
                })),
              },
            }
          : {}),
        history: {
          create: [
            {
              actorId: viewer.id,
              type: "CREATED",
              toValue: "OPEN",
              note: `Raised as ${CATEGORY_LABELS[input.category]} with ${input.priority.toLowerCase()} priority and a ${PRIORITY_META[input.priority].slaHours}h SLA.`,
            },
            ...(assigneeId
              ? [
                  {
                    actorId: null,
                    type: "ASSIGN",
                    toValue: assigneeId,
                    automated: true,
                    note: "Auto-assigned to the least-loaded L1 agent.",
                  },
                ]
              : []),
          ],
        },
      },
      select: { id: true, reference: true, title: true, priority: true, level: true, assigneeId: true },
    });
  });

  await notifyUser(complaint.assigneeId, {
    title: `New ${complaint.priority.toLowerCase()} priority complaint`,
    body: `${complaint.reference} · ${complaint.title}`,
    href: `/complaints/${complaint.id}`,
  });
  await notifyUser(viewer.id, {
    title: `Complaint ${complaint.reference} received`,
    body: "Your complaint is queued with the L1 service desk. You can track every change from this page.",
    href: `/complaints/${complaint.id}`,
  });

  return complaint;
}

async function loadComplaint(complaintId: string) {
  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint) throw new HttpError(404, "Complaint not found");
  return complaint;
}

/** Adds a public reply or an internal note to the timeline. */
export async function addRemark(
  viewer: Viewer,
  complaintId: string,
  body: string,
  internal: boolean,
) {
  const complaint = await loadComplaint(complaintId);
  if (!canView(viewer, complaint)) throw new HttpError(403, "You cannot comment on this complaint");

  const isStaff = viewer.role !== "USER";
  if (internal && !isStaff) throw new HttpError(403, "Only support staff can post internal notes");

  const remark = await prisma.$transaction(async (tx) => {
    const created = await tx.remark.create({
      data: { complaintId, authorId: viewer.id, body, internal },
      select: { id: true },
    });
    await tx.statusEvent.create({
      data: {
        complaintId,
        actorId: viewer.id,
        type: "REMARK",
        toValue: internal ? "INTERNAL_NOTE" : "PUBLIC_REPLY",
        note: body.slice(0, 160),
      },
    });
    await tx.complaint.update({ where: { id: complaintId }, data: { updatedAt: new Date() } });
    return created;
  });

  if (!internal) {
    if (viewer.id === complaint.raisedById) {
      await notifyUser(complaint.assigneeId, {
        title: "New reply on your complaint",
        body: body.slice(0, 120),
        href: `/complaints/${complaintId}`,
      });
    } else {
      await notifyUser(complaint.raisedById, {
        title: "Support replied to your complaint",
        body: body.slice(0, 120),
        href: `/complaints/${complaintId}`,
      });
    }
  }

  return remark;
}

export async function changeStatus(
  viewer: Viewer,
  complaintId: string,
  nextStatus: Status,
  note?: string,
) {
  const complaint = await loadComplaint(complaintId);
  const settings = await getSettings();
  const now = new Date();
  const isRequester = viewer.id === complaint.raisedById;

  // Requesters may confirm a resolution or reopen a terminal complaint.
  const requesterClose = isRequester && nextStatus === "CLOSED" && complaint.status === "WIP";
  const requesterReopen =
    isRequester && nextStatus === "OPEN" && (complaint.status === "CLOSED" || complaint.status === "REJECTED");

  if (!requesterClose && !requesterReopen) {
    if (!canChangeStatus(viewer, complaint)) {
      throw new HttpError(403, "You are not allowed to change this complaint's status");
    }
    const allowed: Record<string, string[]> = {
      OPEN: ["WIP", "HOLD", "REJECTED"],
      WIP: ["HOLD", "CLOSED", "REJECTED"],
      HOLD: ["WIP", "CLOSED", "REJECTED"],
      CLOSED: [],
      REJECTED: [],
    };
    if (!(allowed[complaint.status] ?? []).includes(nextStatus)) {
      throw new HttpError(409, `Cannot move a ${complaint.status} complaint to ${nextStatus}`);
    }
  }

  const data: Record<string, unknown> = { status: nextStatus, updatedAt: now };

  if (requesterReopen) {
    data.closedAt = null;
    data.resolvedInMin = null;
    data.reopenedCount = (complaint.reopenedCount ?? 0) + 1;
    data.dueAt = dueAt(now, complaint.priority as Priority, settings.sla);
    data.levelChangedAt = now;
    data.slaBreached = false;
  }

  if (nextStatus === "CLOSED" || nextStatus === "REJECTED") {
    data.closedAt = now;
    data.resolvedInMin = nextStatus === "CLOSED" ? minutesBetween(complaint.createdAt, now) : null;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.complaint.update({ where: { id: complaintId }, data });
    await tx.statusEvent.create({
      data: {
        complaintId,
        actorId: viewer.id,
        type: "STATUS",
        fromValue: complaint.status,
        toValue: nextStatus,
        note:
          note ||
          (requesterReopen
            ? "Reopened by the requester — the SLA window restarts."
            : requesterClose
              ? "Resolution confirmed by the requester."
              : `Moved from ${complaint.status} to ${nextStatus}.`),
      },
    });
    return result;
  });

  await notifyUser(complaint.raisedById, {
    title: `${complaint.reference} is now ${nextStatus.toLowerCase()}`,
    body: note?.slice(0, 120) || `Status changed from ${complaint.status} to ${nextStatus}.`,
    href: `/complaints/${complaintId}`,
  });
  if (complaint.assigneeId && complaint.assigneeId !== complaint.raisedById) {
    await notifyUser(complaint.assigneeId, {
      title: `${complaint.reference} is now ${nextStatus.toLowerCase()}`,
      body: `Updated by ${viewer.role}.`,
      href: `/complaints/${complaintId}`,
    });
  }

  return updated;
}

export async function assignComplaint(
  viewer: Viewer,
  complaintId: string,
  assigneeId: string | null,
  note?: string,
) {
  if (!canAssign(viewer)) throw new HttpError(403, "Only L2, L3 and admins can reassign complaints");
  const complaint = await loadComplaint(complaintId);

  let targetName = "Unassigned";
  if (assigneeId) {
    const target = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (!target || !target.active) throw new HttpError(422, "That assignee is not available");
    targetName = target.name;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.complaint.update({
      where: { id: complaintId },
      data: { assigneeId, updatedAt: new Date() },
    });
    await tx.statusEvent.create({
      data: {
        complaintId,
        actorId: viewer.id,
        type: "ASSIGN",
        fromValue: complaint.assigneeId,
        toValue: assigneeId,
        note: note || `Reassigned to ${targetName}.`,
      },
    });
    return result;
  });

  await notifyUser(assigneeId, {
    title: `You were assigned ${complaint.reference}`,
    body: complaint.title,
    href: `/complaints/${complaintId}`,
  });

  return updated;
}

/** Moves a complaint one level up. Used by the admin action and by the cron job. */
export async function escalateComplaint(
  complaintId: string,
  actorId: string | null,
  automated: boolean,
  note?: string,
) {
  const complaint = await loadComplaint(complaintId);
  if (complaint.status === "CLOSED" || complaint.status === "REJECTED") {
    throw new HttpError(409, "Closed complaints cannot be escalated");
  }
  const target = nextLevel(complaint.level);
  if (!target) throw new HttpError(409, "This complaint is already at L3");

  const now = new Date();
  const newAssignee = await pickAssignee(target, complaint.assigneeId ?? undefined);

  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaintId },
      data: {
        level: target,
        levelChangedAt: now,
        escalatedAt: now,
        escalationCount: { increment: 1 },
        assigneeId: newAssignee ?? null,
        updatedAt: now,
      },
    });
    await tx.statusEvent.create({
      data: {
        complaintId,
        actorId,
        type: "ESCALATION",
        fromValue: complaint.level,
        toValue: target,
        automated,
        note:
          note ||
          `Escalated from ${complaint.level} to ${target}${automated ? " automatically by the SLA watchdog" : ""}.`,
      },
    });
  });

  await notifyLevel(target as Level, {
    title: `Escalated to ${target}: ${complaint.reference}`,
    body: complaint.title,
    href: `/complaints/${complaintId}`,
  });
  await notifyUser(complaint.raisedById, {
    title: `${complaint.reference} escalated to ${target}`,
    body: "Your complaint has been moved to a higher support level to speed up resolution.",
    href: `/complaints/${complaintId}`,
  });

  return { level: target, assigneeId: newAssignee };
}

export async function escalateAsViewer(viewer: Viewer, complaintId: string, note?: string) {
  const complaint = await loadComplaint(complaintId);
  if (!canEscalate(viewer, complaint)) throw new HttpError(403, "You cannot escalate this complaint");
  return escalateComplaint(complaintId, viewer.id, false, note);
}

/**
 * The SLA watchdog. Escalates every complaint that has sat at L1 or L2 past its
 * policy window. Safe to call repeatedly — escalation only happens once per window.
 */
export async function runEscalations(now: Date = new Date()) {
  const settings = await getSettings();
  const candidates = await prisma.complaint.findMany({
    where: { status: { in: ACTIVE_STATUSES }, level: { in: ["L1", "L2"] } },
    select: { id: true, reference: true, status: true, level: true, levelChangedAt: true },
  });

  const due = candidates.filter((c) =>
    shouldEscalate({
      status: c.status,
      level: c.level,
      levelChangedAt: c.levelChangedAt,
      now,
      policy: settings.escalation,
    }),
  );

  const escalated: { id: string; reference: string; from: string; to: string }[] = [];
  for (const complaint of due) {
    const result = await escalateComplaint(complaint.id, null, true);
    escalated.push({ id: complaint.id, reference: complaint.reference, from: complaint.level, to: result.level });
  }

  // Flag anything already past its due date so the dashboard can surface it.
  await prisma.complaint.updateMany({
    where: { status: { in: ACTIVE_STATUSES }, dueAt: { lt: now }, slaBreached: false },
    data: { slaBreached: true },
  });

  return { scanned: candidates.length, escalated };
}

export async function addFeedback(
  viewer: Viewer,
  complaintId: string,
  rating: number,
  feedback?: string,
) {
  const complaint = await loadComplaint(complaintId);
  if (complaint.raisedById !== viewer.id) throw new HttpError(403, "Only the requester can rate this complaint");
  if (complaint.status !== "CLOSED") throw new HttpError(409, "You can rate a complaint once it is closed");

  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({ where: { id: complaintId }, data: { rating, feedback: feedback ?? null } });
    await tx.statusEvent.create({
      data: {
        complaintId,
        actorId: viewer.id,
        type: "FEEDBACK",
        toValue: String(rating),
        note: feedback || `Rated ${rating}/5.`,
      },
    });
  });

  return { rating };
}

/** Complaint ids a viewer may see, used by list endpoints. */
export async function assertVisible(viewer: Viewer, complaintId: string) {
  const complaint = await loadComplaint(complaintId);
  if (!canView(viewer, complaint)) throw new HttpError(404, "Complaint not found");
  return complaint;
}

export function levelRankOf(level: string): number {
  return levelRank(level as Level);
}
