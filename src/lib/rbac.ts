import type { Level, Role, Status } from "./constants";
import { ACTIVE_STATUSES, LEVELS, TRANSITIONS } from "./constants";

export type Viewer = {
  id: string;
  role: Role;
  level: Level | null;
};

/** Roles that can work complaints. */
export function isStaff(role: Role): boolean {
  return role === "L1" || role === "L2" || role === "L3" || role === "ADMIN";
}

/** Numeric rank of a support level, or 0 for requesters. */
export function levelRank(level: Level | null): number {
  if (!level) return 0;
  return LEVELS.indexOf(level) + 1;
}

export function roleToLevel(role: Role): Level | null {
  return role === "L1" || role === "L2" || role === "L3" ? role : null;
}

type ComplaintScope = {
  raisedById: string;
  assigneeId: string | null;
  level: string;
  status: string;
};

/** Whether a viewer may open a complaint at all. */
export function canView(viewer: Viewer, complaint: ComplaintScope): boolean {
  if (viewer.role === "ADMIN") return true;
  if (complaint.raisedById === viewer.id) return true;
  if (!isStaff(viewer.role)) return false;
  if (complaint.assigneeId === viewer.id) return true;
  return levelRank(viewer.level) >= levelRank(complaint.level as Level);
}

/** Prisma `where` fragment limiting a viewer to their visible complaints. */
export function visibleComplaintFilter(viewer: Viewer): Record<string, unknown> {
  if (viewer.role === "ADMIN") return {};
  if (viewer.role === "USER") return { raisedById: viewer.id };
  const rank = levelRank(viewer.level);
  const reachable = LEVELS.slice(0, rank);
  return {
    OR: [
      { raisedById: viewer.id },
      { assigneeId: viewer.id },
      { level: { in: reachable } },
    ],
  };
}

export function canComment(viewer: Viewer, complaint: ComplaintScope): boolean {
  return canView(viewer, complaint);
}

/** Internal notes are staff-only; requesters never see them. */
export function canWriteInternalNote(role: Role): boolean {
  return isStaff(role);
}

export function canChangeStatus(viewer: Viewer, complaint: ComplaintScope): boolean {
  if (viewer.role === "ADMIN") return true;
  if (!isStaff(viewer.role)) return false;
  if (complaint.assigneeId === viewer.id) return true;
  return levelRank(viewer.level) >= levelRank(complaint.level as Level);
}

/** The statuses a viewer may move this complaint into right now. */
export function allowedTransitions(viewer: Viewer, complaint: ComplaintScope): Status[] {
  if (!canChangeStatus(viewer, complaint)) return [];
  const current = complaint.status as Status;
  const base = TRANSITIONS[current] ?? [];
  if (viewer.role === "USER") return [];
  return base;
}

/** Requesters may confirm (close) their own resolved complaint or reopen a closed one. */
export function requesterActions(viewer: Viewer, complaint: ComplaintScope): ("close" | "reopen")[] {
  if (viewer.id !== complaint.raisedById) return [];
  if (complaint.status === "CLOSED") return ["reopen"];
  if (complaint.status === "WIP") return ["close"];
  return [];
}

export function canAssign(viewer: Viewer): boolean {
  return viewer.role === "L2" || viewer.role === "L3" || viewer.role === "ADMIN";
}

export function canEscalate(viewer: Viewer, complaint: ComplaintScope): boolean {
  if (complaint.status === "CLOSED" || complaint.status === "REJECTED") return false;
  if (!canView(viewer, complaint)) return false;
  if (viewer.role === "ADMIN") return true;
  if (!isStaff(viewer.role)) return false;
  return levelRank(viewer.level) >= levelRank(complaint.level as Level);
}

export function canManageUsers(role: Role): boolean {
  return role === "ADMIN";
}

export function canManageSettings(role: Role): boolean {
  return role === "ADMIN";
}

export function canGiveFeedback(viewer: Viewer, complaint: ComplaintScope): boolean {
  return complaint.raisedById === viewer.id && complaint.status === "CLOSED";
}

/** A requester or admin may delete nothing in this product; kept for clarity in UI code. */
export function isActiveStatus(status: string): boolean {
  return ACTIVE_STATUSES.includes(status as Status);
}
