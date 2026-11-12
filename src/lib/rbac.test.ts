import { describe, expect, it } from "vitest";
import {
  allowedTransitions,
  canAssign,
  canChangeStatus,
  canComment,
  canEscalate,
  canGiveFeedback,
  canManageUsers,
  canView,
  canWriteInternalNote,
  levelRank,
  requesterActions,
  roleToLevel,
  visibleComplaintFilter,
  type Viewer,
} from "./rbac";

const requester: Viewer = { id: "u1", role: "USER", level: null };
const otherRequester: Viewer = { id: "u2", role: "USER", level: null };
const l1: Viewer = { id: "a1", role: "L1", level: "L1" };
const l2: Viewer = { id: "a2", role: "L2", level: "L2" };
const l3: Viewer = { id: "a3", role: "L3", level: "L3" };
const admin: Viewer = { id: "ad", role: "ADMIN", level: null };

const complaint = {
  raisedById: "u1",
  assigneeId: "a1",
  level: "L1",
  status: "OPEN",
};

describe("levels", () => {
  it("ranks the ladder", () => {
    expect(levelRank(null)).toBe(0);
    expect(levelRank("L1")).toBe(1);
    expect(levelRank("L3")).toBe(3);
  });

  it("maps staff roles to levels", () => {
    expect(roleToLevel("L2")).toBe("L2");
    expect(roleToLevel("ADMIN")).toBeNull();
    expect(roleToLevel("USER")).toBeNull();
  });
});

describe("canView", () => {
  it("lets the requester see their own complaint", () => {
    expect(canView(requester, complaint)).toBe(true);
  });

  it("hides it from an unrelated requester", () => {
    expect(canView(otherRequester, complaint)).toBe(false);
  });

  it("lets the assignee and higher levels see it", () => {
    expect(canView(l1, complaint)).toBe(true);
    expect(canView(l2, complaint)).toBe(true);
    expect(canView(l3, complaint)).toBe(true);
  });

  it("always lets an admin see it", () => {
    expect(canView(admin, complaint)).toBe(true);
  });
});

describe("comments and internal notes", () => {
  it("only allows staff internal notes", () => {
    expect(canWriteInternalNote("L1")).toBe(true);
    expect(canWriteInternalNote("ADMIN")).toBe(true);
    expect(canWriteInternalNote("USER")).toBe(false);
  });

  it("lets anyone who can view comment", () => {
    expect(canComment(l1, complaint)).toBe(true);
    expect(canComment(otherRequester, complaint)).toBe(false);
  });
});

describe("status changes", () => {
  it("allows the assignee to move an open complaint", () => {
    expect(canChangeStatus(l1, complaint)).toBe(true);
    expect(allowedTransitions(l1, complaint)).toEqual(["WIP", "HOLD", "REJECTED"]);
  });

  it("blocks requesters from staff actions", () => {
    expect(canChangeStatus(requester, complaint)).toBe(false);
    expect(allowedTransitions(requester, complaint)).toEqual([]);
  });

  it("offers no transitions out of a terminal state", () => {
    expect(allowedTransitions(l2, { ...complaint, status: "CLOSED" })).toEqual([]);
  });

  it("lets a requester confirm a fix or reopen a closed complaint", () => {
    expect(requesterActions(requester, { ...complaint, status: "WIP" })).toContain("close");
    expect(requesterActions(requester, { ...complaint, status: "CLOSED" })).toContain("reopen");
    expect(requesterActions(otherRequester, { ...complaint, status: "CLOSED" })).toEqual([]);
  });
});

describe("assignment, escalation and admin", () => {
  it("only lets L2+ reassign", () => {
    expect(canAssign(l1)).toBe(false);
    expect(canAssign(l2)).toBe(true);
    expect(canAssign(admin)).toBe(true);
  });

  it("lets the assigned agent escalate but not a requester", () => {
    expect(canEscalate(l1, complaint)).toBe(true);
    expect(canEscalate(requester, complaint)).toBe(false);
  });

  it("never escalates terminal complaints", () => {
    expect(canEscalate(admin, { ...complaint, status: "CLOSED" })).toBe(false);
  });

  it("keeps admin tools admin-only", () => {
    expect(canManageUsers("ADMIN")).toBe(true);
    expect(canManageUsers("L2")).toBe(false);
  });

  it("only accepts feedback from the requester on a closed complaint", () => {
    expect(canGiveFeedback(requester, { ...complaint, status: "CLOSED" })).toBe(true);
    expect(canGiveFeedback(requester, { ...complaint, status: "OPEN" })).toBe(false);
    expect(canGiveFeedback(l1, { ...complaint, status: "CLOSED" })).toBe(false);
  });
});

describe("visibleComplaintFilter", () => {
  it("scopes requesters to their own complaints", () => {
    expect(visibleComplaintFilter(requester)).toEqual({ raisedById: "u1" });
  });

  it("gives admins an unfiltered query", () => {
    expect(visibleComplaintFilter(admin)).toEqual({});
  });

  it("scopes L2 staff to L1 and L2 complaints", () => {
    const filter = visibleComplaintFilter(l2) as { OR: { level?: { in: string[] } }[] };
    expect(filter.OR.some((clause) => clause.level?.in.includes("L2"))).toBe(true);
    expect(filter.OR.some((clause) => clause.level?.in.includes("L3"))).toBe(false);
  });
});
